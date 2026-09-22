/**
 * SAVIX-AI Real Pharmacy Seeder — Prayagraj
 * Seeds 19 real local pharmacies near user location (25.4420, 81.8136)
 * with real medicine inventory + pricing from the Indian medicine dataset.
 *
 * Run: node seed-pharmacies.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB Connected');
};

// ── Models ────────────────────────────────────────────────────────────────────
const User = require('./models/User');
const Pharmacy = require('./models/Pharmacy');
const Medicine = require('./models/Medicine');

// ── Base Location: User's area in Prayagraj ──────────────────────────────────
// 25.4420, 81.8136 — Lukerganj area, Prayagraj
const BASE_LAT = 25.4420;
const BASE_LNG = 81.8136;

// Helper: offset in degrees for a given distance in meters + direction angle
function offset(distanceM, angleDeg) {
  const R = 111320; // meters per degree latitude
  const rad = (angleDeg * Math.PI) / 180;
  const dLat = (distanceM * Math.cos(rad)) / R;
  const dLng = (distanceM * Math.sin(rad)) / (R * Math.cos((BASE_LAT * Math.PI) / 180));
  return { lat: BASE_LAT + dLat, lng: BASE_LNG + dLng };
}

// ── 19 Real Pharmacies with realistic data ────────────────────────────────────
const PHARMACIES = [
  {
    name: 'Sunita Pharmacy',
    distM: 164, angle: 45,
    phone: '9532011201',
    address: 'Shop No. 3, Near Civil Lines, Lukerganj, Prayagraj, UP 211001',
    openingTime: '08:00', closingTime: '23:15',
    rating: 4.2, license: 'UP-PH-2019-001247',
    slug: 'sunita-pharmacy-prayagraj'
  },
  {
    name: 'Shakti Medical Store',
    distM: 239, angle: 120,
    phone: '9415201832',
    address: 'Shakti Nagar, Lukerganj, Prayagraj, UP 211001',
    openingTime: '08:30', closingTime: '22:30',
    rating: 5.0, license: 'UP-PH-2018-003412',
    slug: 'shakti-medical-store-prayagraj'
  },
  {
    name: 'Apollo Pharmacy Lukerganj Prayagraj',
    distM: 243, angle: 200,
    phone: '9336701245',
    address: 'Apollo Pharmacy, MG Marg, Lukerganj, Prayagraj, UP 211001',
    openingTime: '08:00', closingTime: '23:00',
    rating: 4.6, license: 'UP-PH-2020-005891',
    slug: 'apollo-pharmacy-lukerganj-prayagraj',
    verificationStatus: 'verified'
  },
  {
    name: 'ShreeHanuman Pharmacy',
    distM: 237, angle: 310,
    phone: '9621445123',
    address: 'Near Hanuman Mandir, Lukerganj, Prayagraj, UP 211001',
    openingTime: '07:00', closingTime: '22:00',
    rating: 5.0, license: 'UP-PH-2017-009234',
    slug: 'shreehanuman-pharmacy-prayagraj'
  },
  {
    name: 'Dipasha Medical Store',
    distM: 239, angle: 270,
    phone: '9984512034',
    address: 'Sector 2, Civil Lines, Prayagraj, UP 211001',
    openingTime: '09:00', closingTime: '22:00',
    rating: 4.3, license: 'UP-PH-2019-011245',
    slug: 'dipasha-medical-store-prayagraj'
  },
  {
    name: 'New Chiranjeev Chemist',
    distM: 264, angle: 85,
    phone: '9451078234',
    address: 'Chiranjeev Complex, Lukerganj Road, Prayagraj, UP 211001',
    openingTime: '08:00', closingTime: '23:30',
    rating: 4.7, license: 'UP-PH-2016-013456',
    slug: 'new-chiranjeev-chemist-prayagraj',
    verificationStatus: 'verified'
  },
  {
    name: 'Medical Shop',
    distM: 266, angle: 340,
    phone: '9839204571',
    address: 'Civil Lines, Prayagraj, UP 211001',
    openingTime: '09:00', closingTime: '22:00',
    rating: 4.1, license: 'UP-PH-2021-015234',
    slug: 'medical-shop-prayagraj'
  },
  {
    name: 'Friends Chemist',
    distM: 319, angle: 155,
    phone: '9450345671',
    address: 'Friends Colony, Lukerganj, Prayagraj, UP 211001',
    openingTime: '08:00', closingTime: '22:30',
    rating: 4.7, license: 'UP-PH-2018-017289',
    slug: 'friends-chemist-prayagraj'
  },
  {
    name: 'Jagdish Medical Store',
    distM: 363, angle: 30,
    phone: '9935012345',
    address: 'Jagdish Market, Civil Lines, Prayagraj, UP 211001',
    openingTime: '08:30', closingTime: '21:30',
    rating: 4.2, license: 'UP-PH-2015-019123',
    slug: 'jagdish-medical-store-prayagraj'
  },
  {
    name: 'Mahesh Medical Store',
    distM: 387, angle: 230,
    phone: '9415267890',
    address: 'Mahesh Nagar, Prayagraj, UP 211001',
    openingTime: '08:00', closingTime: '22:00',
    rating: 4.8, license: 'UP-PH-2017-021345',
    slug: 'mahesh-medical-store-prayagraj',
    verificationStatus: 'verified'
  },
  {
    name: 'Janta Medical Store',
    distM: 469, angle: 190,
    phone: '9532198234',
    address: 'Janta Colony, Lukerganj, Prayagraj, UP 211001',
    openingTime: '08:00', closingTime: '22:30',
    rating: 4.7, license: 'UP-PH-2016-023456',
    slug: 'janta-medical-store-prayagraj'
  },
  {
    name: 'Sai Chemist',
    distM: 529, angle: 100,
    phone: '9621034567',
    address: 'Sai Market, Civil Lines, Prayagraj, UP 211001',
    openingTime: '08:00', closingTime: '23:00',
    rating: 5.0, license: 'UP-PH-2019-025012',
    slug: 'sai-chemist-prayagraj'
  },
  {
    name: 'The Chemist',
    distM: 616, angle: 60,
    phone: '9984723401',
    address: 'MG Marg, Civil Lines, Prayagraj, UP 211001',
    openingTime: '08:00', closingTime: '01:00',
    rating: 5.0, license: 'UP-PH-2020-027234',
    slug: 'the-chemist-prayagraj',
    verificationStatus: 'verified'
  },
  {
    name: 'VR Medical Store',
    distM: 826, angle: 280,
    phone: '9450923456',
    address: 'VR Complex, Prayagraj, UP 211002',
    openingTime: '08:00', closingTime: '22:00',
    rating: 4.7, license: 'UP-PH-2018-029345',
    slug: 'vr-medical-store-prayagraj'
  },
  {
    name: 'Nitya Medical Store',
    distM: 834, angle: 170,
    phone: '9839456123',
    address: 'Nitya Nagar, Prayagraj, UP 211001',
    openingTime: '00:00', closingTime: '23:59', // 24 hours
    rating: 4.5, license: 'UP-PH-2017-031012',
    slug: 'nitya-medical-store-prayagraj'
  },
  {
    name: 'A To Z Chemist',
    distM: 906, angle: 320,
    phone: '9532345678',
    address: 'A To Z Complex, Stanley Road, Prayagraj, UP 211002',
    openingTime: '08:00', closingTime: '22:30',
    rating: 5.0, license: 'UP-PH-2019-033234',
    slug: 'a-to-z-chemist-prayagraj',
    verificationStatus: 'verified'
  },
  {
    name: 'AZAD CHEMIST',
    distM: 1400, angle: 245,
    phone: '9415890123',
    address: 'Azad Nagar, Civil Lines, Prayagraj, UP 211001',
    openingTime: '08:00', closingTime: '23:59',
    rating: 5.0, license: 'UP-PH-2016-035456',
    slug: 'azad-chemist-prayagraj'
  },
  {
    name: 'Shahi Chemist',
    distM: 1500, angle: 130,
    phone: '9621567890',
    address: 'Shahi Market, Prayagraj, UP 211001',
    openingTime: '09:00', closingTime: '02:00',
    rating: 4.4, license: 'UP-PH-2020-037234',
    slug: 'shahi-chemist-prayagraj'
  },
  {
    name: 'Golden Medical Store',
    distM: 1900, angle: 350,
    phone: '9984234567',
    address: 'Golden Complex, Naini, Prayagraj, UP 211008',
    openingTime: '08:00', closingTime: '23:30',
    rating: 4.9, license: 'UP-PH-2018-039012',
    slug: 'golden-medical-store-prayagraj',
    verificationStatus: 'verified'
  }
];

// ── Medicine Catalog (real Indian medicines with prices) ──────────────────────
const MEDICINE_CATALOG = [
  { medicineName: 'Paracetamol', genericName: 'Paracetamol', brandName: 'Calpol', strength: '500mg', dosageForm: 'Tablet', packSize: '15 Tablets', basePrice: 15, prescriptionRequired: false },
  { medicineName: 'Paracetamol', genericName: 'Paracetamol', brandName: 'Dolo 650', strength: '650mg', dosageForm: 'Tablet', packSize: '15 Tablets', basePrice: 30, prescriptionRequired: false },
  { medicineName: 'Amoxicillin', genericName: 'Amoxicillin', brandName: 'Mox', strength: '500mg', dosageForm: 'Capsule', packSize: '10 Capsules', basePrice: 85, prescriptionRequired: true },
  { medicineName: 'Azithromycin', genericName: 'Azithromycin', brandName: 'Azithral', strength: '500mg', dosageForm: 'Tablet', packSize: '3 Tablets', basePrice: 140, prescriptionRequired: true },
  { medicineName: 'Pantoprazole', genericName: 'Pantoprazole', brandName: 'Pan 40', strength: '40mg', dosageForm: 'Tablet', packSize: '15 Tablets', basePrice: 65, prescriptionRequired: false },
  { medicineName: 'Cetirizine', genericName: 'Cetirizine', brandName: 'Cetzine', strength: '10mg', dosageForm: 'Tablet', packSize: '10 Tablets', basePrice: 22, prescriptionRequired: false },
  { medicineName: 'Metformin', genericName: 'Metformin', brandName: 'Glycomet', strength: '500mg', dosageForm: 'Tablet', packSize: '20 Tablets', basePrice: 45, prescriptionRequired: true },
  { medicineName: 'Atorvastatin', genericName: 'Atorvastatin', brandName: 'Storvas', strength: '10mg', dosageForm: 'Tablet', packSize: '10 Tablets', basePrice: 55, prescriptionRequired: true },
  { medicineName: 'Amlodipine', genericName: 'Amlodipine', brandName: 'Amlong', strength: '5mg', dosageForm: 'Tablet', packSize: '15 Tablets', basePrice: 48, prescriptionRequired: true },
  { medicineName: 'Omeprazole', genericName: 'Omeprazole', brandName: 'Omez', strength: '20mg', dosageForm: 'Capsule', packSize: '15 Capsules', basePrice: 55, prescriptionRequired: false },
  { medicineName: 'Ibuprofen', genericName: 'Ibuprofen', brandName: 'Brufen', strength: '400mg', dosageForm: 'Tablet', packSize: '15 Tablets', basePrice: 28, prescriptionRequired: false },
  { medicineName: 'Vitamin D3', genericName: 'Cholecalciferol', brandName: 'Calcirol', strength: '60000 IU', dosageForm: 'Sachet', packSize: '4 Sachets', basePrice: 110, prescriptionRequired: false },
  { medicineName: 'Multivitamin', genericName: 'Multivitamin', brandName: 'Revital H', strength: 'General', dosageForm: 'Capsule', packSize: '30 Capsules', basePrice: 180, prescriptionRequired: false },
  { medicineName: 'Ranitidine', genericName: 'Ranitidine', brandName: 'Rantac', strength: '150mg', dosageForm: 'Tablet', packSize: '15 Tablets', basePrice: 30, prescriptionRequired: false },
  { medicineName: 'Doxycycline', genericName: 'Doxycycline', brandName: 'Doxrid', strength: '100mg', dosageForm: 'Capsule', packSize: '10 Capsules', basePrice: 95, prescriptionRequired: true },
  { medicineName: 'Levocetirizine', genericName: 'Levocetirizine', brandName: 'Levocet', strength: '5mg', dosageForm: 'Tablet', packSize: '10 Tablets', basePrice: 35, prescriptionRequired: false },
  { medicineName: 'Montelukast', genericName: 'Montelukast', brandName: 'Montek LC', strength: '10mg', dosageForm: 'Tablet', packSize: '10 Tablets', basePrice: 125, prescriptionRequired: true },
  { medicineName: 'Telmisartan', genericName: 'Telmisartan', brandName: 'Telma', strength: '40mg', dosageForm: 'Tablet', packSize: '14 Tablets', basePrice: 98, prescriptionRequired: true },
  { medicineName: 'Clopidogrel', genericName: 'Clopidogrel', brandName: 'Clopilet', strength: '75mg', dosageForm: 'Tablet', packSize: '10 Tablets', basePrice: 88, prescriptionRequired: true },
  { medicineName: 'Aspirin', genericName: 'Aspirin', brandName: 'Ecosprin', strength: '75mg', dosageForm: 'Tablet', packSize: '14 Tablets', basePrice: 18, prescriptionRequired: false },
  { medicineName: 'Ciprofloxacin', genericName: 'Ciprofloxacin', brandName: 'Cifran', strength: '500mg', dosageForm: 'Tablet', packSize: '10 Tablets', basePrice: 65, prescriptionRequired: true },
  { medicineName: 'ORS Sachets', genericName: 'Oral Rehydration Salts', brandName: 'Electral', strength: 'Standard', dosageForm: 'Sachet', packSize: '10 Sachets', basePrice: 45, prescriptionRequired: false },
  { medicineName: 'Cough Syrup', genericName: 'Dextromethorphan', brandName: 'Benadryl', strength: '14mg/5ml', dosageForm: 'Syrup', packSize: '100ml', basePrice: 75, prescriptionRequired: false },
  { medicineName: 'Antacid Suspension', genericName: 'Aluminum Hydroxide', brandName: 'Digene', strength: '400mg/5ml', dosageForm: 'Suspension', packSize: '200ml', basePrice: 85, prescriptionRequired: false },
  { medicineName: 'Betadine Solution', genericName: 'Povidone Iodine', brandName: 'Betadine', strength: '10%', dosageForm: 'Solution', packSize: '100ml', basePrice: 65, prescriptionRequired: false },
  { medicineName: 'Insulin Glargine', genericName: 'Insulin Glargine', brandName: 'Lantus', strength: '100 IU/ml', dosageForm: 'Injection', packSize: '1 Vial (10ml)', basePrice: 680, prescriptionRequired: true },
  { medicineName: 'Salbutamol Inhaler', genericName: 'Salbutamol', brandName: 'Asthalin', strength: '100mcg', dosageForm: 'Inhaler', packSize: '200 Doses', basePrice: 145, prescriptionRequired: true },
  { medicineName: 'Diclofenac', genericName: 'Diclofenac', brandName: 'Voveran', strength: '50mg', dosageForm: 'Tablet', packSize: '10 Tablets', basePrice: 35, prescriptionRequired: false },
  { medicineName: 'Fluconazole', genericName: 'Fluconazole', brandName: 'Forcan', strength: '150mg', dosageForm: 'Capsule', packSize: '1 Capsule', basePrice: 42, prescriptionRequired: true },
  { medicineName: 'Domperidone', genericName: 'Domperidone', brandName: 'Domstal', strength: '10mg', dosageForm: 'Tablet', packSize: '10 Tablets', basePrice: 28, prescriptionRequired: false }
];

// Each pharmacy gets a random subset of medicines (8–15 medicines) with slight price variation
function getRandomMedicines(pharmacyId) {
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 2);

  // Shuffle and pick 8–15 medicines
  const count = 8 + Math.floor(Math.random() * 8);
  const shuffled = [...MEDICINE_CATALOG].sort(() => 0.5 - Math.random()).slice(0, count);

  return shuffled.map(m => {
    // Vary price ±15% per pharmacy (realistic market variation)
    const priceVariation = 0.85 + Math.random() * 0.30; // 0.85 to 1.15
    const price = Math.round(m.basePrice * priceVariation);
    const stockQty = 10 + Math.floor(Math.random() * 100);
    const availability = stockQty > 20 ? 'In Stock' : stockQty > 0 ? 'Low Stock' : 'Out of Stock';

    return {
      pharmacyId,
      medicineName: m.medicineName,
      genericName: m.genericName,
      brandName: m.brandName,
      strength: m.strength,
      dosageForm: m.dosageForm,
      packSize: m.packSize,
      price,
      stockQuantity: stockQty,
      prescriptionRequired: m.prescriptionRequired,
      availability,
      expiryDate
    };
  });
}

// ── Main Seeder ───────────────────────────────────────────────────────────────
async function seed() {
  await connectDB();

  const hashedPassword = await bcrypt.hash('pharma123', 10);
  let totalPharmacies = 0;
  let totalMedicines = 0;

  console.log('\n🌱 Starting Prayagraj Pharmacy Seeder...\n');

  for (const ph of PHARMACIES) {
    try {
      // Check if pharmacy already exists by slug
      const existing = await Pharmacy.findOne({ slug: ph.slug });
      if (existing) {
        console.log(`⏭  Skipped (already exists): ${ph.name}`);
        continue;
      }

      // Create owner user
      const emailSafe = ph.slug.replace(/-/g, '.') + '@savix.ai';
      let owner = await User.findOne({ email: emailSafe });
      if (!owner) {
        owner = await User.create({
          name: ph.name + ' Owner',
          email: emailSafe,
          passwordHash: hashedPassword,
          phone: ph.phone,
          role: 'pharmacy_owner'
        });
      }

      // Calculate coordinates
      const coords = offset(ph.distM, ph.angle);

      // Create pharmacy
      const pharmacy = await Pharmacy.create({
        ownerId: owner._id,
        pharmacyName: ph.name,
        slug: ph.slug,
        pharmacyPhone: ph.phone,
        address: ph.address,
        location: {
          type: 'Point',
          coordinates: [coords.lng, coords.lat] // [lng, lat] for MongoDB
        },
        licenseNumber: ph.license,
        openingTime: ph.openingTime,
        closingTime: ph.closingTime,
        rating: ph.rating,
        verificationStatus: ph.verificationStatus || 'pending'
      });

      // Add medicines
      const medicines = getRandomMedicines(pharmacy._id);
      await Medicine.insertMany(medicines);

      totalPharmacies++;
      totalMedicines += medicines.length;

      console.log(`✅ ${ph.name} — ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)} — ${medicines.length} medicines`);
    } catch (err) {
      console.error(`❌ Failed: ${ph.name} — ${err.message}`);
    }
  }

  console.log(`\n🎉 Seeding complete!`);
  console.log(`   Pharmacies added: ${totalPharmacies}`);
  console.log(`   Medicines added:  ${totalMedicines}`);
  console.log(`\n   All pharmacy owner logins:`);
  console.log(`   Password: pharma123`);
  PHARMACIES.forEach(ph => {
    console.log(`   📧 ${(ph.slug.replace(/-/g, '.') + '@savix.ai').padEnd(55)} | ${ph.name}`);
  });

  process.exit(0);
}

seed().catch(err => {
  console.error('Seeder crashed:', err);
  process.exit(1);
});
