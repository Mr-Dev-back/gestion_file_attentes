import io
import logging
import os

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from gtts import gTTS
from pydantic import BaseModel, Field

# ─────────────────────────────────────────────
# Logging structuré
# [AMÉLIORATION 7] Remplace les print() par logging standard
# ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("gfa-sibm-tts")

# ─────────────────────────────────────────────
# Configuration via variables d'environnement
# [AMÉLIORATION 6] CORS origins piloté par env, pas hardcodé
# ─────────────────────────────────────────────
ALLOWED_ORIGINS: list[str] = os.getenv("ALLOWED_ORIGINS", "*").split(",")
TTS_MAX_TEXT_LENGTH: int = int(os.getenv("TTS_MAX_TEXT_LENGTH", "500"))

# ─────────────────────────────────────────────
# Langues supportées par gTTS
# ─────────────────────────────────────────────
SUPPORTED_LANGS = {"fr", "en", "ar", "es", "de", "it", "pt"}

# ─────────────────────────────────────────────
# Application
# ─────────────────────────────────────────────
app = FastAPI(
    title="GFA SIBM - FastAPI Service",
    version="1.0.0",
    description="Service Python pour gTTS et traitement avancé",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Modèles Pydantic
# ─────────────────────────────────────────────

# [AMÉLIORATION 5] Schéma Pydantic pour /process/weighing
class WeighingData(BaseModel):
    vehicle_id: str = Field(..., description="Identifiant du véhicule")
    gross_weight: float = Field(..., gt=0, description="Poids brut en kg")
    tare_weight: float = Field(..., gt=0, description="Tare en kg")
    operator_id: str | None = Field(None, description="Identifiant de l'opérateur")
    notes: str | None = Field(None, max_length=500)


# [AMÉLIORATION 5] Schéma Pydantic pour /announce
class AnnounceRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=TTS_MAX_TEXT_LENGTH, description="Texte à annoncer")
    lang: str = Field("fr", description="Langue de l'annonce")
    priority: str = Field("normal", description="Priorité de l'annonce")


# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "service": "GFA SIBM FastAPI Service",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health")
async def health():
    """
    [AMÉLIORATION 2] Statuts honnêtes — pas de faux 'connected' hardcodé.
    À enrichir avec de vraies vérifications si DB/Redis sont ajoutés.
    """
    return {
        "status": "healthy",
        # "database": "not_configured",  # Décommenter et implémenter si besoin
        # "redis": "not_configured",
    }


@app.post("/process/weighing")
async def process_weighing(data: WeighingData):
    """
    [AMÉLIORATION 5] Validation Pydantic — payload typé et contraint.
    Traitement avancé des données de pesée.
    """
    net_weight = data.gross_weight - data.tare_weight

    if net_weight < 0:
        raise HTTPException(status_code=422, detail="Le poids net ne peut pas être négatif.")

    logger.info(
        "Pesée traitée — véhicule: %s | brut: %.2f kg | tare: %.2f kg | net: %.2f kg",
        data.vehicle_id, data.gross_weight, data.tare_weight, net_weight,
    )

    return {
        "status": "processed",
        "vehicle_id": data.vehicle_id,
        "net_weight": net_weight,
    }


@app.post("/announce")
async def announce(data: AnnounceRequest):
    """
    [AMÉLIORATION 5 + 7] Payload validé par Pydantic, logging structuré.
    Reçoit les demandes d'annonces vocales depuis le backend Node.js.
    """
    logger.info("Annonce reçue [%s] (%s) : %s", data.priority, data.lang, data.text)

    return {
        "status": "success",
        "received": True,
        "text": data.text,
    }


@app.get("/tts")
async def text_to_speech(
    text: str = Query(..., description="Le texte à convertir en voix"),
    # [AMÉLIORATION 4] lang exposé en paramètre — plus hardcodé à 'fr'
    lang: str = Query("fr", description="Langue (fr, en, ar, es, de, it, pt)"),
):
    """
    [AMÉLIORATION 1, 3, 4] Génère un flux audio MP3 à partir d'un texte.
    - Erreurs remontées via HTTPException (plus de dict JSON avec status 200)
    - Longueur du texte limitée par TTS_MAX_TEXT_LENGTH
    - Langue paramétrable
    """
    # [AMÉLIORATION 3] Validation de la longueur du texte
    if len(text) > TTS_MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Le texte dépasse la longueur maximale autorisée ({TTS_MAX_TEXT_LENGTH} caractères).",
        )

    # [AMÉLIORATION 4] Validation de la langue
    if lang not in SUPPORTED_LANGS:
        raise HTTPException(
            status_code=400,
            detail=f"Langue '{lang}' non supportée. Langues disponibles : {', '.join(sorted(SUPPORTED_LANGS))}.",
        )

    try:
        tts = gTTS(text=text, lang=lang)
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)

        logger.info("TTS généré — lang: %s | longueur: %d caractères", lang, len(text))

        return StreamingResponse(
            mp3_fp,
            media_type="audio/mpeg",
            headers={"Cache-Control": "no-store"},
        )

    # [AMÉLIORATION 1] HTTPException au lieu d'un dict JSON avec status 200
    except Exception as e:
        logger.error("Erreur TTS : %s", str(e))
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération audio : {str(e)}")


# ─────────────────────────────────────────────
# Lancement direct
# ─────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8082")),
        reload=os.getenv("ENV", "production") == "development",
        log_level="info",
    )