const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
app.use(cors());
const PORT = 5000;

// Middleware to parse JSON
app.use(express.json());

// Test endpoint to serve mock wallet data
app.get('/api/test-wallet-data', (req, res) => {
  const mockWalletData = {
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    balance: '2.5',
    transactions: [
      {
        hash: '0xabc123',
        value: '1.0',
        timestamp: '2025-07-27T10:00:00Z',
        from: '0x9876543210abcdef9876543210abcdef98765432',
        to: '0x1234567890abcdef1234567890abcdef12345678'
      },
      {
        hash: '0xdef456',
        value: '1.5',
        timestamp: '2025-07-28T08:30:00Z',
        from: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0xabcdef1234567890abcdef1234567890abcdef12'
      }
    ]
  };
  res.json(mockWalletData);
});

// MongoDB connection
const mongoURI = 'mongodb://root:example@localhost:27017/admin';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Wallet schema
const walletSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  chain: { type: String, required: true }, // 'EVM' or 'Solana'
  balance: { type: String, required: true },
  transactions: [{
    hash: { type: String, required: true },
    value: { type: String, required: true },
    timestamp: { type: Date, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true }
  }],
  createdAt: { type: Date, default: Date.now }
});

const Wallet = mongoose.model('Wallet', walletSchema);

// Test endpoint to serve mock wallet data
app.get('/api/test-wallet-data', async (req, res) => {
  try {
    // First try to get from database
    let mockWalletData = await Wallet.findOne({ address: '0x1234567890abcdef1234567890abcdef12345678' });
    
    // If not in database, create and save
    if (!mockWalletData) {
      mockWalletData = new Wallet({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chain: 'EVM',
        balance: '2.5',
        transactions: [
          {
            hash: '0xabc123',
            value: '1.0',
            timestamp: new Date('2025-07-27T10:00:00Z'),
            from: '0x9876543210abcdef9876543210abcdef98765432',
            to: '0x1234567890abcdef1234567890abcdef12345678'
          },
          {
            hash: '0xdef456',
            value: '1.5',
            timestamp: new Date('2025-07-28T08:30:00Z'),
            from: '0x1234567890abcdef1234567890abcdef12345678',
            to: '0xabcdef1234567890abcdef1234567890abcdef12'
          }
        ]
      });
      await mockWalletData.save();
    }
    
    // Format response
    res.json({
      walletAddress: mockWalletData.address,
      balance: mockWalletData.balance,
      transactions: mockWalletData.transactions
    });
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// JWT authentication middleware
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'grokwallet_secret_key';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Authentication endpoint
app.post('/api/login', (req, res) => {
  // In a real application, verify credentials against database
  const { email, password } = req.body;
  
  // Mock authentication
  if (email === 'user@example.com' && password === 'password') {
    const user = { id: 1, email };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Main wallet analysis endpoint - secured
app.get('/api/wallet/:address', authenticateToken, async (req, res) => {
  try {
    const { address } = req.params;
    
    
    // Validate address format (simplified for now)
    const isEVM = /^0x[a-fA-F0-9]{40}$/.test(address);
    const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    
    if (!isEVM && !isSolana) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }
    
    // In a real implementation, this would fetch data from blockchain APIs
    // For now, we'll use mock data based on chain type
    let chainData;
    if (isEVM) {
      chainData = {
        chain: 'EVM',
        // Mock transaction history
        transactions: [
          { hash: '0x123', timestamp: new Date('2023-01-01'), value: '1.0', from: '0x0', to: address, type: 'in' },
          { hash: '0x456', timestamp: new Date('2023-02-01'), value: '0.5', from: address, to: '0x789', type: 'out' }
        ]
      };
    } else {
      chainData = {
        chain: 'Solana',
        transactions: [
          { hash: 'sol123', timestamp: new Date('2023-01-15'), value: '5.0', from: 'sol000', to: address, type: 'in' },
          { hash: 'sol456', timestamp: new Date('2023-02-15'), value: '2.5', from: address, to: 'sol789', type: 'out' }
        ]
      };
    }

    // Calculate true cost basis and PnL (simplified mock implementation)
    const costBasis = {
      totalInvested: '1.5',
      currentBalance: '1.5',
      unrealizedPNL: '0.0',
      realizedPNL: '0.0'
    };

    // Save or update wallet data in database
    let walletData = await Wallet.findOne({ address });
    if (!walletData) {
      walletData = new Wallet({
        address,
        chain: chainData.chain,
        balance: costBasis.currentBalance,
        transactions: chainData.transactions
      });
    } else {
      // Update existing data
      walletData.balance = costBasis.currentBalance;
      walletData.transactions = chainData.transactions;
    }
    await walletData.save();

    // Return analysis results
    res.json({
      address,
      chain: chainData.chain,
      balance: costBasis.currentBalance,
      costBasis,
      transactions: chainData.transactions
    });
  } catch (error) {
    console.error('Error analyzing wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});

module.exports = app;
