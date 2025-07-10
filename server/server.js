const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const cron = require('node-cron');
require('dotenv').config();

// Puppeteer import - normal puppeteer kullan
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - Basit ve etkili CORS
app.use((req, res, next) => {
  // CORS Headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Max-Age', '3600');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection with retry logic
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fund-tracker';

console.log('Attempting MongoDB connection...');
console.log('MongoDB URI:', MONGODB_URI ? 'Set' : 'Not set');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // 10 seconds
  socketTimeoutMS: 45000, // 45 seconds
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error.message);
  console.error('Full error:', error);
  // Don't exit the process, let it continue
});

// Item Schema
const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Fund Schema
const fundSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['FON', 'HİSSE'],
    default: 'FON'
  },
  price: {
    type: String,
    default: '-'
  },
  totalAmount: {
    type: String,
    required: true
  },
  payableAmount: {
    type: String,
    default: '0'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Item = mongoose.model('Item', itemSchema);
const Fund = mongoose.model('Fund', fundSchema);

// Transaction Schema - İşlem geçmişi için
const transactionSchema = new mongoose.Schema({
  fundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fund',
    required: true
  },
  fundName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  previousAmount: {
    type: Number,
    required: true
  },
  newAmount: {
    type: Number,
    required: true
  },
  operation: {
    type: String,
    required: true // '+5', '-3', '15' gibi
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Fon fiyatı çekme fonksiyonu
async function fetchFundPrice(fundName) {
  let browser;
  try {
    console.log(`Fetching price for fund: ${fundName}`);
    
    // Fon adını URL formatına çevir (Türkçe karakterleri düzelt)
    const urlFundName = fundName
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const url = `https://www.hangikredi.com/yatirim-araclari/fon/${urlFundName}`;
    console.log(`URL: ${url}`);

    // Puppeteer launch options
    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-default-apps',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--single-process',
        '--no-zygote'
      ]
    };

    // Production ortamında Chrome yolunu bulmaya çalış
    if (process.env.NODE_ENV === 'production') {
      const fs = require('fs');
      const chromePaths = [
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/opt/google/chrome/chrome',
        '/opt/google/chrome/google-chrome',
        '/snap/bin/chromium'
      ];
      
      for (const path of chromePaths) {
        if (fs.existsSync(path)) {
          launchOptions.executablePath = path;
          console.log(`Using Chrome at: ${path}`);
          break;
        }
      }
      
      if (!launchOptions.executablePath) {
        console.log('⚠️ Chrome not found at common paths, using default');
      }
    }

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    
    // User agent ayarla
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Sayfayı yükle
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Fiyat elementini bekle ve çek
    await page.waitForSelector('[data-testid="initial-data-last"]', { timeout: 10000 });
    
    const priceText = await page.$eval('[data-testid="initial-data-last"]', el => el.textContent.trim());
    
    console.log(`Found price: ${priceText}`);
    return priceText;
    
  } catch (error) {
    console.error(`Error fetching price for ${fundName}:`, error.message);
    
    // Chrome bulunamadığında veya hata durumunda
    if (error.message.includes('Browser was not found') || 
        error.message.includes('Chrome') || 
        error.message.includes('No usable sandbox') ||
        error.message.includes('executable')) {
      console.log(`⚠️ Chrome issue for ${fundName} - returning placeholder price`);
      return '-';
    }
    
    return null;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.log('Browser close error:', e.message);
      }
    }
  }
}

