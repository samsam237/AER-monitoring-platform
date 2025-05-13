# Utilise Node.js 22 en version alpine (plus léger)
FROM node:22-alpine

# Répertoire de travail dans le conteneur
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm install --production

# Copie du reste des fichiers
COPY . .

# Port exposé (à adapter à ton app Express)
EXPOSE 3000 5050

# Commande de démarrage de l'app
CMD ["node", "src/index.js"]
