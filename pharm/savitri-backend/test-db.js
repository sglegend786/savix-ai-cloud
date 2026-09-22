const mongoose = require('mongoose');
const uri = 'mongodb+srv://shubhamgoeltps_db_user:utXqlqYBV0RT9wjz@schemesathi.1vdnaig.mongodb.net/savitri?appName=SchemeSathi';
mongoose.connect(uri).then(async () => {
  const Pharmacy = require('./models/Pharmacy');
  const pharmacies = await Pharmacy.find({});
  console.log('Pharmacies:', pharmacies.length);
  if (pharmacies.length > 0) {
    console.log('Sample loc:', JSON.stringify(pharmacies[0].location));
  }
  try {
    const indexes = await Pharmacy.collection.indexes();
    console.log('Indexes:', JSON.stringify(indexes, null, 2));
  } catch(e) {
    console.log('Index error:', e.message);
  }
  
  if (pharmacies.length > 0 && pharmacies[0].location && pharmacies[0].location.coordinates) {
    const coords = pharmacies[0].location.coordinates;
    try {
      const found = await Pharmacy.find({
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [coords[0], coords[1]] },
            $maxDistance: 10000
          }
        }
      });
      console.log('Geo search found:', found.length);
    } catch (err) {
      console.log('Geo search ERROR:', err.message);
    }
  }
  mongoose.disconnect();
}).catch(console.error);
