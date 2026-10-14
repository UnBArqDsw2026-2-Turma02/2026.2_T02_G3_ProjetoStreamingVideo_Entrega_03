FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar restante dos arquivos
COPY . .

# Porta do Next.js
EXPOSE 3000

CMD ["npm", "run", "dev"]
