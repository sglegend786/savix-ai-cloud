const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Pharmacy = require('./models/Pharmacy');
const Medicine = require('./models/Medicine');
const MasterMedicine = require('./models/MasterMedicine');
const User = require('./models/User');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://shubhamgoeltps_db_user:Shubham786@schemesathi.1vdnaig.mongodb.net/');
    console.log('Connected to DB for seeding...');

    // Clean existing
    await Pharmacy.deleteMany({});
    await Medicine.deleteMany({});
    await MasterMedicine.deleteMany({});
    console.log('Cleared existing data.');

    // 1. Create a mock Pharmacy Owner
    let owner = await User.findOne({ role: 'pharmacy_owner' });
    if (!owner) {
      owner = await User.create({
        name: 'Demo Owner',
        email: 'owner@demo.com',
        passwordHash: 'hashed_password_mock',
        phone: '9999999999',
        role: 'pharmacy_owner'
      });
    }

    // 2. Create mock Pharmacies (Scattered around Prayagraj: Lat 25.4358, Lng 81.8463)
    const pharmacies = [
      {
        ownerId: owner._id,
        pharmacyName: 'Apollo Pharmacy - Civil Lines',
        slug: 'apollo-civil-lines-1',
        pharmacyPhone: '9876543210',
        address: 'Civil Lines, Prayagraj, UP',
        location: { type: 'Point', coordinates: [81.8330, 25.4480] }, 
        licenseNumber: 'LIC-001',
        openingTime: '08:00 AM',
        closingTime: '10:00 PM',
        verificationStatus: 'verified',
        rating: 4.8
      },
      {
        ownerId: owner._id,
        pharmacyName: 'Wellness Medico - Chowk',
        slug: 'wellness-chowk-2',
        pharmacyPhone: '9876543211',
        address: 'Chowk, Prayagraj, UP',
        location: { type: 'Point', coordinates: [81.8250, 25.4300] }, 
        licenseNumber: 'LIC-002',
        openingTime: '09:00 AM',
        closingTime: '11:00 PM',
        verificationStatus: 'verified',
        rating: 4.5
      },
      {
        ownerId: owner._id,
        pharmacyName: 'Sanjeevani Pharma - Jhunsi',
        slug: 'sanjeevani-jhunsi-3',
        pharmacyPhone: '9876543212',
        address: 'Jhunsi, Prayagraj, UP',
        location: { type: 'Point', coordinates: [81.9050, 25.4350] }, 
        licenseNumber: 'LIC-003',
        openingTime: '24 Hours',
        closingTime: '24 Hours',
        verificationStatus: 'verified',
        rating: 4.9
      }
    ];

    const insertedPharmacies = await Pharmacy.insertMany(pharmacies);
    console.log('Inserted 3 Pharmacies.');

    // 3. Create Master Medicines
    const masterMeds = [
      { name: 'Paracetamol', composition: 'Paracetamol 500mg', manufacturer: 'GSK', category: 'Fever' },
      { name: 'Amoxicillin', composition: 'Amoxicillin 250mg', manufacturer: 'Cipla', category: 'Antibiotic' },
      { name: 'Cetirizine', composition: 'Cetirizine 10mg', manufacturer: 'Sun Pharma', category: 'Allergy' },
      { name: 'Metformin', composition: 'Metformin 500mg', manufacturer: 'Mankind', category: 'Diabetes' },
      { name: 'Dolo', composition: 'Paracetamol 650mg', manufacturer: 'Micro Labs', category: 'Fever' },
    ];
    await MasterMedicine.insertMany(masterMeds);
    console.log('Inserted Master Medicines.');

    // 4. Map Medicines to Pharmacies with different prices and stock
    const medicines = [];
    insertedPharmacies.forEach((pharm, index) => {
      // Apollo
      medicines.push({
        pharmacyId: pharm._id,
        medicineName: 'Paracetamol',
        composition: 'Paracetamol 500mg',
        price: index === 0 ? 15 : (index === 1 ? 12 : 18), // 15, 12, 18
        stockCount: 100,
        inStock: true,
        manufacturer: 'GSK',
        category: 'Fever',
        prescriptionRequired: false,
        expiryDate: new Date('2028-12-31')
      });
      medicines.push({
        pharmacyId: pharm._id,
        medicineName: 'Amoxicillin',
        composition: 'Amoxicillin 250mg',
        price: index === 0 ? 45 : (index === 1 ? 55 : 40),
        stockCount: 50,
        inStock: true,
        manufacturer: 'Cipla',
        category: 'Antibiotic',
        prescriptionRequired: true,
        expiryDate: new Date('2028-12-31')
      });
      medicines.push({
        pharmacyId: pharm._id,
        medicineName: 'Cetirizine',
        composition: 'Cetirizine 10mg',
        price: index === 0 ? 25 : (index === 1 ? 25 : 30),
        stockCount: 200,
        inStock: true,
        manufacturer: 'Sun Pharma',
        category: 'Allergy',
        prescriptionRequired: false,
        expiryDate: new Date('2028-12-31')
      });
    });

    await Medicine.insertMany(medicines);
    console.log('Inserted Medicines across pharmacies.');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();
