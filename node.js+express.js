const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB Connection
mongoose.connect('mongodb://localhost/supremeamer', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Schema for Mining Data
const miningDataSchema = new mongoose.Schema({
  address: { type: String, unique: true, required: true },
  ip: { type: String, required: true },
  balance: { type: Number, default: 0 },
  endTime: { type: Number, default: 0 },
});
const MiningData = mongoose.model('MiningData', miningDataSchema);

// Get Mining Data API
app.get('/getMiningData', async (req, res) => {
  try {
    const { address } = req.query;
    const miningData = await MiningData.findOne({ address });
    if (miningData) {
      res.json(miningData);
    } else {
      res.json({ balance: 0, endTime: 0 });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Save Mining Data API
app.post('/saveMiningData', async (req, res) => {
  try {
    const { address, balance, endTime, ip } = req.body;
    let miningData = await MiningData.findOne({ address });

    if (miningData) {
      miningData.balance = balance;
      miningData.endTime = endTime;
      await miningData.save();
    } else {
      miningData = new MiningData({ address, balance, endTime, ip });
      await miningData.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
