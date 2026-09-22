const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: '../.env' });

const MasterMedicine = require('../models/MasterMedicine');
const Medicine = require('../models/Medicine');
const Pharmacy = require('../models/Pharmacy');

// Use the hardcoded connection string if env is missing
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://shubhamgoeltps_db_user:utXqlqYBV0RT9wjz@schemesathi.1vdnaig.mongodb.net/savitri?appName=SchemeSathi';

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected');

    console.log('Loading dataset...');
    const rawData = fs.readFileSync('C:\\Users\\Hp\\Downloads\\indian_medicine_data.json', 'utf8');
    const allMedicines = JSON.parse(rawData);
    
    // Take first 2000 for the master catalog to keep it fast, or up to 5000
    const sampleSize = Math.min(5000, allMedicines.length);
    const catalogData = [];
    
    for (let i = 0; i < sampleSize; i++) {
      const item = allMedicines[i];
      if (item.name) {
        catalogData.push({
          name: item.name,
          price: parseFloat(item['price(₹)']) || 100,
          manufacturer: item.manufacturer_name || 'Unknown',
          type: item.type || 'allopathy',
          packSize: item.pack_size_label || '1 Strip',
          composition: (item.short_composition1 || '') + (item.short_composition2 || '')
        });
      }
    }

    console.log(`Clearing MasterMedicine collection...`);
    await MasterMedicine.deleteMany();
    
    console.log(`Inserting ${catalogData.length} records into MasterMedicine...`);
    await MasterMedicine.insertMany(catalogData);
    console.log('Master Catalog Seeded Successfully!');

    // Now seed the pharmacies
    const pharmacies = await Pharmacy.find();
    if (pharmacies.length > 0) {
      console.log(`Found ${pharmacies.length} pharmacies. Seeding their inventories...`);
      await Medicine.deleteMany(); // Clear existing inventory to prevent duplicates
      
      let totalInserted = 0;
      for (const pharmacy of pharmacies) {
        const inventoryToInsert = [];
        
        // Pick 40 random medicines for this pharmacy
        for (let j = 0; j < 40; j++) {
          const randomCat = catalogData[Math.floor(Math.random() * catalogData.length)];
          // vary the price slightly for comparison (+- 20%)
          const priceVariance = randomCat.price * (0.8 + Math.random() * 0.4);
          
          inventoryToInsert.push({
            pharmacyId: pharmacy._id,
            medicineName: randomCat.name,
            brandName: randomCat.manufacturer,
            genericName: randomCat.composition,
            packSize: randomCat.packSize,
            price: Math.round(priceVariance),
            stockQuantity: Math.floor(Math.random() * 100) + 10,
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            availability: 'In Stock'
          });
        }
        
        await Medicine.insertMany(inventoryToInsert);
        totalInserted += inventoryToInsert.length;
      }
      console.log(`Successfully seeded ${totalInserted} medicines across pharmacies!`);
    } else {
      console.log('No pharmacies found. Skipping inventory seed.');
    }

    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
