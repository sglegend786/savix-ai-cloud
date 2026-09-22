const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
  medicineName: { type: String, required: true },
  brandName: { type: String },
  genericName: { type: String },
  strength: { type: String },
  dosageForm: { type: String },
  packSize: { type: String },
  price: { type: Number, required: true },
  stockQuantity: { type: Number, required: true, default: 0 },
  expiryDate: { type: Date, required: true },
  prescriptionRequired: { type: Boolean, default: false },
  availability: { type: String, enum: ['In Stock', 'Low Stock', 'Out of Stock'], default: 'In Stock' }
}, { timestamps: true });

module.exports = mongoose.model('Medicine', medicineSchema);
