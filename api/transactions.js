import mongoose from 'mongoose';
import { handleCors } from './_lib/cors.js';

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

const transactionSchema = new mongoose.Schema({
  fundId: {
    type: String,
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
    default: 0
  },
  type: {
    type: String,
    enum: ['INCREASE', 'DECREASE'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    default: ''
  }
});

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

async function handler(req, res) {
  await dbConnect();
  
  try {
    if (req.method === 'GET') {
      // Tüm transaction'ları getir, en yeni önce
      const transactions = await Transaction.find()
        .sort({ date: -1 })
        .limit(50); // Son 50 işlem
      
      res.status(200).json(transactions);
    } else if (req.method === 'POST') {
      // Yeni transaction ekle
      const { fundId, fundName, amount, previousAmount, type, description } = req.body;
      
      if (!fundId || !fundName || amount === undefined || !type) {
        return res.status(400).json({ 
          success: false,
          message: 'fundId, fundName, amount, and type are required' 
        });
      }
      
      const newTransaction = new Transaction({
        fundId,
        fundName,
        amount: parseFloat(amount),
        previousAmount: parseFloat(previousAmount || 0),
        type,
        description: description || ''
      });
      
      const savedTransaction = await newTransaction.save();
      
      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        transaction: savedTransaction
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Transactions API Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Database error', 
      details: error.message 
    });
  }
}

export default handleCors(handler);
