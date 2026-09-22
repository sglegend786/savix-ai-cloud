const express = require('express');
const router = express.Router();

router.post('/create-order', async (req, res) => {
  try {
    const { amount } = req.body;
    // Mock Razorpay instance and response
    const order = {
      id: 'order_test_' + Date.now(),
      amount: amount * 100,
      currency: "INR"
    };
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
