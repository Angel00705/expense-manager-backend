const mongoose = require('mongoose');

const expenseTaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  plannedAmount: { type: Number, required: true },
  actualAmount: { type: Number, default: null },
  category: { type: String, required: true },
  responsible: { type: String, required: true },
  region: { type: String, required: true },
  ipName: { type: String, default: '' },
  status: { type: String, enum: ['planned', 'in_progress', 'completed', 'rejected'], default: 'planned' },
  dueDate: { type: Date },
  actualCompletionDate: { type: Date, default: null },
  createdBy: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('ExpenseTask', expenseTaskSchema);
