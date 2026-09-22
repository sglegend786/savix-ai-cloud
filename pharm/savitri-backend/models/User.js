const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['customer', 'pharmacy_owner', 'admin'], default: 'customer' },
  savedLocations: [{
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
    addressLabel: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
