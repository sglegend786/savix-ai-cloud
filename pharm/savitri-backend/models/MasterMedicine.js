const mongoose = require('mongoose');

const masterMedicineSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  price: { type: Number },
  manufacturer: { type: String },
  type: { type: String },
  packSize: { type: String },
  composition: { type: String }
});

module.exports = mongoose.model('MasterMedicine', masterMedicineSchema);
