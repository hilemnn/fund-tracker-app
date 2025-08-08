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

export default async function handler(req, res) {
  await dbConnect();
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { id } = req.query;
  
  try {
    switch (req.method) {
      case 'GET':
        if (id) {
          // Tek bir fund getir
          const fund = await Fund.findById(id);
          if (!fund) {
            return res.status(404).json({ message: 'Fund not found' });
          }
          res.status(200).json(fund);
        } else {
          // Tüm funds getir
          const funds = await Fund.find().sort({ createdAt: -1 });
          res.status(200).json(funds);
        }
        break;
        
      case 'POST':
        // Yeni fund ekle
        const { name, type, totalAmount, payableAmount } = req.body;
        
        if (!name || !totalAmount) {
          return res.status(400).json({ message: 'Name and totalAmount are required' });
        }
        
        const newFund = new Fund({
          name,
          type: type || 'FON',
          totalAmount,
          payableAmount: payableAmount || '0'
        });
        
        const savedFund = await newFund.save();
        res.status(201).json(savedFund);
        break;
        
      case 'PUT':
        // Fund güncelle
        if (!id) {
          return res.status(400).json({ message: 'Fund ID is required' });
        }
        
        const updateData = req.body;
        const updatedFund = await Fund.findByIdAndUpdate(
          id, 
          updateData, 
          { new: true, runValidators: true }
        );
        
        if (!updatedFund) {
          return res.status(404).json({ message: 'Fund not found' });
        }
        
        res.status(200).json(updatedFund);
        break;
        
      case 'DELETE':
        // Fund sil
        if (!id) {
          return res.status(400).json({ message: 'Fund ID is required' });
        }
        
        const deletedFund = await Fund.findByIdAndDelete(id);
        
        if (!deletedFund) {
          return res.status(404).json({ message: 'Fund not found' });
        }
        
        res.status(200).json({ message: 'Fund deleted successfully', fund: deletedFund });
        break;
        
      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Database error', details: error.message });
  }
}