// Hisse senedi fiyatı çekme fonksiyonu
async function fetchStockPrice(stockCode) {
  let browser;
  try {
    console.log(`Fetching price for stock: ${stockCode}`);
    
    const url = 'https://www.isyatirim.com.tr/tr-tr/analiz/hisse/Sayfalar/default.aspx';
    console.log(`URL: ${url}`);

    // Puppeteer launch options
    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-default-apps',
        '--single-process',
        '--no-zygote'
      ]
    };

    // Production ortamında Chrome yolunu bulmaya çalış
    if (process.env.NODE_ENV === 'production') {
      const fs = require('fs');
      const chromePaths = [
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/opt/google/chrome/chrome',
        '/opt/google/chrome/google-chrome',
        '/snap/bin/chromium'
      ];
      
      for (const path of chromePaths) {
        if (fs.existsSync(path)) {
          launchOptions.executablePath = path;
          console.log(`Using Chrome at: ${path}`);
          break;
        }
      }
      
      if (!launchOptions.executablePath) {
        console.log('⚠️ Chrome not found at common paths, using default');
      }
    }

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    
    // User agent ayarla
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Sayfayı yükle
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Tablonun yüklenmesini bekle
    await page.waitForSelector('tbody tr', { timeout: 15000 });
    
    // Daha spesifik arama: ALTIN.S1 yerine ALTINS1 olarak ara
    const searchCode = stockCode.replace('.', '').toUpperCase();
    console.log(`Searching for stock code: ${searchCode}`);
    
    // Hisse kodunu ara ve fiyatını bul
    const stockData = await page.evaluate((code) => {
      const rows = document.querySelectorAll('tbody tr');
      for (let row of rows) {
        const stockCell = row.querySelector('td.sorting_1 a, td.sorting_1');
        if (stockCell) {
          const cellText = stockCell.textContent.trim().toUpperCase();
          if (cellText === code || cellText.includes(code)) {
            // Fiyat hücresini bul (genellikle 2. veya 3. hücre)
            const cells = row.querySelectorAll('td');
            console.log(`Found row for ${code}, checking ${cells.length} cells`);
            
            for (let i = 1; i < Math.min(cells.length, 6); i++) {
              const cellText = cells[i].textContent.trim();
              // Fiyat formatını kontrol et (sayı,sayı veya sayı.sayı format)
              if (/^\d+[\.,]\d+$/.test(cellText)) {
                console.log(`Found price in cell ${i}: ${cellText}`);
                return cellText;
              }
            }
          }
        }
      }
      return null;
    }, searchCode);
    
    if (stockData) {
      console.log(`Found stock price: ${stockData}`);
      return stockData + ' TL';
    } else {
      console.log(`Stock ${stockCode} (${searchCode}) not found`);
      return null;
    }
    
  } catch (error) {
    console.error(`Error fetching price for stock ${stockCode}:`, error.message);
    
    // Chrome bulunamadığında veya hata durumunda
    if (error.message.includes('Browser was not found') || 
        error.message.includes('Chrome') || 
        error.message.includes('No usable sandbox') ||
        error.message.includes('executable')) {
      console.log(`⚠️ Chrome issue for ${stockCode} - returning placeholder price`);
      return '-';
    }
    
    return null;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.log('Browser close error:', e.message);
      }
    }
  }
}

