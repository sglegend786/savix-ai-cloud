const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy' },
  medicineName: { type: String, required: true },
  status: { type: String, enum: ['pending', 'fulfilled'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
