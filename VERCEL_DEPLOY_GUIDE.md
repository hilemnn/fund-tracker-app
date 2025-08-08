# Vercel Deployment Guide

Bu rehber, MERN stack uygulamanızı Vercel'a deploy etmek için gerekli adımları içermektedir.

## Ön Gereksinimler

1. **Vercel hesabı** - https://vercel.com adresinden ücretsiz hesap oluşturun
2. **Vercel CLI** - Terminal üzerinden deploy etmek için (opsiyonel)
3. **GitHub/GitLab/Bitbucket** hesabı - Kod repository'si için

## Deployment Seçenekleri

### Seçenek 1: Vercel Dashboard (Önerilen)

1. **Repository'yi GitHub'a push edin**
   ```bash
   git add .
   git commit -m "Vercel deployment setup"
   git push origin main
   ```

2. **Vercel Dashboard'a gidin**
   - https://vercel.com/dashboard adresine gidin
   - "Add New Project" butonuna tıklayın
   - GitHub repository'nizi seçin

3. **Build ayarlarını yapılandırın**
   - Framework Preset: "Other"
   - Build Command: `npm run vercel-build`
   - Output Directory: `client/build`
   - Install Command: `npm install`

4. **Environment Variables ekleyin**
   - `NODE_ENV=production`
   - `MONGODB_URI=your_mongodb_connection_string`
   - Diğer gerekli environment variables

### Seçenek 2: Vercel CLI

1. **Vercel CLI'yi kurun**
   ```bash
   npm i -g vercel
   ```

2. **Vercel'a login olun**
   ```bash
   vercel login
   ```

3. **Deploy edin**
   ```bash
   vercel --prod
   ```

## Environment Variables

Aşağıdaki environment variables'ları Vercel dashboard'da ayarlamanız gerekiyor:

```env
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
PORT=5000
# Diğer gerekli variables
```

## Dosya Yapısı

Deployment için oluşturulan dosyalar:

- `vercel.json` - Vercel konfigürasyon dosyası
- Updated `package.json` scripts
- Updated API configuration

## Troubleshooting

### Common Issues:

1. **Build Errors**
   - Package.json dependencies'ları kontrol edin
   - Build command'ı doğru mu kontrol edin

2. **API Routes Çalışmıyor**
   - vercel.json routes konfigürasyonunu kontrol edin
   - Server.js'de route path'leri kontrol edin

3. **Environment Variables**
   - Vercel dashboard'da tüm gerekli variables'lar set edilmiş mi?
   - Variable isimleri doğru mu?

4. **Database Connection**
   - MongoDB URI doğru mu?
   - Database accessible mı?

## Production URL

Deploy edildikten sonra:
- Frontend: `https://your-app.vercel.app`
- Backend API: `https://your-app.vercel.app/api`

## Notes

- Vercel, serverless functions kullanır, bu nedenle backend kodu functions olarak çalışır
- MongoDB Atlas kullanmanız önerilir (ücretsiz tier mevcut)
- Static files client/build klasöründen serve edilir
- API routes /api prefix'i ile çalışır

## MongoDB Atlas Setup (Önerilen)

1. https://cloud.mongodb.com adresine gidin
2. Ücretsiz cluster oluşturun
3. Database user ve password oluşturun
4. Network Access'de 0.0.0.0/0 (tüm IP'ler) ekleyin
5. Connection string'i kopyalayın ve MONGODB_URI olarak ekleyin
