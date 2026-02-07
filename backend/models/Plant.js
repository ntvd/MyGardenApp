const mongoose = require('mongoose');

const growthLogSchema = new mongoose.Schema({
  date: { type: String, required: true },
  photo: { type: String, default: null }, // URL to uploaded image
  note: { type: String, default: '' },
}, { timestamps: true });

const plantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  area: { type: mongoose.Schema.Types.ObjectId, ref: 'Area', required: true },
  description: { type: String, default: '' },
  datePlanted: { type: String, required: true },
  growthLog: [growthLogSchema],
}, { timestamps: true });

module.exports = mongoose.model('Plant', plantSchema);
