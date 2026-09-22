const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Pharmacy = require('../models/Pharmacy');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/reviews
// @desc    Add a review for a pharmacy after a completed order
// @access  Private (Customers)
router.post('/', protect, async (req, res) => {
  try {
    const { pharmacyId, rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Please provide a valid rating between 1 and 5' });
    }

    // Check if the user already reviewed this pharmacy
    const alreadyReviewed = await Review.findOne({ userId: req.user.id, pharmacyId });
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this pharmacy' });
    }

    const newReview = await Review.create({
      userId: req.user.id,
      pharmacyId,
      rating,
      review
    });

    // Update the pharmacy's average rating
    const allReviews = await Review.find({ pharmacyId });
    const avgRating = allReviews.reduce((acc, item) => item.rating + acc, 0) / allReviews.length;
    await Pharmacy.findByIdAndUpdate(pharmacyId, { rating: avgRating });

    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/reviews/pharmacies/:id/reviews
// @desc    Get all reviews for a specific pharmacy
// @access  Public
router.get('/pharmacies/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ pharmacyId: req.params.id })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
      
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
