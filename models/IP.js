const mongoose = require('mongoose');

const ipSchema = new mongoose.Schema({
  name: { type: String, required: true },
  region: { type: String, required: true },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('IP', ipSchema);
