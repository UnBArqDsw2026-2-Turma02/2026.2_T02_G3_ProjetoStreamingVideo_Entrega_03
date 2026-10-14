FROM node:20-slim

# Instalar FFmpeg para transcodificação e OpenSSL para o Prisma
RUN apt-get update && apt-get install -y ffmpeg openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm install

# Gerar Prisma Client
RUN npx prisma generate

# Copiar restante dos arquivos da aplicação
COPY . .

# Compilar NestJS
RUN npm run build

# Portas: 3000 (API Nest), 1935 (RTMP Ingestão), 8000 (HTTP HLS)
EXPOSE 3000 1935 8000

CMD ["npm", "run", "start:dev"]
