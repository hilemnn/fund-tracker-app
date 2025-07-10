# 🚀 Netlify Deploy Rehberi - Borç/Fon Takip Sistemi

Bu rehber, MERN stack projemizi production ortamına deploy etmek için adım adım talimatlar içerir.

## 📋 Ön Hazırlık

### 1. Gerekli Hesaplar
- **GitHub hesabı** (kod repository için)
- **Netlify hesabı** (frontend hosting için)
- **MongoDB Atlas hesabı** (veritabanı için)
- **Render/Railway/Heroku hesabı** (backend hosting için)

## 🎯 Deployment Stratejisi

### Frontend (React) → Netlify
### Backend (Node.js/Express) → Render
### Database (MongoDB) → MongoDB Atlas

---

## 🗃️ 1. MongoDB Atlas Kurulumu

### Adım 1: MongoDB Atlas Hesabı
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) sitesine git
2. "Start free" ile hesap oluştur
3. Yeni bir cluster oluştur (ücretsiz tier seç)

### Adım 2: Database Bağlantısı
1. Cluster'ında "Connect" butonuna tıkla
2. "Connect your application" seç
3. Connection string'i kopyala (şuna benzer):
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dbname?retryWrites=true&w=majority
   ```

### Adım 3: IP Whitelist
1. Network Access sekmesine git
2. "Add IP Address" → "Allow access from anywhere" (0.0.0.0/0)

---

## 🖥️ 2. Backend Deploy (Render)

### Adım 1: GitHub Repository
1. GitHub'da yeni repository oluştur
2. Local projenizi push edin:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/kullaniciadi/proje-adi.git
   git push -u origin main
   ```

### Adım 2: Backend için Environment Variables Dosyası
Backend klasörünüze `.env` dosyası oluşturun:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/fund-tracker?retryWrites=true&w=majority
PORT=5000
NODE_ENV=production
```

### Adım 3: Render Deployment
1. [Render](https://render.com) hesabı oluştur
2. "New +" → "Web Service" seç
3. GitHub repository'nizi bağla
4. Ayarlar:
   - **Name**: fund-tracker-backend
   - **Environment**: Node
   - **Region**: Frankfurt (Avrupa için)
   - **Branch**: main
   - **Root Directory**: server
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Adım 4: Environment Variables (Render)
Render dashboard'da Environment sekmesinde:
- `MONGODB_URI`: Atlas connection string
- `NODE_ENV`: production

---

## 🌐 3. Frontend Deploy (Netlify)

### Adım 1: Frontend Konfigürasyonu
`client` klasöründe `.env` dosyası oluşturun:
```env
REACT_APP_API_URL=https://fund-tracker-backend.onrender.com
```

### Adım 2: API URL Güncelleme
Frontend'deki tüm API çağrılarını güncelleyin. `client/src` klasöründe API base URL'ini dinamik hale getirin.

### Adım 3: Build Testi
```bash
cd client
npm run build
```

### Adım 4: Netlify Deploy
1. [Netlify](https://netlify.com) hesabı oluştur
2. "Add new site" → "Import an existing project"
3. GitHub repository'nizi bağla
4. Ayarlar:
   - **Branch**: main
   - **Base directory**: client
   - **Build command**: npm run build
   - **Publish directory**: client/build

### Adım 5: Environment Variables (Netlify)
Site settings → Environment variables:
- `REACT_APP_API_URL`: Render backend URL'iniz

---

## 🔧 4. Kod Değişiklikleri

### Backend Değişiklikleri
```javascript
// server/server.js - CORS ayarları
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-app-name.netlify.app'
  ],
  credentials: true
};
app.use(cors(corsOptions));
```

### Frontend API Configuration
```javascript
// client/src/config/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export default API_BASE_URL;
```

---

## 📝 5. Deploy Adımları (Sıralı)

### 1. MongoDB Atlas Hazırla
- [ ] Cluster oluştur
- [ ] Connection string al
- [ ] IP whitelist ayarla

### 2. GitHub'a Push Et
```bash
cd "c:\Users\kekau\Desktop\final"
git init
git add .
git commit -m "Deploy ready version"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 3. Backend Deploy (Render)
- [ ] Render hesabı oluştur
- [ ] Repository bağla
- [ ] Environment variables ekle
- [ ] Deploy et

### 4. Frontend Güncelle
- [ ] API URL'lerini güncelle
- [ ] Build test et
- [ ] Netlify'a deploy et

### 5. Test Et
- [ ] Backend health check: `https://your-backend.onrender.com/api/health`
- [ ] Frontend: `https://your-app.netlify.app`
- [ ] Tüm özellikler çalışıyor mu?

---

## 🔍 6. Troubleshooting

### Yaygın Problemler:

**CORS Hatası:**
```javascript
// Backend'de origin'leri güncelle
const corsOptions = {
  origin: ['https://your-netlify-domain.netlify.app'],
  credentials: true
};
```

**API Bağlantı Hatası:**
- Environment variables doğru mu?
- Backend URL'i doğru mu?
- HTTPS kullanıyor musunuz?

**Build Hatası:**
```bash
# Package.json'da engines ekle
"engines": {
  "node": "18.x",
  "npm": "9.x"
}
```

---

## 📱 7. Production İyileştirmeleri

### Güvenlik
- [ ] HTTPS zorla
- [ ] Rate limiting ekle
- [ ] Input validation güçlendir

### Performance
- [ ] Gzip compression
- [ ] Static file caching
- [ ] Database indexing

### Monitoring
- [ ] Error tracking (Sentry)
- [ ] Analytics
- [ ] Uptime monitoring

---

## 🎉 Deploy Sonrası

✅ **Backend URL**: `https://your-backend.onrender.com`
✅ **Frontend URL**: `https://your-app.netlify.app`
✅ **Database**: MongoDB Atlas

### Test Checklist:
- [ ] Ana sayfa yükleniyor
- [ ] Admin girişi çalışıyor
- [ ] Fon ekleme/düzenleme çalışıyor
- [ ] İşlem geçmişi çalışıyor
- [ ] Progress bar görünüyor
- [ ] Responsive tasarım çalışıyor

---

## 💡 İpuçları

1. **Ücretsiz Limitler:**
   - Render: 750 saat/ay
   - Netlify: 100GB bandwidth/ay
   - MongoDB Atlas: 512MB storage

2. **Domain Bağlama:**
   - Netlify'da custom domain ekleyebilirsiniz
   - SSL sertifikası otomatik

3. **Güncelleme:**
   - GitHub'a push → Otomatik deploy
   - Environment variables dashboard'dan değiştirilebilir

---

Bu rehber ile projenizi başarıyla deploy edebilirsiniz! Herhangi bir sorun yaşarsanız, her adımı tek tek takip edin ve hata mesajlarını kontrol edin.
