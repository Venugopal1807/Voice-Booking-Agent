const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// 1. LOAD DOTENV FIRST (Before importing routes/services)
const dotenv = require('dotenv');
const dotenvResult = dotenv.config();

// Now it is safe to import services that use process.env
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------------------------------------------------------------
// 🔍 DEBUGGING BLOCK
// ---------------------------------------------------------------------------
console.log('\n==================================================');
console.log('👀 SERVER STARTUP CONFIG CHECK');
console.log('==================================================');

// 1. Check if file was read
if (dotenvResult.error) {
    console.log('❌ DOTENV: Error reading .env file!', dotenvResult.error);
} else {
    console.log('✅ DOTENV: File located and read.');
}

console.log('--------------------------------------------------');

// Check Mongo
if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('YOUR_PASSWORD')) {
    console.log('❌ MONGODB:   Broken (Contains placeholder or missing)');
} else {
    console.log('✅ MONGODB:   Loaded');
}

// Check Gemini
const geminiKey = process.env.GEMINI_API_KEY || "";
if (!geminiKey || geminiKey.includes('REPLACE_THIS') || geminiKey.includes('PASTE_REAL')) {
    console.log(`❌ GEMINI:    Broken. Current value: "${geminiKey}"`);
} else {
    // Show first 8 chars to prove it's the real one
    console.log(`✅ GEMINI:    Loaded (Starts with: ${geminiKey.substring(0, 8)}...)`);
}

// Check Weather
if (!process.env.WEATHER_API_KEY || process.env.WEATHER_API_KEY.includes('REPLACE_THIS')) {
    console.log('❌ WEATHER:   Broken (Contains placeholder)');
} else {
    console.log('✅ WEATHER:   Loaded');
}
console.log('==================================================\n');
// ---------------------------------------------------------------------------

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/bookings', bookingRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('Voice Agent API is running...');
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});