// Tüm fonların fiyatlarını güncelle
async function updateAllFundPrices() {
  try {
    console.log('Starting fund and stock price update...');
    
    // FON türündeki ürünleri güncelle
    const funds = await Fund.find({ type: 'FON' });
    console.log(`Found ${funds.length} funds to update`);
    
    for (const fund of funds) {
      try {
        const price = await fetchFundPrice(fund.name);
        if (price && price !== '-' && price !== null) {
          await Fund.findByIdAndUpdate(fund._id, { price });
          console.log(`✅ Updated ${fund.name} price to ${price}`);
        } else {
          console.log(`⚠️ No price found for ${fund.name}`);
        }
      } catch (error) {
        console.error(`❌ Error updating ${fund.name}:`, error.message);
      }
      
      // Rate limiting - 3 saniye bekle
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // HİSSE türündeki ürünleri güncelle
    const stocks = await Fund.find({ type: 'HİSSE' });
    console.log(`Found ${stocks.length} stocks to update`);
    
    for (const stock of stocks) {
      try {
        const price = await fetchStockPrice(stock.name);
        if (price && price !== '-' && price !== null) {
          await Fund.findByIdAndUpdate(stock._id, { price });
          console.log(`✅ Updated ${stock.name} price to ${price}`);
        } else {
          console.log(`⚠️ No price found for ${stock.name}`);
        }
      } catch (error) {
        console.error(`❌ Error updating ${stock.name}:`, error.message);
      }
      
      // Rate limiting - 4 saniye bekle (hisse için biraz daha uzun)
      await new Promise(resolve => setTimeout(resolve, 4000));
    }
    
    console.log('✅ Fund and stock price update completed');
    return { success: true, message: 'Price update completed' };
  } catch (error) {
    console.error('❌ Error updating fund and stock prices:', error);
    return { success: false, error: error.message };
  }
}

// Cron job - Her gün saat 09:00'da çalış
cron.schedule('0 9 * * *', () => {
  console.log('🕘 Running scheduled fund and stock price update...');
  updateAllFundPrices();
}, {
  timezone: "Europe/Istanbul"
});
console.log('📅 Cron job scheduled for daily fund price updates at 09:00 Istanbul time');

// Manuel güncelleme endpoint'i
app.post('/api/update-fund-prices', async (req, res) => {
  try {
    console.log('📊 Manual fund price update requested');
    
    const result = await updateAllFundPrices();
    
    if (result.success) {
      res.json({ 
        message: 'Fon fiyatları güncelleme işlemi tamamlandı',
        status: 'completed',
        details: result.message
      });
    } else {
      res.status(500).json({ 
        message: 'Fon fiyatları güncellenirken hata oluştu',
        status: 'error',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Error updating fund prices:', error);
    
    res.status(500).json({ 
      message: 'Fon fiyatları güncellenirken server hatası oluştu', 
      error: error.message,
      status: 'server_error'
    });
  }
});

// Fon/Hisse türünü güncelleme endpoint'i
app.put('/api/funds/:id/type', async (req, res) => {
  try {
    const { type } = req.body;
    if (!['FON', 'HİSSE'].includes(type)) {
      return res.status(400).json({ message: 'Type must be FON or HİSSE' });
    }
    
    const fund = await Fund.findByIdAndUpdate(
      req.params.id, 
      { type }, 
      { new: true }
    );
    
    if (!fund) {
      return res.status(404).json({ message: 'Fund not found' });
    }
    
    res.json(fund);
  } catch (error) {
    res.status(500).json({ message: 'Error updating fund type', error: error.message });
  }
});

// ALTIN.S1'in türünü düzeltme endpoint'i
app.post('/api/fix-altins1-type', async (req, res) => {
  try {
    const fund = await Fund.findOneAndUpdate(
      { name: 'ALTIN.S1' },
      { type: 'HİSSE' },
      { new: true }
    );
    
    if (fund) {
      res.json({ message: 'ALTIN.S1 type updated to HİSSE', fund });
    } else {
      res.json({ message: 'ALTIN.S1 not found in database' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fixing ALTIN.S1 type', error: error.message });
  }
});

// Tüm fonları listele (debug için)
app.get('/api/funds/debug/list', async (req, res) => {
  try {
    const funds = await Fund.find({}, 'name type');
    res.json(funds);
  } catch (error) {
    res.status(500).json({ message: 'Error listing funds', error: error.message });
  }
});

// Migration endpoint - mevcut fonlara type alanı ekle
app.post('/api/migrate/add-type-field', async (req, res) => {
  try {
    // type alanı olmayan tüm fonları bul ve FON olarak güncelle
    const result = await Fund.updateMany(
      { type: { $exists: false } }, // type alanı olmayan kayıtlar
      { $set: { type: 'FON' } }      // default olarak FON yap
    );
    
    res.json({ 
      message: 'Migration completed', 
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount 
    });
  } catch (error) {
    res.status(500).json({ message: 'Migration failed', error: error.message });
  }
});

// Belirli bir fonun türünü güncelle
app.put('/api/funds/:id/update-type', async (req, res) => {
  try {
    const { type } = req.body;
    
    if (!['FON', 'HİSSE'].includes(type)) {
      return res.status(400).json({ message: 'Type must be FON or HİSSE' });
    }
    
    const fund = await Fund.findByIdAndUpdate(
      req.params.id,
      { type },
      { new: true }
    );
    
    if (!fund) {
      return res.status(404).json({ message: 'Fund not found' });
    }
    
    res.json({ message: 'Type updated successfully', fund });
  } catch (error) {
    res.status(500).json({ message: 'Error updating type', error: error.message });
  }
});

// Test endpoint - tek bir fon/hisse fiyatını çek
app.post('/api/test-fund-price', async (req, res) => {
  try {
    const { fundName, type } = req.body;
    if (!fundName) {
      return res.status(400).json({ message: 'Fund name is required' });
    }
    
    let price;
    if (type === 'HİSSE') {
      price = await fetchStockPrice(fundName);
    } else {
      price = await fetchFundPrice(fundName);
    }
    
    res.json({ fundName, type: type || 'FON', price });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fund price', error: error.message });
  }
});

// Routes

// Get all items
app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching items', error: error.message });
  }
});

// Get single item
app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching item', error: error.message });
  }
});

// Create new item
app.post('/api/items', async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const newItem = new Item({
      title,
      description
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(500).json({ message: 'Error creating item', error: error.message });
  }
});

// Update item
app.put('/api/items/:id', async (req, res) => {
  try {
    const { title, description } = req.body;
    
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { title, description },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: 'Error updating item', error: error.message });
  }
});

