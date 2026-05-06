# Analyse des fonctionnalités — PROJET-GFA (GesParc)

Date d’analyse : 2026-05-05  
Périmètre : `backend/` (Node/Express), `frontend/` (React), `fastapi/` (Python), docs et scripts.

## Méthode (comment le statut est déterminé)

- **Implémentée** : une fonctionnalité a des endpoints backend **et** une UI/usage frontend cohérent, sans écran “placeholder”/route manquante repérée.
- **Partielle / en cours** : endpoints existants mais UI incomplète (placeholder), ou UI existante mais intégration incohérente (routes manquantes, rôles incohérents, store legacy, scripts non alignés).
- **Non couverte** : mentionnée dans la doc/menus mais pas retrouvée dans les routes/pages (ou uniquement sous forme de placeholder).

> Note : cette analyse est statique (lecture du code). Elle ne valide pas l’exécution en environnement réel.

---

## 1) Cartographie — Backend (`backend/src/server.js`)

Base API : `/api/*` (Swagger : `/api-docs`, health : `/health` et `/api/health`).

### Auth & Sessions (`/api/auth`)
- `POST /login`, `POST /logout`, `POST /refresh-token`
- `POST /forgot-password`, `POST /reset-password`
- `GET /me`
Statut : **Implémentée** (login + refresh + reset présents ; inscription publique volontairement désactivée).

### Utilisateurs (`/api/users`)
- CRUD + bulk delete + bulk status
- Historique connexions : `GET /:id/history`
- Sessions : `GET /:id/sessions`, révocation `DELETE /sessions/:sessionId`
Statut : **Implémentée** (UI admin dédiée : `UserManager`).

### Tickets / file d’attente (moteur workflow) (`/api/tickets`)
Endpoints principaux :
- Création ticket `POST /`
- Validation commande `GET /validate-order/:orderNumber`
- Impression (log) `POST /:ticketId/log-print`
- Liste `GET /` + liste par file `GET /queue/:queueId`
- Actions : `PATCH /:ticketId/call|recall|process|assign|priority|isolate|transfer|jump`, `POST /:ticketId/cancel|force-step`
- Données dynamiques : `GET /:ticketId/step-config|full-history`, `GET /quai-history/:quaiId`
- Validation d’étape (agnostique) : `POST /:ticketId/complete`
Statut : **Implémentée** (cœur du produit ; utilisée par `Entry`, `OperationalDashboard`, `SmartQuai`, `QueueView`, TV publique, reporting).

### Quais (`/api/quais`)
- Gestion des quais et paramètres (selon controller / UI `QuaiParameterManager`)
Statut : **Implémentée** (mais voir “Rôles incohérents” plus bas : usage de `EXPLOITATION`).

### Files d’attente (`/api/queues`)
- CRUD et gestion associée (UI admin `QueueManager`)
Statut : **Implémentée**.

### Catégories (`/api/categories`)
- CRUD + bulk delete + bulk status (UI admin `CategoryManager`)
Statut : **Implémentée**.

### Workflows (`/api/workflows`)
- CRUD workflows + steps + reorder (UI admin `WorkflowManager` + éditeur)
Statut : **Implémentée**.

### Kiosks / Bornes (`/api/kiosks`)
- Public config : `GET /public/:id` (utilisé par `Entry` via `/kiosk/:kioskId`)
- Admin : list + history + CRUD + bulk (UI admin `KioskManager`)
Statut : **Implémentée**.

### Affichage public (TV) (`/api/public/display`)
- Sites : `GET /sites`
- Données écran : `GET /:siteId`
Statut : **Implémentée** (utilisé par `PublicTV`).

### Reporting / Analytics (`/api/analytics`)
- `GET /stats`, `GET /reports`, `GET /tickets`, `GET /export`
Statut : **Implémentée** (utilisé par `Reporting` + dashboards analytics).

### Audit (`/api/audit`)
- `GET /logs`, `GET /actions`
Statut : **Implémentée côté admin** (UI admin `AuditLogs`).

### RBAC / Permissions (`/api/roles`, `/api/permissions`)
- Gestion des rôles/permissions/ressources (UI admin `RolePermissionManager` + ResourceManager)
Statut : **Implémentée**.

### Dashboards (KPIs) (`/api/dashboard`)
- Admin : `/admin/*`, Supervisor : `/supervisor/*`, Manager : `/manager/*`
- Aussi : `/sales/*`, `/control/*` (autorisés pour `AGENT_QUAI`/superviseur/admin)
Statut : **Implémentée** (consommée par hooks dashboard côté frontend).

### Tracking (`/api/tracking`)
- Endpoint principal + debug latest (utilisé par `LiveTracking`)
Statut : **Implémentée**.

---

## 2) Cartographie — Frontend (routes UI)

Fichier principal : `frontend/src/App.tsx`

### Accès public
- `/` et `/kiosk/:kioskId` → `Entry` (création ticket via borne)
- `/tv` → `PublicTV` (affichage appelé/en attente + audio)
- Auth : `/login`, `/forgot-password`, `/reset-password`
Statut : **Implémentée**.

