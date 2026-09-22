const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl: { type: String, required: true },
  extractedMedicines: [{
    medicineName: String,
    brandName: String,
    genericName: String,
    strength: String,
    dosage: String,
    quantity: Number,
    frequency: String
  }],
  verificationStatus: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
