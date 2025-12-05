const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    customerName: { type: String, default: 'Guest' },
    email: { type: String }, // For bonus email confirmation
    numberOfGuests: { type: Number, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    time: { type: String, required: true },
    cuisine: { type: String, default: 'Any' },
    specialRequests: { type: String, default: 'None' },
    status: { type: String, default: 'confirmed' },
    seatingArea: { type: String, enum: ['indoor', 'outdoor'], default: 'indoor' },
    weatherCondition: { type: String } // Storing context
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);