import axios from 'axios';
import * as cheerio from 'cheerio';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

const fundSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['FON', 'HİSSE'], default: 'FON' },
  price: { type: String, default: '-' },
  totalAmount: { type: String, required: true },
  payableAmount: { type: String, default: '0' },
  createdAt: { type: Date, default: Date.now }
});

const Fund = mongoose.models.Fund || mongoose.model('Fund', fundSchema);

// List of fund codes
const fundCodes = ['TCA', 'ZPG', 'MKG', 'MPK', 'KUT', 'KZL'];

// Function to fetch and parse price information
async function fetchFundPrices() {
  const fundPrices = [];
  for (const code of fundCodes) {
    const url = `https://www.hangikredi.com/yatirim-araclari/fon/${code}`;
    try {
      console.log(`Fetching price for ${code}...`);
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const $ = cheerio.load(response.data);
      const price = $("div[data-testid='initial-data-last']").text().trim();
      console.log(`Fund Code: ${code}, Price: ${price}`);
      
      if (price && price !== '') {
        fundPrices.push({ name: code, price });
      } else {
        console.log(`No price found for ${code}, skipping...`);
      }
    } catch (error) {
      console.error(`Error fetching data for ${code}:`, error.message);
      // Continue with other funds even if one fails
    }
  }
  return fundPrices;
}

// Function to fetch ALTINS1 stock price from İş Yatırım
async function fetchAltinS1PriceFromIsYatirim() {
  const url = 'https://www.isyatirim.com.tr/tr-tr/analiz/hisse/Sayfalar/default.aspx';
  try {
    console.log('Fetching ALTINS1 price...');
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });
    const $ = cheerio.load(response.data);
    const row = $("tbody tr td a[href*='ALTINS1']").closest('tr');
    const price = row.find('td.text-right').eq(0).text().trim();
    console.log(`ALTINS1 price: ${price}`);
    
    if (price && price !== '') {
      return { name: 'ALTIN.S1', price: price.includes('TL') ? price : `${price} TL` };
    }
  } catch (error) {
    console.error('Error fetching ALTINS1 stock price from İş Yatırım:', error.message);
  }
  return null;
}

// Function to update MongoDB with the fetched prices
async function updateDatabase(fundPrices) {
  const updateResults = [];
  
  for (const fund of fundPrices) {
    try {
      const formattedPrice = fund.price.includes('TL') ? fund.price : `${fund.price} TL`;
      
      const result = await Fund.updateOne(
        { name: fund.name },
        { $set: { price: formattedPrice } },
        { upsert: false } // Sadece mevcut kayıtları güncelle
      );
      
      const status = result.modifiedCount > 0 ? 'Updated' : 'Not found';
      console.log(`${fund.name}: ${status} - ${formattedPrice}`);
      
      updateResults.push({
        name: fund.name,
        price: formattedPrice,
        status: status
      });
    } catch (error) {
      console.error(`Error updating ${fund.name}:`, error.message);
      updateResults.push({
        name: fund.name,
        price: fund.price,
        status: 'Error',
        error: error.message
      });
    }
  }
  
  return updateResults;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    await dbConnect();
    console.log('Starting price update process...');
    
    // Fetch all prices
    const fundPrices = await fetchFundPrices();
    const altinS1Price = await fetchAltinS1PriceFromIsYatirim();
    
    if (altinS1Price) {
      fundPrices.push(altinS1Price);
    }
    
    console.log(`Fetched ${fundPrices.length} prices`);
    
    // Update database
    const updateResults = await updateDatabase(fundPrices);
    
    const successCount = updateResults.filter(r => r.status === 'Updated').length;
    const errorCount = updateResults.filter(r => r.status === 'Error').length;
    
    res.status(200).json({
      success: true,
      message: `Price update completed. ${successCount} updated, ${errorCount} errors.`,
      results: updateResults,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Price update error:', error);
    res.status(500).json({
      success: false,
      error: 'Price update failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
