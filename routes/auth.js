const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Логин
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Неверные данные' });
    }

    res.json({ 
      success: true, 
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        region: user.region
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
