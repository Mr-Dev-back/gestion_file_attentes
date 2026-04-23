from fastapi import FastAPI
import uvicorn
from contextlib import asynccontextmanager
import asyncio
import logging
from gtts import gTTS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Service FastAPI démarré")
    try:
        yield
    except asyncio.CancelledError:
        logger.warning("Lifespan annulé (CancelledError)")
        raise
    finally:
        logger.info("Arrêt du service")

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Hello World"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8082)
