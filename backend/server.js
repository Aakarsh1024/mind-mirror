const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const feelingRoutes = require('./routes/feelings');
const path = require('path');
const fs = require('fs'); // Required to create the uploads directory

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

// Ensure uploads directory exists on start
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Initialize the Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/feelings', feelingRoutes);

// Simple route for testing
app.get('/', (req, res) => {
  res.send('Mind Mirror API is running...');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});