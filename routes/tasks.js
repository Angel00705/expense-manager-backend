const express = require('express');
const router = express.Router();
const ExpenseTask = require('../models/ExpenseTask');

// GET все задачи
router.get('/', async (req, res) => {
  try {
    const tasks = await ExpenseTask.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET задачи по ответственному
router.get('/responsible/:responsible', async (req, res) => {
  try {
    const tasks = await ExpenseTask.find({ responsible: req.params.responsible }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET задачи по региону
router.get('/region/:region', async (req, res) => {
  try {
    const tasks = await ExpenseTask.find({ region: req.params.region }).sort({ createdAt: -1 });
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
    res.status(201).json(task);
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
    );
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
