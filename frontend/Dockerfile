FROM node:20-slim

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY . .

# Exposer le port de Vite
EXPOSE 5173

# Commande de démarrage (peut être surchargée par docker-compose)
CMD ["npm", "run", "dev", "--", "--host"]
