# 💰 Fund Tracker - Borç/Fon Takip Sistemi

Modern ve kullanıcı dostu borç ve fon takip sistemi. React.js frontend, Node.js/Express backend ve MongoDB veritabanı ile geliştirilmiştir.

## 🌟 Özellikler

- **Admin Paneli**: Fon ekleme, düzenleme ve silme
- **Progress Bar**: Borç ödeme durumu görselleştirmesi
- **İşlem Geçmişi**: Tüm işlemlerin kaydı ve yönetimi
- **Responsive Tasarım**: Mobil ve desktop uyumlu
- **Real-time Updates**: Anlık fiyat güncelleme
- **Güvenli Giriş**: Admin authentication sistemi

## 🚀 Live Demo

- **Frontend**: https://fund-tracker-frontend.onrender.com
- **Backend API**: https://fund-tracker-backend.onrender.com
- **Admin Giriş**: kullanıcı: `admin`, şifre: `admin123`

## 🛠️ Teknolojiler

### Frontend
- React.js 18
- React Router DOM
- Axios
- CSS3 (Responsive)

### Backend
- Node.js
- Express.js
- MongoDB/Mongoose
- CORS
- Puppeteer (fiyat çekme)
- Node-cron (otomatik işlemler)

### Deployment
- **Frontend**: Render Static Site
- **Backend**: Render Web Service
- **Database**: MongoDB Atlas

## 📱 Ekran Görüntüleri

### Ana Sayfa
- Fon listesi ve progress bar
- Responsive tasarım
- Modern kullanıcı arayüzü

### Admin Paneli
- Fon yönetimi
- İşlem geçmişi
- Admin ayarları

## 🏗️ Proje Yapısı

```
fund-tracker/
├── client/                 # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── config/         # API configuration
│   │   └── styles/
│   └── package.json
├── server/                 # Node.js Backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── server.js           # Main server file
│   └── package.json
└── README.md
```

## 🔧 Local Development

### Gereksinimler
- Node.js 18+
- MongoDB (local veya Atlas)
- Git

### Kurulum

1. **Repository'yi klonla:**
```bash
git clone https://github.com/USERNAME/fund-tracker-app.git
cd fund-tracker-app
```

2. **Dependencies yükle:**
```bash
# Root dependencies
npm install

# Server dependencies
cd server && npm install && cd ..

# Client dependencies
cd client && npm install && cd ..
```

3. **Environment variables:**

Server için `.env` dosyası oluştur:
```env
MONGODB_URI=mongodb://localhost:27017/fund-tracker
PORT=5000
NODE_ENV=development
```

Client için `.env` dosyası oluştur:
```env
REACT_APP_API_URL=http://localhost:5000
```

4. **Uygulamayı başlat:**
```bash
# Development mode (both client and server)
npm run dev

# Sadece server
npm run server

# Sadece client
npm run client
```

## 🌐 Deploy to Render

### Hızlı Deploy

1. **MongoDB Atlas kurulumu:**
   - [MongoDB Atlas](https://cloud.mongodb.com) hesabı oluştur
   - Cluster oluştur
   - Database user oluştur
   - Connection string al

2. **GitHub'a push:**
```bash
git add .
git commit -m "Deploy ready"
git push origin main
```

3. **Render'da Backend deploy:**
   - [Render](https://render.com) hesabı oluştur
   - Web Service oluştur
   - Repository bağla
   - Settings:
     - Root Directory: `server`
     - Build Command: `npm install`
     - Start Command: `npm start`
   - Environment variables ekle

4. **Render'da Frontend deploy:**
   - Static Site oluştur
   - Settings:
     - Root Directory: `client`
     - Build Command: `npm install && npm run build`
     - Publish Directory: `build`
   - Environment variables ekle

### Detaylı rehber için: [`RENDER_DEPLOY_GUIDE.md`](RENDER_DEPLOY_GUIDE.md)

## 📚 API Endpoints

### Health Check
```
GET /api/health
```

### Funds
```
GET    /api/funds          # Tüm fonları getir
POST   /api/funds          # Yeni fon ekle
PUT    /api/funds/:id      # Fon güncelle
DELETE /api/funds/:id      # Fon sil
PUT    /api/funds/:id/payable  # Ödenen adet güncelle
```

### Transactions
```
GET    /api/transactions   # İşlem geçmişi
DELETE /api/transactions/:id    # İşlem sil
DELETE /api/transactions   # Tüm işlemleri sil
```

### Price Updates
```
POST   /api/update-fund-prices  # Fiyatları güncelle
```

## 🔐 Admin Features

### Default Login
- **Username**: admin
- **Password**: admin123

### Admin Panel Features
- Fon ekleme/düzenleme/silme
- Ödenen adet güncelleme
- İşlem geçmişi görüntüleme
- Progress bar ile borç takibi
- Admin bilgileri değiştirme

## 📊 Features Overview

### Progress Bar
- Toplam borç hesaplama
- Ödenen borç oranı
- Görsel progress indicator

### Transaction History
- Tüm işlem kayıtları
- Silme ve topluca silme
- Manuel yenileme

### Real-time Price Updates
- Puppeteer ile otomatik fiyat çekme
- Cron job ile periyodik güncelleme
- Manual güncelleme seçeneği

## 🐛 Troubleshooting

### Build Errors
```bash
# Node.js version check
node --version  # Should be 18+

# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### CORS Issues
Backend'de `corsOptions` ayarlarını kontrol edin ve frontend URL'ini ekleyin.

### Database Connection
- MongoDB Atlas IP whitelist ayarlarını kontrol edin
- Connection string'de özel karakterler encode edilmiş mi?

## 📄 License

MIT License - detaylar için [LICENSE](LICENSE) dosyasını inceleyin.

## 👨‍💻 Developer

Projeyi geliştiren ekip tarafından ❤️ ile kodlanmıştır.

---

**Not**: Bu proje demo amaçlı geliştirilmiştir. Production ortamında ek güvenlik önlemleri alınması önerilir.
