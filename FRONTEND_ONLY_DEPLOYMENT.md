# Vercel Frontend-Only Deployment

## Sorun
Mevcut full-stack deployment'ta routing problemleri yaşıyoruz.

## Çözüm
Frontend'i Vercel'da, Backend'i Render'da ayrı ayrı deploy edeceğiz.

## Adımlar

### 1. Backend'i Render'da Deploy Et
- Render.com'a giriş yap
- "New Web Service" oluştur
- GitHub repo'sunu bağla
- Build Command: `cd server && npm install`
- Start Command: `cd server && npm start`
- Environment Variables:
  - NODE_ENV=production
  - MONGODB_URI=your_mongodb_uri
  - PORT=10000

### 2. Frontend'i Vercel'da Deploy Et

#### Option A: Mevcut repo'yu kullan
- Vercel Dashboard → Settings → Build & Output Settings
- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `build`

#### Option B: Client'i ayrı repo yap
```bash
# Yeni klasör oluştur
mkdir fund-tracker-frontend
cd fund-tracker-frontend

# Client dosyalarını kopyala
cp -r ../fund-tracker-app/client/* .

# Git init
git init
git add .
git commit -m "Initial frontend commit"

# GitHub'a push et
# Vercel'da bu yeni repo'yu import et
```

### 3. API URL'ini Güncelle
Client'ta API URL'ini backend deployment URL'i ile güncelle.

### 4. CORS Ayarları
Backend'de frontend URL'ini CORS'a ekle.

## Mevcut Durum
- Backend: Ready for Render deployment
- Frontend: Ready for Vercel deployment
- API Config: Updated to point to Render backend
