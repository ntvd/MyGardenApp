const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  emoji: { type: String, default: '🌱' },
  description: { type: String, default: '' },
  coverColor: { type: String, default: '#7CB342' },
}, { timestamps: true });

module.exports = mongoose.model('Area', areaSchema);