// Delete item
app.delete('/api/items/:id', async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    
    if (!deletedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting item', error: error.message });
  }
});

// Fund Routes

// Get all funds
app.get('/api/funds', async (req, res) => {
  try {
    const funds = await Fund.find().sort({ createdAt: -1 });
    res.json(funds);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching funds', error: error.message });
  }
});

// Get single fund
app.get('/api/funds/:id', async (req, res) => {
  try {
    const fund = await Fund.findById(req.params.id);
    if (!fund) {
      return res.status(404).json({ message: 'Fund not found' });
    }
    res.json(fund);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fund', error: error.message });
  }
});

// Create new fund
app.post('/api/funds', async (req, res) => {
  try {
    const { name, type, price, totalAmount, payableAmount } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Fund name is required' });
    }

    const newFund = new Fund({
      name,
      type: type || 'FON',
      price: price || '-',
      totalAmount: totalAmount || '-',
      payableAmount: payableAmount || '0'
    });

    const savedFund = await newFund.save();
    res.status(201).json(savedFund);
  } catch (error) {
    res.status(500).json({ message: 'Error creating fund', error: error.message });
  }
});

// Update fund payable amount with transaction logging
app.put('/api/funds/:id/payable', async (req, res) => {
  try {
    const { operation } = req.body;
    const fundId = req.params.id;
    
    // Fon bilgilerini al
    const fund = await Fund.findById(fundId);
    if (!fund) {
      return res.status(404).json({ message: 'Fund not found' });
    }
    
    const currentAmount = parseFloat(fund.payableAmount) || 0;
    let newAmount = currentAmount;
    let processedOperation = operation.trim();
    
    // İşlem kontrolü - Her pozitif sayıyı + olarak işle
    if (processedOperation.startsWith('+')) {
      const addValue = parseFloat(processedOperation.substring(1));
      if (!isNaN(addValue)) {
        newAmount = currentAmount + addValue;
        processedOperation = `+${addValue}`;
      }
    } else if (processedOperation.startsWith('-')) {
      const subtractValue = parseFloat(processedOperation.substring(1));
      if (!isNaN(subtractValue)) {
        newAmount = currentAmount - subtractValue;
        processedOperation = `-${subtractValue}`;
      }
    } else {
      // Direkt sayı girildiyse (pozitif sayıları + olarak işle)
      const directValue = parseFloat(processedOperation);
      if (!isNaN(directValue)) {
        if (directValue >= 0) {
          // Pozitif sayıları ekleme olarak işle
          newAmount = currentAmount + directValue;
          processedOperation = `+${directValue}`;
        } else {
          // Negatif sayıları çıkarma olarak işle
          newAmount = currentAmount + directValue; // directValue zaten negatif
          processedOperation = `${directValue}`;
        }
      }
    }

    // Negatif değerlere izin verme
    if (newAmount < 0) {
      return res.status(400).json({ message: 'Ödenen adet negatif olamaz!' });
    }

    // Transaction kaydı oluştur
    const transaction = new Transaction({
      fundId: fund._id,
      fundName: fund.name,
      amount: newAmount - currentAmount, // Değişim miktarı
      previousAmount: currentAmount,
      newAmount: newAmount,
      operation: processedOperation
    });

    await transaction.save();

    // Fon güncelle
    const updatedFund = await Fund.findByIdAndUpdate(
      fundId,
      { payableAmount: newAmount.toString() },
      { new: true, runValidators: true }
    );

    res.json({ 
      fund: updatedFund, 
      transaction: transaction,
      message: 'Ödenen adet başarıyla güncellendi' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating payable amount', error: error.message });
  }
});

// Update fund
app.put('/api/funds/:id', async (req, res) => {
  try {
    const { name, type, price, totalAmount, payableAmount } = req.body;
    
    // Sadece gönderilen alanları güncelle
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (price !== undefined) updateData.price = price;
    if (totalAmount !== undefined) updateData.totalAmount = totalAmount;
    if (payableAmount !== undefined) updateData.payableAmount = payableAmount;
    
    const updatedFund = await Fund.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedFund) {
      return res.status(404).json({ message: 'Fund not found' });
    }

    res.json(updatedFund);
  } catch (error) {
    res.status(500).json({ message: 'Error updating fund', error: error.message });
  }
});

// Delete fund
app.delete('/api/funds/:id', async (req, res) => {
  try {
    const deletedFund = await Fund.findByIdAndDelete(req.params.id);
    
    if (!deletedFund) {
      return res.status(404).json({ message: 'Fund not found' });
    }

    res.json({ message: 'Fund deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting fund', error: error.message });
  }
});

// Get all transactions
app.get('/api/transactions', async (req, res) => {
  console.log('═══ GET TRANSACTIONS İSTEĞİ ALINDI ═══');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 }) // En yeniler önce
      .limit(100); // Son 100 işlem
    
    console.log('✅ Transactions bulundu:', transactions.length, 'kayıt');
    console.log('Transaction ID\'leri:', transactions.map(t => t._id.toString()));
    
    res.json(transactions);
  } catch (error) {
    console.error('❌ Transaction listeleme hatası:', error);
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
  
  console.log('═══ GET TRANSACTIONS İSTEĞİ TAMAMLANDI ═══\n');
});

