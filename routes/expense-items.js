const express = require('express');
const router = express.Router();
const ExpenseItem = require('../models/ExpenseItem');

// GET все статьи расходов
router.get('/', async (req, res) => {
  try {
    const expenseItems = await ExpenseItem.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ name: 1 });
    res.json(expenseItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET статьи расходов по создателю
router.get('/created-by/:userId', async (req, res) => {
  try {
    const expenseItems = await ExpenseItem.find({ 
      createdBy: req.params.userId,
      isActive: true 
    })
      .populate('createdBy', 'name email')
      .sort({ name: 1 });
    res.json(expenseItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST создать статью расхода
router.post('/', async (req, res) => {
  try {
    const expenseItem = new ExpenseItem(req.body);
    await expenseItem.save();
    
    const populatedItem = await ExpenseItem.findById(expenseItem._id)
      .populate('createdBy', 'name email');
      
    res.status(201).json(populatedItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT обновить статью расхода
router.put('/:id', async (req, res) => {
  try {
    const expenseItem = await ExpenseItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('createdBy', 'name email');
    
    res.json(expenseItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE (деактивировать) статью расхода
router.delete('/:id', async (req, res) => {
  try {
    const expenseItem = await ExpenseItem.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    res.json({ message: 'Статья расхода деактивирована', expenseItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
