const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
  medicines: [{
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  totalPrice: { type: Number, required: true },
  reservationStatus: { type: String, enum: ['Pending', 'Accepted', 'Ready for Pickup', 'Completed', 'Rejected', 'Cancelled'], default: 'Pending' },
  customerContact: { type: String, required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
  paymentMethod: { type: String, enum: ['Cash', 'Online'], default: 'Cash' },
  paymentId: String
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);
