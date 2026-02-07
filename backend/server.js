const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gardentracker')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/areas', require('./routes/areas'));
app.use('/api/plants', require('./routes/plants'));

app.get('/', (req, res) => {
  res.json({ message: '🌱 Garden Tracker API is running' });
});

app.listen(PORT, () => {
  console.log(`🌱 Server running on port ${PORT}`);
});
