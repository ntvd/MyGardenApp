const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Plant = require('../models/Plant');

// Image upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// GET all plants (optional filter by area and/or category)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.area) filter.area = req.query.area;
    if (req.query.category) filter.category = req.query.category;
    const plants = await Plant.find(filter).populate('area category');
    res.json(plants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single plant
router.get('/:id', async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id).populate('area category');
    if (!plant) return res.status(404).json({ error: 'Plant not found' });
    res.json(plant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create plant
router.post('/', async (req, res) => {
  try {
    const plant = new Plant(req.body);
    await plant.save();
    res.status(201).json(plant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST add growth log entry with photo
router.post('/:id/growth-log', upload.single('photo'), async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);
    if (!plant) return res.status(404).json({ error: 'Plant not found' });

    const logEntry = {
      date: req.body.date || new Date().toISOString().split('T')[0],
      note: req.body.note || '',
      photo: req.file ? `/uploads/${req.file.filename}` : null,
    };

    plant.growthLog.push(logEntry);
    await plant.save();
    res.status(201).json(plant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update plant
router.put('/:id', async (req, res) => {
  try {
    const plant = await Plant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plant) return res.status(404).json({ error: 'Plant not found' });
    res.json(plant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE plant
router.delete('/:id', async (req, res) => {
  try {
    const plant = await Plant.findByIdAndDelete(req.params.id);
    if (!plant) return res.status(404).json({ error: 'Plant not found' });
    res.json({ message: 'Plant deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
