const express = require('express');
const router = express.Router();
const ExpenseTask = require('../models/ExpenseTask');

// GET все задачи с populate (чтобы получать связанные данные)
router.get('/', async (req, res) => {
  try {
    const tasks = await ExpenseTask.find()
      .populate('entrepreneur', 'name') // получаем название ИП
      .populate('cardId', 'cardNumber cardName') // получаем данные карты
      .populate('expenseItemId', 'name description') // получаем статью расхода
      .populate('assignedTo', 'name email') // получаем данные управляющего
      .populate('createdBy', 'name email') // получаем данные создателя
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET задачи по ответственному (управляющему)
router.get('/assigned-to/:userId', async (req, res) => {
  try {
    const tasks = await ExpenseTask.find({ assignedTo: req.params.userId })
      .populate('entrepreneur', 'name')
      .populate('cardId', 'cardNumber cardName')
      .populate('expenseItemId', 'name description')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET задачи по региону
router.get('/region/:region', async (req, res) => {
  try {
    const tasks = await ExpenseTask.find({ region: req.params.region })
      .populate('entrepreneur', 'name')
      .populate('cardId', 'cardNumber cardName')
      .populate('expenseItemId', 'name description')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET задачи по ИП
router.get('/entrepreneur/:entrepreneurId', async (req, res) => {
  try {
    const tasks = await ExpenseTask.find({ entrepreneur: req.params.entrepreneurId })
      .populate('entrepreneur', 'name')
      .populate('cardId', 'cardNumber cardName')
      .populate('expenseItemId', 'name description')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST создать задачу
router.post('/', async (req, res) => {
  try {
    const task = new ExpenseTask(req.body);
    await task.save();
    
    // Возвращаем задачу с populate данными
    const populatedTask = await ExpenseTask.findById(task._id)
      .populate('entrepreneur', 'name')
      .populate('cardId', 'cardNumber cardName')
      .populate('expenseItemId', 'name description')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
      
    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT обновить задачу
router.put('/:id', async (req, res) => {
  try {
    const task = await ExpenseTask.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    .populate('entrepreneur', 'name')
    .populate('cardId', 'cardNumber cardName')
    .populate('expenseItemId', 'name description')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');
    
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE удалить задачу
router.delete('/:id', async (req, res) => {
  try {
    await ExpenseTask.findByIdAndDelete(req.params.id);
    res.json({ message: 'Задача удалена' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
