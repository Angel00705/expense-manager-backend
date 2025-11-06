const express = require('express');
const router = express.Router();
const Card = require('../models/Card');
const IP = require('../models/IP');

// GET все карты
router.get('/', async (req, res) => {
  try {
    const cards = await Card.find().populate('ipId').sort({ createdAt: -1 });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET карты по региону
router.get('/region/:region', async (req, res) => {
  try {
    const cards = await Card.find()
      .populate({
        path: 'ipId',
        match: { region: req.params.region }
      })
      .sort({ createdAt: -1 });
    
    const filteredCards = cards.filter(card => card.ipId !== null);
    res.json(filteredCards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST создать карту
router.post('/', async (req, res) => {
  try {
    const card = new Card(req.body);
    await card.save();
    await card.populate('ipId');
    res.status(201).json(card);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
