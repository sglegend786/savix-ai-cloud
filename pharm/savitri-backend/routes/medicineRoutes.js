const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const Pharmacy = require('../models/Pharmacy');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   POST /api/medicines
// @desc    Add a new medicine
// @access  Private
router.post('/', protect, authorize('pharmacy_owner'), async (req, res) => {
  try {
    let pharmacy = await Pharmacy.findOne({ ownerId: req.user.id });
    if (!pharmacy) {
      // Self-heal: Create a pharmacy profile for legacy accounts that missed the updated registration flow
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      pharmacy = await Pharmacy.create({
        ownerId: req.user.id,
        pharmacyName: (user.name || 'Owner') + "'s Pharmacy",
        slug: 'pharmacy-' + Date.now(),
        pharmacyPhone: user.phone || '0000000000',
        address: 'Please update your address',
        location: { type: 'Point', coordinates: [77.209, 28.613] },
        licenseNumber: 'PENDING',
        openingTime: '09:00 AM',
        closingTime: '09:00 PM'
      });
    }

    // Extract all potential fields sent from the frontend modal
    const medicineData = { ...req.body };
    
    // Enforce backend-controlled fields
    medicineData.pharmacyId = pharmacy._id;
    
    // Ensure required fields like expiryDate have a fallback if empty
    if (!medicineData.expiryDate) {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      medicineData.expiryDate = nextYear;
    }

    const medicine = await Medicine.create(medicineData);
    res.status(201).json(medicine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/medicines/search-master
// @desc    Search global medicine catalog (Public — used for autocomplete by customers too)
// @access  Public
router.get('/search-master', async (req, res) => {
  try {
    const q = req.query.q;
    const limit = parseInt(req.query.limit) || 10;
    if (!q) return res.status(200).json([]);

    const MasterMedicine = require('../models/MasterMedicine');
    const results = await MasterMedicine.find({ name: { $regex: q, $options: 'i' } }).limit(limit);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/medicines/master/:id
// @desc    Get a single master medicine by ID (for medicine detail page)
// @access  Public
router.get('/master/:id', async (req, res) => {
  try {
    const MasterMedicine = require('../models/MasterMedicine');
    const med = await MasterMedicine.findById(req.params.id);
    if (!med) return res.status(404).json({ message: 'Medicine not found' });
    res.status(200).json(med);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/medicines/my
// @desc    Get owner's inventory
// @access  Private
router.get('/my', protect, authorize('pharmacy_owner'), async (req, res) => {
  try {
    let pharmacy = await Pharmacy.findOne({ ownerId: req.user.id });
    if (!pharmacy) {
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      pharmacy = await Pharmacy.create({
        ownerId: req.user.id,
        pharmacyName: (user.name || 'Owner') + "'s Pharmacy",
        slug: 'pharmacy-' + Date.now(),
        pharmacyPhone: user.phone || '0000000000',
        address: 'Please update your address',
        location: { type: 'Point', coordinates: [77.209, 28.613] },
        licenseNumber: 'PENDING',
        openingTime: '09:00 AM',
        closingTime: '09:00 PM'
      });
    }

    const medicines = await Medicine.find({ pharmacyId: pharmacy._id });
    res.status(200).json(medicines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/medicines
// @desc    Get medicines (Public search fallback)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const filter = req.query.pharmacyId ? { pharmacyId: req.query.pharmacyId } : {};
    const medicines = await Medicine.find(filter).populate('pharmacyId', 'pharmacyName address rating');
    res.status(200).json(medicines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/medicines/:id
// @desc    Update medicine
// @access  Private
router.put('/:id', protect, authorize('pharmacy_owner'), async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findOne({ ownerId: req.user.id });
    if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });

    const medicine = await Medicine.findOneAndUpdate(
      { _id: req.params.id, pharmacyId: pharmacy._id },
      req.body,
      { new: true }
    );
    if (!medicine) return res.status(404).json({ message: 'Medicine not found or unauthorized' });
    res.status(200).json(medicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/medicines/:id
// @desc    Delete a medicine
// @access  Private
router.delete('/:id', protect, authorize('pharmacy_owner'), async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findOne({ ownerId: req.user.id });
    if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });

    const medicine = await Medicine.findOneAndDelete({ _id: req.params.id, pharmacyId: pharmacy._id });
    if (!medicine) return res.status(404).json({ message: 'Medicine not found or unauthorized' });
    res.status(200).json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
