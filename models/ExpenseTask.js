const mongoose = require('mongoose');

const expenseTaskSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  
  // СВЯЗИ С СУЩЕСТВУЮЩИМИ СУЩНОСТЯМИ
  entrepreneur: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IP', 
    required: true 
  },
  cardId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    required: true 
  },
  expenseItemId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpenseItem',
    required: true 
  },
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true 
  },
  
  // РЕГИОН (дублируем для удобства фильтрации)
  region: { 
    type: String, 
    required: true 
  },
  
  // ДАННЫЕ ОТ БУХГАЛТЕРА (ПЛАН)
  plannedAmount: { 
    type: Number, 
    required: true 
  },
  dueDate: { 
    type: Date,
    required: true 
  },
  commentForManager: { 
    type: String, 
    default: '' 
  },
  
  // ДАННЫЕ ОТ УПРАВЛЯЮЩЕГО (ФАКТ)
  actualAmount: { 
    type: Number, 
    default: null 
  },
  actualCompletionDate: { 
    type: Date, 
    default: null 
  },
  managerComment: { 
    type: String, 
    default: '' 
  },
  receiptPhotoUrl: { 
    type: String, 
    default: '' 
  },
  
  // СТАТУС
  status: { 
    type: String, 
    enum: ['assigned', 'in_progress', 'completed', 'cancelled'], 
    default: 'assigned' 
  },
  
  // КТО СОЗДАЛ
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('ExpenseTask', expenseTaskSchema);
