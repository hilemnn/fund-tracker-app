import mongoose from 'mongoose';
import { handleCors } from '../_lib/cors.js';

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

async function handler(req, res) {
  await dbConnect();
  
  try {
    switch (req.method) {
      case 'POST':
        // Yeni fund ekle
        const { name, type, totalAmount, payableAmount } = req.body;
        
        if (!name || !totalAmount) {
          return res.status(400).json({ 
            message: 'Name and totalAmount are required',
            received: { name, type, totalAmount, payableAmount }
          });
        }
        
        const newFund = new Fund({
          name: name.trim(),
          type: type || 'FON',
          totalAmount: totalAmount.toString(),
          payableAmount: payableAmount ? payableAmount.toString() : '0'
        });
        
        const savedFund = await newFund.save();
        res.status(201).json(savedFund);
        break;
        
      case 'GET':
        // Admin için tüm funds listesi (direkt array döndür)
        const funds = await Fund.find().sort({ createdAt: -1 });
        
        res.status(200).json(funds);
        break;
        
      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin API Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Database error', 
      details: error.message 
    });
  }
}

export default handleCors(handler);
