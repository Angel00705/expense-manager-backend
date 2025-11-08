const mongoose = require('mongoose');

const ipSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  region: {
    type: String,
    required: true
  },
  inn: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('IP', ipSchema);
