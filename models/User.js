const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['accountant', 'manager', 'admin'], default: 'manager' },
  region: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
