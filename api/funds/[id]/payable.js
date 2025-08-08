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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ 
      success: false,
      message: 'Fund ID is required' 
    });
  }
  
  try {
    if (req.method === 'PUT') {
      const { payableAmount } = req.body;
      
      if (payableAmount === undefined || payableAmount === null) {
        return res.status(400).json({ 
          success: false,
          message: 'payableAmount is required' 
        });
      }
      
      const updatedFund = await Fund.findByIdAndUpdate(
        id, 
        { payableAmount: payableAmount.toString() }, 
        { new: true, runValidators: true }
      );
      
      if (!updatedFund) {
        return res.status(404).json({ 
          success: false,
          message: 'Fund not found' 
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Payable amount updated successfully',
        fund: updatedFund
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Payable Amount Update Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Database error', 
      details: error.message 
    });
  }
}
