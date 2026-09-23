require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes   = require('./routes/auth');
const notifyRoutes = require('./routes/notify');

const app  = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/auth',   authRoutes);
app.use('/api/notify', notifyRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'SAVIX Central Auth Server running on port ' + PORT });
});

// Connect to MongoDB and start
mongoose.connect((process.env.MONGO_URI || 'mongodb+srv://shubhamgoeltps_db_user:Shubham786@schemesathi.1vdnaig.mongodb.net/savix_central?appName=SchemeSathi'))
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas (savix_central)');
    app.listen(PORT, () => {
      console.log(`🚀 Central Auth Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

