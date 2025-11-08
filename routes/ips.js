const express = require('express');
const router = express.Router();
const IP = require('../models/IP');

// GET все ИП
router.get('/', async (req, res) => {
  try {
    const ips = await IP.find().sort({ name: 1 });
    res.json(ips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET ИП по региону
router.get('/region/:region', async (req, res) => {
  try {
    const ips = await IP.find({ region: req.params.region }).sort({ name: 1 });
    res.json(ips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET ИП по ID
router.get('/:id', async (req, res) => {
  try {
    const ip = await IP.findById(req.params.id);
    if (!ip) {
      return res.status(404).json({ error: 'ИП не найден' });
    }
    res.json(ip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
