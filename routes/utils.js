const express = require('express');
const router = express.Router();
const User = require('../models/User');
const IP = require('../models/IP');
const Card = require('../models/Card');

// GET все управляющие по региону
router.get('/managers/:region', async (req, res) => {
  try {
    const managers = await User.find({ 
      role: 'manager',
      region: req.params.region 
    }).select('name email region role');
    res.json(managers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET все регионы
router.get('/regions', async (req, res) => {
  try {
    const regions = await IP.distinct('region');
    res.json(regions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET карты по ИП
router.get('/cards-by-ip/:ipId', async (req, res) => {
  try {
    const cards = await Card.find({ ipId: req.params.ipId }).select('cardNumber cardName numberMask');
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET ИП по региону с картами
router.get('/ips-with-cards/:region', async (req, res) => {
  try {
    const ips = await IP.find({ region: req.params.region });
    const result = await Promise.all(
      ips.map(async (ip) => {
        const cards = await Card.find({ ipId: ip._id }).select('cardNumber cardName numberMask');
        return {
          ...ip.toObject(),
          cards
        };
      })
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
