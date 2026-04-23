FROM node:20-slim

WORKDIR /app

# Installer Python et les outils de build nécessaires pour bcrypt
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm install

# Rebuild bcrypt pour l'architecture Docker
RUN npm rebuild bcrypt --build-from-source

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]
