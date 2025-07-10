# Render.com için Chrome kurulum scripti
FROM node:18-slim

# Chrome bağımlılıklarını yükle
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    apt-transport-https \
    --no-install-recommends

# Chrome repository ekle ve Chrome yükle
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Uygulama dizinini oluştur
WORKDIR /app

# Package files kopyala
COPY server/package*.json ./
RUN npm install

# Uygulama kodunu kopyala
COPY server/ .

# Port
EXPOSE 5000

# Uygulamayı başlat
CMD ["npm", "start"]
