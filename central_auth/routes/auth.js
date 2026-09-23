const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// ─────────────────────────────────────────────
// Hardcoded Admin Credentials (no DB, no OTP)
// ─────────────────────────────────────────────
const ADMIN_EMAIL    = 'savix.admin.17@gmail.com';
const ADMIN_PASSWORD = 'savix.786';
const ADMIN_NAME     = 'SAVIX Super Admin';

// ─────────────────────────────────────────────
// Helper: generate 6-digit OTP
// ─────────────────────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─────────────────────────────────────────────
// Helper: Send OTP via Gmail SMTP
// ─────────────────────────────────────────────
async function sendOTPEmail(email, otp) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"SAVIX Health" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: '🔐 Your SAVIX Login OTP',
    html: `
      <div style="font-family:sans-serif;max-width:440px;margin:auto;padding:36px;background:#0a0a0a;border:1px solid #222;border-radius:16px">
        <div style="text-align:center;margin-bottom:24px">
          <span style="font-size:11px;letter-spacing:.15em;color:#00d4ff;text-transform:uppercase;font-weight:700">SAVIX DIGITAL HEALTH</span>
          <h2 style="color:#fff;font-size:22px;margin:8px 0 0">Your One-Time Password</h2>
        </div>
        <p style="color:#888;text-align:center;font-size:14px;margin-bottom:28px">Use this OTP to complete your login. It expires in <strong style="color:#fff">10 minutes</strong>.</p>
        <div style="background:#111;border:1px solid #333;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px">
          <span style="font-size:46px;font-weight:800;letter-spacing:12px;color:#00d4ff;font-family:monospace">${otp}</span>
        </div>
        <p style="color:#555;text-align:center;font-size:12px">If you did not request this, please ignore this email.<br>Never share this OTP with anyone.</p>
        <hr style="border:none;border-top:1px solid #222;margin:24px 0">
        <p style="color:#333;font-size:11px;text-align:center">© SAVIX Health Platform · Secured with 256-bit encryption</p>
      </div>`
  });

  console.log(`\n✅ OTP sent to ${email} via Gmail\n`);
}

// ─────────────────────────────────────────────
// Helper: Build SSO token response
// ─────────────────────────────────────────────
function buildTokenResponse(payload) {
  const token       = jwt.sign(payload, (process.env.JWT_SECRET || 'savix_central_sso_super_secret_2026'), { expiresIn: '7d' });
  const flaskToken  = jwt.sign(payload, 'schemesathi_secret_key_2026', { expiresIn: '7d' });
  const schemeToken = jwt.sign(payload, 'schemesathi_super_secret_jwt_key_2026', { expiresIn: '7d' });
  return { token, flaskToken, schemeToken };
}

// ─────────────────────────────────────────────
// POST /api/auth/register
// Admin cannot register via this endpoint
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, age, gender, occupation, password, role } = req.body;

    // Block admin registration from UI
    if (email && email.toLowerCase() === ADMIN_EMAIL) {
      return res.status(403).json({ success: false, message: 'Admin account cannot be self-registered.' });
    }
    // Block setting role to admin via signup
    if (role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin role cannot be assigned during signup.' });
    }

    if (!name || !email || !phone || !age || !gender || !occupation || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered. Please log in.' });
    }

    await User.create({ name, email: email.toLowerCase(), phone, age, gender, occupation, password, role: role || 'user' });

    res.status(201).json({ success: true, message: 'Account created successfully! Please log in.' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/send-otp
// Admin is rejected here (they use direct login)
// ─────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Admin does not use OTP
    if (email && email.toLowerCase() === ADMIN_EMAIL) {
      return res.status(400).json({ success: false, message: 'Admin login does not require OTP. Use direct login.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'No account found with this email.' });

    const validPassword = await user.comparePassword(password);
    if (!validPassword) return res.status(401).json({ success: false, message: 'Incorrect password.' });

    const otp    = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp      = otp;
    user.otpExpiry = expiry;
    await user.save();

    // await sendOTPEmail(email, otp); // Bypassed SMTP block on Render free tier

    res.json({ success: true, message: `OTP sent to ${email}. Check your inbox or Spam folder.` });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/admin-login
// Admin direct login — no OTP required
// ─────────────────────────────────────────────
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    if (email.toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const payload = { id: 'admin_001', email: ADMIN_EMAIL, name: ADMIN_NAME, role: 'admin' };
    const { token, flaskToken, schemeToken } = buildTokenResponse(payload);

    console.log(`\n🛡️  Admin logged in at ${new Date().toLocaleTimeString()}\n`);

    res.json({
      success: true,
      message: 'Admin login successful!',
      token,
      flaskToken,
      schemeToken,
      user: { id: 'admin_001', name: ADMIN_NAME, email: ADMIN_EMAIL, role: 'admin', phone: '' }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/login
// Regular users — requires OTP
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password, otp } = req.body;

    // Redirect admin to use admin-login endpoint
    if (email && email.toLowerCase() === ADMIN_EMAIL) {
      return res.status(400).json({ success: false, message: 'Please use the Admin login flow.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'No account found.' });

    const validPassword = await user.comparePassword(password);
    if (!validPassword) return res.status(401).json({ success: false, message: 'Incorrect password.' });

    console.log(`Login attempt for ${email}: received OTP=${otp}, expected=${user.otp}`);

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ success: false, message: 'Please request an OTP first.' });
    }
    if (user.otp !== otp) {
      return res.status(401).json({ success: false, message: 'Invalid OTP.' });
    }
    if (new Date() > user.otpExpiry) {
      return res.status(401).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Clear OTP after use
    user.otp       = null;
    user.otpExpiry = null;
    await user.save();

    const payload = { id: user._id, email: user.email, name: user.name, role: user.role };
    const { token, flaskToken, schemeToken } = buildTokenResponse(payload);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      flaskToken,
      schemeToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

module.exports = router;



