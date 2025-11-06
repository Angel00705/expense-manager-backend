const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  ipId: { type: mongoose.Schema.Types.ObjectId, ref: 'IP', required: true },
  type: { type: String, enum: ['corp', 'personal'], required: true },
  numberMask: { type: String, required: true },
  status: { type: String, default: '' },
  extra: { type: String, default: '' },
  months: {
    'Октябрь 2025': {
      corporate: { type: String, default: null },
      market: { type: String, default: null },
      personal: { type: String, default: null }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Card', cardSchema);
