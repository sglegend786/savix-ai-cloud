const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

router.post('/subscribe', async (req, res) => {
  try {
    const { userId, medicineName, pharmacyId } = req.body;
    const notification = new Notification({
      userId,
      medicineName,
      pharmacyId,
      status: 'pending'
    });
    await notification.save();
    res.status(201).json({ message: 'Subscribed to notifications', notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
