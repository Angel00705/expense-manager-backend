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

module.exports = router;
