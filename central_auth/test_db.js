require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const u = await User.findOne({ email: 'goelshivika9@gmail.com' });
  console.log("User:", u.email, "OTP:", u.otp, "Expiry:", u.otpExpiry);
  process.exit(0);
});
