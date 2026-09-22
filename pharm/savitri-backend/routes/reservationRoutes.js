const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   POST /api/reservations
// @desc    Create a new medicine reservation
// @access  Private (Customers)
router.post('/', protect, async (req, res) => {
  try {
    const { pharmacyId, prescriptionId, medicines, totalPrice, customerContact } = req.body;

    const reservation = await Reservation.create({
      userId: req.user.id, // from protect middleware
      pharmacyId,
      prescriptionId,
      medicines,
      totalPrice,
      customerContact,
      reservationStatus: 'Pending'
    });

    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/reservations
// @desc    Get all reservations for a user or pharmacy
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'pharmacy_owner') {
      const Pharmacy = require('../models/Pharmacy');
      const pharmacy = await Pharmacy.findOne({ ownerId: req.user.id });
      if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });
      filter.pharmacyId = pharmacy._id;
    } else {
      // Customer looking at their own reservations
      filter.userId = req.user.id;
    }

    const reservations = await Reservation.find(filter)
      .populate('pharmacyId', 'pharmacyName address phone')
      .populate('medicines.medicineId', 'medicineName brandName price')
      .sort({ createdAt: -1 });

    res.status(200).json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/reservations/:id
// @desc    Get specific reservation details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('pharmacyId', 'pharmacyName address phone location')
      .populate('medicines.medicineId', 'medicineName dosageForm packSize');

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.status(200).json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/reservations/:id/status
// @desc    Update reservation status (e.g. Pending to Accepted, Ready for Pickup)
// @access  Private (Pharmacy Owners)
router.put('/:id/status', protect, authorize('pharmacy_owner', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status against schema enums
    const validStatuses = ['Pending', 'Accepted', 'Ready for Pickup', 'Completed', 'Rejected', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid reservation status' });
    }

    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { reservationStatus: status },
      { new: true, runValidators: true }
    );

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.status(200).json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
