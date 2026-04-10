# GFA SIBM - Gestion de Flotte Automobile

[![CI/CD](https://github.com/YOUR_USERNAME/PROJET-GFA/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/YOUR_USERNAME/PROJET-GFA/actions/workflows/ci-cd.yml)

Application de gestion de file d'attente pour la gestion de flotte automobile SIBM.

## 🚀 Technologies

### Backend
- Node.js + Express
- PostgreSQL
- Redis
- Socket.IO
- JWT Authentication
- Sequelize ORM

### Frontend
- React 19
- TypeScript
- Vite
- TailwindCSS
- Zustand (State Management)
- React Query
- Socket.IO Client

## 📋 Prérequis

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- npm ou yarn

## 🛠️ Installation

### 1. Cloner le projet
```bash
git clone https://github.com/YOUR_USERNAME/PROJET-GFA.git
cd PROJET-GFA
```

### 2. Configuration Backend
```bash
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos configurations
npm run db:migrate
```

### 3. Configuration Frontend
```bash
cd frontend
npm install
cp .env.example .env.development
# Éditer .env.development si nécessaire
```

## 🚦 Démarrage

### Mode Développement

**Backend** (Port 3000):
```bash
cd backend
npm run dev
```

**Frontend** (Port 8080):
```bash
cd frontend
npm run dev
```

### Mode Production

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour les instructions complètes.

**Backend** (Port 8081):
```bash
cd backend
npm run start:prod
```

**Frontend** (Port 8080):
```bash
cd frontend
npm run build
npm run preview
```

## 📁 Structure du Projet

```
PROJET-GFA/
├── backend/                # API Express
│   ├── src/
│   │   ├── config/        # Configuration (DB, Redis, etc.)
│   │   ├── controllers/   # Contrôleurs
│   │   ├── models/        # Modèles Sequelize
│   │   ├── routes/        # Routes API
│   │   ├── services/      # Logique métier
│   │   ├── middlewares/   # Middlewares
│   │   └── server.js      # Point d'entrée
│   └── package.json
│
├── frontend/              # Application React
│   ├── src/
│   │   ├── components/    # Composants React
│   │   ├── pages/         # Pages
│   │   ├── stores/        # Zustand stores
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilitaires
│   └── package.json
│
├── .github/
│   └── workflows/         # CI/CD GitHub Actions
│
└── DEPLOYMENT.md          # Guide de déploiement
```

## 🔐 Variables d'Environnement

### Backend (.env)
```env
NODE_ENV=development
BACKEND_PORT=3000
DB_HOST=localhost
DB_NAME=gfa_sibm_dev
DB_USER=your_user
DB_PASSWORD=your_password
REDIS_HOST=localhost
JWT_SECRET=your_secret
CORS_ORIGIN=http://localhost:8080
```

### Frontend (.env.development)
```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

## 🧪 Tests

### Backend
```bash
cd backend
npm test                 # Tests unitaires
npm run test:watch      # Mode watch
```

### Frontend
```bash
cd frontend
npm test                # Tests unitaires
npm run test:e2e        # Tests E2E (Playwright)
```

## 📦 Build Production

### Backend
```bash
cd backend
npm run start:prod
```

### Frontend
```bash
cd frontend
npm run build
# Les fichiers sont dans dist/
```

## 🚀 CI/CD

Le projet utilise GitHub Actions pour:
- ✅ Tests automatiques (backend + frontend)
- ✅ Linting
- ✅ Build de production
- ✅ Déploiement automatique (branche main)

Voir [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml)

## 📖 Documentation

- [Guide de Déploiement](./DEPLOYMENT.md)
- [API Documentation](http://localhost:8081/api-docs) (Swagger)

## 🎨 Fonctionnalités

- ✅ Gestion des tickets de file d'attente
- ✅ Authentification JWT
- ✅ Temps réel avec Socket.IO
- ✅ Dashboard administrateur
- ✅ Interface agent de quai
- ✅ Écran TV public
- ✅ Gestion des priorités
- ✅ Rapports et analytics
- ✅ Multi-sites et multi-catégories

## 👥 Rôles Utilisateurs

- **ADMINISTRATOR**: Accès complet
- **AGENT_CONTROLE**: Gestion des entrées
- **AGENT_VENTE**: Gestion des ventes
- **AGENT_QUAI**: Gestion du chargement
- **VIEWER**: Consultation uniquement

## 📝 License

Propriétaire - SIBM

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question, contactez l'équipe SIBM.