// Get transactions by fund
app.get('/api/transactions/fund/:fundId', async (req, res) => {
  try {
    const transactions = await Transaction.find({ fundId: req.params.fundId })
      .sort({ createdAt: -1 })
      .limit(20); // Son 20 işlem
    
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fund transactions', error: error.message });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date() });
});

// Health check endpoint  
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is healthy',
    endpoints: {
      transactions: '/api/transactions',
      funds: '/api/funds',
      items: '/api/items'
    }
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Full-Stack Web Application API',
    version: '1.0.0',
    endpoints: {
      'GET /api/health': 'Health check',
      'GET /api/items': 'Get all items',
      'GET /api/items/:id': 'Get single item',
      'POST /api/items': 'Create new item',
      'PUT /api/items/:id': 'Update item',
      'DELETE /api/items/:id': 'Delete item',
      'GET /api/funds': 'Get all funds',
      'GET /api/funds/:id': 'Get single fund',
      'POST /api/funds': 'Create new fund',
      'PUT /api/funds/:id': 'Update fund',
      'DELETE /api/funds/:id': 'Delete fund',
      'GET /api/transactions': 'Get all transactions',
      'GET /api/transactions/fund/:fundId': 'Get transactions by fund'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.header('Access-Control-Allow-Origin', '*');
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// 404 handler
app.use('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.status(404).json({ message: 'Route not found' });
});

// Delete transaction - Bu route app.listen()'den ÖNCE olmalı
app.delete('/api/transactions/:id', async (req, res) => {
  console.log('═══ DELETE TRANSACTION İSTEĞİ ALINDI ═══');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request params:', req.params);
  console.log('Request URL:', req.url);
  
  try {
    const transactionId = req.params.id;
    console.log('Silinecek Transaction ID:', transactionId);
    
    // ID formatını kontrol et
    if (!transactionId || !mongoose.Types.ObjectId.isValid(transactionId)) {
      console.log('❌ Geçersiz transaction ID formatı:', transactionId);
      return res.status(400).json({ 
        message: 'Geçersiz işlem ID formatı',
        receivedId: transactionId 
      });
    }
    
    // Önce transaction'ın var olup olmadığını kontrol et
    const existingTransaction = await Transaction.findById(transactionId);
    console.log('Var olan transaction:', existingTransaction ? 'BULUNDU' : 'BULUNAMADI');
    
    if (existingTransaction) {
      console.log('Transaction detayları:', {
        id: existingTransaction._id,
        fundName: existingTransaction.fundName,
        operation: existingTransaction.operation,
        createdAt: existingTransaction.createdAt
      });
    }
    
    // Transaction'ı bul ve sil
    console.log('Silme işlemi başlatılıyor...');
    const deletedTransaction = await Transaction.findByIdAndDelete(transactionId);
    
    if (!deletedTransaction) {
      console.log('❌ Transaction silinemedi - bulunamadı:', transactionId);
      return res.status(404).json({ 
        message: 'İşlem kaydı bulunamadı',
        searchedId: transactionId 
      });
    }
    
    console.log('✅ Transaction başarıyla silindi:', deletedTransaction._id);
    console.log('Silinen transaction detayları:', {
      id: deletedTransaction._id,
      fundName: deletedTransaction.fundName,
      operation: deletedTransaction.operation
    });
    
    // Kalan transaction sayısını kontrol et
    const remainingCount = await Transaction.countDocuments();
    console.log('Database\'de kalan transaction sayısı:', remainingCount);
    
    res.status(200).json({ 
      message: 'İşlem kaydı başarıyla silindi', 
      deletedTransaction: {
        id: deletedTransaction._id,
        fundName: deletedTransaction.fundName,
        operation: deletedTransaction.operation
      },
      remainingCount: remainingCount
    });
    
  } catch (error) {
    console.error('❌ Transaction silme hatası:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'İşlem kaydı silinirken server hatası oluştu', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
  
  console.log('═══ DELETE TRANSACTION İSTEĞİ TAMAMLANDI ═══\n');
});

// Clear all transactions
app.delete('/api/transactions', async (req, res) => {
  try {
    console.log('Attempting to clear all transactions...');
    
    const result = await Transaction.deleteMany({});
    
    console.log('All transactions cleared successfully:', result);
    res.json({ 
      message: 'Tüm işlem geçmişi başarıyla sıfırlandı', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error clearing transactions:', error);
    res.status(500).json({ 
      message: 'İşlem geçmişi sıfırlanırken hata oluştu', 
      error: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Catch-all route for undefined routes
app.use('*', (req, res) => {
  console.log(`📍 Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: 'Route not found',
    method: req.method,
    url: req.originalUrl
  });
});

// Start server with error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
}).on('error', (err) => {
  console.error('❌ Server startup error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    mongoose.connection.close();
  });
});

module.exports = app;
