const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pharmacyName: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    unique: true
  },
  pharmacyPhone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  shopPhoto: {
    type: String,
    default: 'https://via.placeholder.com/500x300?text=Shop+Photo'
  },
  licenseNumber: {
    type: String,
    required: true
  },
  openingTime: {
    type: String,
    required: true
  },
  closingTime: {
    type: String,
    required: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  rating: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// VERY IMPORTANT: Geospatial index for the nearest pharmacy search
pharmacySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Pharmacy', pharmacySchema);
