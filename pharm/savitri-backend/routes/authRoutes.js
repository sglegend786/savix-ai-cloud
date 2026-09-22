const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/sso
// @desc    SSO login via central JWT
router.post('/sso', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token missing' });

    // Decode token using the shared secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find if user exists in the local DB
    let user = await User.findOne({ email: decoded.email });
    
    if (!user) {
      // Map central role to local role
      let localRole = 'customer';
      if (decoded.role === 'admin') localRole = 'admin';
      if (decoded.role === 'pharmacy_owner') localRole = 'pharmacy_owner';
      if (decoded.role === 'hospital') localRole = 'hospital';

      // Auto-register the user if they don't exist
      user = await User.create({
        name: decoded.name || 'SSO User',
        email: decoded.email,
        phone: decoded.phone || '0000000000', // default stub
        passwordHash: 'sso-login-no-password',
        role: localRole
      });
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid SSO token', error: error.message });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  try {
    const { 
      name, email, phone, password, role,
      pharmacyName, pharmacyPhone, address, location, licenseNumber, openingTime, closingTime
    } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: role || 'customer',
    });

    // If role is pharmacy_owner, create their Pharmacy document
    if (user.role === 'pharmacy_owner') {
      const slug = pharmacyName 
        ? pharmacyName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4)
        : `pharmacy-${Date.now()}`;
        
      await Pharmacy.create({
        ownerId: user._id,
        pharmacyName: pharmacyName || 'Unnamed Pharmacy',
        slug,
        pharmacyPhone: pharmacyPhone || phone,
        address: address || 'Address Pending',
        location: location || { type: 'Point', coordinates: [77.209, 28.613] },
        licenseNumber: licenseNumber || 'PENDING',
        openingTime: openingTime || '09:00 AM',
        closingTime: closingTime || '09:00 PM'
      });
    }

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
router.post('/logout', (req, res) => {
  // In a stateless JWT setup, logout is typically handled client-side by destroying the token.
  // Returning a success response here.
  res.status(200).json({ message: 'User logged out successfully' });
});

module.exports = router;