### Espace opérationnel (protégé)
- `/operational` → `OperationalDashboard` (traitement des tickets selon workflow)
- `/quai/:quaiId` → `SmartQuai` (poste quai full-screen)
- `/queue` → `QueueView` (vue globale file d’attente)
Statut : **Implémentée**.

### Espace Admin (protégé)
- `/dashboard/admin` → `AdminDashboard`
- `/admin/*` → `Admin` avec sous-sections : stats/reports, audit, workflows, queues, categories, quais, kiosks, settings, companies, sites, users, roles/permissions
Statut : **Implémentée** (administration fonctionnelle).

### Espace Supervisor (protégé) — `frontend/src/pages/Supervisor.tsx`
- `workflow-view` → `SupervisorTactical`
- `live-tracking` → `LiveTracking`
- `dashboard` → `SupervisorDashboard`
- `search` → **placeholder** (non achevé)
Statut : **Partielle / en cours**.

### Espace Manager (protégé) — `frontend/src/pages/Manager.tsx`
- `map` → `SiteMap`
- `dashboard` → `ManagerDashboard`
- `benchmark` → `CategoryDistribution`
- `workflows/monitor` → `WorkflowMonitor`
- `reports` et `history` → `ArchiveSearch`
- `alerts` → **placeholder** (non achevé)
- `stats/timing` → **placeholder** (non achevé)
- `audit` → **placeholder** (non achevé)
Statut : **Partielle / en cours**.

### Reporting
- `/reporting` → `Reporting` (analytics + exports + tables)
Statut : **Implémentée**.

---

## 3) Cartographie — FastAPI (`fastapi/main.py`)

Base (via Nginx en prod) : `/fastapi/*`

- `GET /fastapi/health` : health
- `GET /fastapi/tts?text=...&lang=...` : génération MP3 via gTTS (utilisé par `PublicTV` et `frontend/src/lib/voice.ts`)
- `POST /fastapi/announce` : réception d’annonce (actuellement “ack” + log)
- `POST /fastapi/process/weighing` : calcul net (service isolé, pas de câblage UI repéré)
Statut : **Partielle** (TTS OK ; `/announce` ne joue pas/ ne génère pas d’audio ; endpoints “process” non reliés à un flux utilisateur clair).

---

## 4) Fonctionnalités “à terminer” / incohérences repérées (concret)

### Écrans explicitement en construction (placeholders)
- Manager : `alerts`, `stats/timing`, `audit` (placeholders dans `frontend/src/pages/Manager.tsx`)
- Supervisor : `search` (placeholder dans `frontend/src/pages/Supervisor.tsx`)

### Route UI manquante (lien vers une page inexistante)
- `SupervisorDashboard` propose une action rapide “Pesée” vers `href="/weighing"` alors que **aucune route `/weighing` n’existe** dans `frontend/src/App.tsx`.

### Rôles incohérents / non alignés
- README mentionne `AGENT_CONTROLE`, `AGENT_VENTE`, `VIEWER`, mais le frontend/back RBAC expose surtout : `ADMINISTRATOR`, `MANAGER`, `SUPERVISOR`, `AGENT_QUAI`.
- Le rôle `EXPLOITATION` est référencé côté frontend (`ProtectedRoute`) et backend (contrôleur quais), mais **n’est pas défini** dans le seeding RBAC (`backend/src/seeders/rbacSeeder.js`).

### Modules “legacy” ou intégrations non alignées
- `frontend/src/stores/useTruckStore.ts` appelle des endpoints `/tickets/.../status|transfer|weigh-in|weigh-out` qui ne correspondent pas aux routes actuelles (`/api/tickets` utilise surtout `PATCH /call|process|...` + `POST /complete`).
- `frontend/src/components/organisms/dashboard/Charts.tsx` utilise des données statiques et `useTruckStore` (risque de dashboard “fantôme”).
- `backend/src/scripts/verify_weighing.js` cible encore des routes de pesée spécifiques (`/tickets/:id/weighing/entry|exit`) alors que `backend/src/routes/ticketRoutes.js` indique que ces routes ont été remplacées par `POST /:ticketId/complete`.
- `frontend/src/utils/menuConfig.ts` construit un groupe “Accès Quais” dynamique pour `SUPERVISOR` mais ne l’inclut pas dans le retour (variable créée mais non utilisée) → fonctionnalité de menu dynamique potentiellement inachevée.

---

## 5) Synthèse “statut par grandes fonctionnalités”

- **Cœur ticketing / workflow / file d’attente** : Implémenté
- **Temps réel (Socket.IO) + affichage TV + audio TTS** : Implémenté (avec un point partiel : endpoint FastAPI `/announce`)
- **Administration (users, rôles/permissions, sites/sociétés, quais, kiosks, queues, catégories, settings)** : Implémenté
- **Reporting / Analytics (stats, exports, listes tickets)** : Implémenté
- **Tracking (supervisor live tracking)** : Implémenté
- **Espace Manager (alerting, timing, audit)** : Partiel (placeholders)
- **Espace Supervisor (search/archives)** : Partiel (placeholder)
- **Pesée “écran dédié”** : Non couvert côté UI (lien existe mais route absente ; scripts legacy à aligner)

