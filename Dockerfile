FROM node:20-alpine

WORKDIR /app

# Dependances systeme pour compiler sqlite3 si besoin
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Dossier pour la base de donnees SQLite persistante + uploads
RUN mkdir -p /app/data /app/public/uploads/proofs

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "node config/seed.js && node server.js"]
