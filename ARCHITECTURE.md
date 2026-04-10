# GFA SIBM - Architecture des Services

## Ports Utilisés

### Ports Publics (Accessibles de l'extérieur)
- **80**: Nginx (HTTP) - **Frontend accessible ici** ✅
- **443**: Nginx (HTTPS) - Futur
- **2112**: SSH

### Ports Internes (Services backend via Nginx)
- **8080**: Frontend Dev Server (Vite) - Optionnel pour développement
- **8081**: Backend Node.js/Express - Accessible via `/api`
- **8082**: FastAPI (gTTS) - Accessible via `/fastapi`
- **5432**: PostgreSQL - Localhost uniquement
- **6379**: Redis - Localhost uniquement

### Ports Déjà Utilisés (Ne Pas Toucher)
- **3000-3002**: Autres services du serveur
- **5000**: Autre service du serveur

## Architecture Complète

```
┌─────────────────────────────────────────────┐
│         Navigateur Client                   │
└──────────────────┬──────────────────────────┘
                   │ HTTP (Port 80)
                   ▼
┌─────────────────────────────────────────────┐
│           Nginx (Port 80)                   │
│  ┌─────────────────────────────────────┐   │
│  │  / → Frontend (fichiers statiques)  │   │
│  │  /api → Backend Node.js (:8081)     │   │
│  │  /fastapi → FastAPI (:8082)         │   │
│  │  /socket.io → WebSocket (:8081)     │   │
│  └─────────────────────────────────────┘   │
└──────┬──────────────┬──────────────┬────────┘
       │              │              │
       ▼              ▼              ▼
┌──────────┐  ┌──────────────┐  ┌──────────┐
│ Frontend │  │ Backend      │  │ FastAPI  │
│ (dist/)  │  │ Node.js      │  │ Python   │
│          │  │ Port 8081    │  │ Port 8082│
└──────────┘  └──────┬───────┘  └──────────┘
                     │
              ┌──────┴──────┐
              ▼             ▼
        ┌──────────┐  ┌──────────┐
        │PostgreSQL│  │  Redis   │
        │Port 5432 │  │ Port 6379│
        └──────────┘  └──────────┘
```

## Services et Leurs Rôles

### 1. Nginx (Port 80)
- **Rôle**: Reverse proxy et serveur web
- **Fonctions**:
  - Servir les fichiers statiques du frontend
  - Router les requêtes vers les bons services
  - Gérer le cache et la compression
  - Terminer SSL/TLS (futur)

### 2. Backend Node.js (Port 8081)
- **Rôle**: API principale et logique métier
- **Fonctions**:
  - Gestion des tickets
  - Authentification JWT
  - WebSocket (Socket.IO)
  - CRUD operations
  - Business logic

### 3. FastAPI Python (Port 8082)
- **Rôle**: Services spécialisés Python
- **Fonctions**:
  - **gTTS**: Synthèse vocale (Text-to-Speech)
  - Traitement de données avancé
  - Machine Learning (futur)
  - Traitement d'images (futur)

### 4. PostgreSQL (Port 5432)
- **Rôle**: Base de données principale
- **Données**: Tickets, utilisateurs, configurations

### 5. Redis (Port 6379)
- **Rôle**: Cache et pub/sub
- **Fonctions**:
  - Cache de session
  - Socket.IO adapter
  - Rate limiting

## URLs Publiques

### Via Nginx (Production - Recommandé)
- **🌐 Application (Frontend)**: `http://192.168.11.189` **(Port 80 - Accessible !)**
- **API Backend**: `http://192.168.11.189/api`
- **FastAPI**: `http://192.168.11.189/fastapi`
- **Synthèse Vocale**: `http://192.168.11.189/fastapi/tts?text=Bonjour`
- **Swagger (Backend)**: `http://192.168.11.189/api-docs`
- **Health Check**: `http://192.168.11.189/health`

### Accès Direct (Développement uniquement)
- Frontend Dev: `http://192.168.11.189:8080` (si Vite dev server actif)
- Backend: `http://192.168.11.189:8081` (non recommandé, utiliser `/api`)
- FastAPI: `http://192.168.11.189:8082` (non recommandé, utiliser `/fastapi`)

## Exemples d'Utilisation

### 1. Appeler l'API Backend
```javascript
// Depuis le frontend
fetch('http://192.168.11.189/api/tickets')
  .then(res => res.json())
  .then(data => console.log(data));
```

### 2. Utiliser gTTS (Synthèse Vocale)
```javascript
// Depuis le frontend
const text = "Ticket numéro 42, veuillez vous présenter au quai 3";
const audioUrl = `http://192.168.11.189/fastapi/tts?text=${encodeURIComponent(text)}`;

const audio = new Audio(audioUrl);
audio.play();
```

### 3. WebSocket
```javascript
// Depuis le frontend
const socket = io('http://192.168.11.189');
socket.on('ticket:called', (data) => {
  console.log('Ticket appelé:', data);
});
```

## Configuration PM2

### Démarrage des Services

```bash
# Backend Node.js
cd /home/ftuser/gfa-sibm/backend
pm2 start src/server.js --name gfa-backend

# FastAPI
cd /home/ftuser/gfa-sibm/fastapi
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8082" --name gfa-fastapi

# Frontend - Servi par Nginx (pas de PM2 nécessaire)
# Les fichiers statiques dans frontend/dist/ sont servis directement par Nginx sur le port 80

# Optionnel: Frontend Dev Server (développement uniquement)
# cd /home/ftuser/gfa-sibm/frontend
# pm2 start "npm run dev" --name gfa-frontend-dev

# Sauvegarder
pm2 save
```

### Vérification
```bash
pm2 status
```

**Résultat attendu:**
```
┌─────┬──────────────┬─────────┬─────────┬──────┐
│ id  │ name         │ status  │ cpu     │ mem  │
├─────┼──────────────┼─────────┼─────────┼──────┤
│ 0   │ gfa-backend  │ online  │ 0%      │ 50MB │
│ 1   │ gfa-fastapi  │ online  │ 0%      │ 80MB │
└─────┴──────────────┴─────────┴─────────┴──────┘
```

## Firewall Configuration

```bash
# Ports publics (via Nginx)
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS (futur)
sudo ufw allow 2112/tcp  # SSH

# Ports internes (localhost uniquement, pas besoin de règles UFW)
# 8081 - Backend
# 8082 - FastAPI
# 5432 - PostgreSQL
# 6379 - Redis

# Vérifier
sudo ufw status
```

## Sécurité

### Bonnes Pratiques
✅ Seul Nginx est exposé publiquement (port 80/443)
✅ Backend et FastAPI accessibles uniquement via localhost
✅ PostgreSQL et Redis accessibles uniquement en local
✅ SSH sur port non-standard (2112)

### À Faire
- [ ] Configurer SSL/HTTPS avec Let's Encrypt
- [ ] Restreindre CORS en production
- [ ] Configurer fail2ban pour SSH
- [ ] Mettre en place des backups automatiques

## Monitoring

### Logs Nginx
```bash
sudo tail -f /var/log/nginx/gfa-sibm-access.log
sudo tail -f /var/log/nginx/gfa-sibm-error.log
```

### Logs PM2
```bash
pm2 logs gfa-backend
pm2 logs gfa-fastapi
```

### Métriques
```bash
pm2 monit
```

---

**Date**: 2026-02-16  
**Serveur**: 192.168.11.189  
**Projet**: GFA SIBM
