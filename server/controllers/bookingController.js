const Booking = require('../models/Booking');
const { processConversation, getWeather } = require('../services/aiService');

exports.handleVoiceInteraction = async (req, res) => {
    try {
        const { userText, history } = req.body;

        // 1. Process NLP using Gemini
        const aiResponse = await processConversation(userText, history || []);
        
        // 2. Logic Layer
        if (aiResponse.isComplete) {
            const { date, time, numberOfGuests } = aiResponse.bookingDetails;
            
            const existing = await Booking.findOne({ date, time });
            if (existing) {
                return res.json({
                    reply: `I'm sorry, we are fully booked at ${time} on ${date}. Can we try a different time?`,
                    isComplete: false,
                    bookingDetails: aiResponse.bookingDetails,
                    missingFields: ["time"] 
                });
            }

            // CORE: Fetch Real Weather
            const weather = await getWeather(date);
            let seating = 'indoor';
            let weatherNote = "";

            if (weather) {
                if (weather.condition === 'Rain' || weather.condition === 'Drizzle' || weather.condition === 'Thunderstorm') {
                    seating = 'indoor';
                    weatherNote = `It looks like rain (${weather.desc}). I've reserved an indoor table.`;
                } else if (weather.temp > 30) {
                    seating = 'indoor';
                    weatherNote = `It's quite hot (${weather.temp}°C), so I've booked an indoor table for comfort.`;
                } else {
                    seating = 'outdoor';
                    weatherNote = `The weather is lovely (${weather.temp}°C). I've set you up for outdoor seating.`;
                }
            }

            // CORE: Save to DB
            const newBooking = new Booking({
                ...aiResponse.bookingDetails,
                seatingArea: seating,
                weatherCondition: weather ? weather.condition : 'Unknown',
                weatherInfo: weather // Store full object as requested in Schema
            });
            await newBooking.save();

            aiResponse.reply = `Booking confirmed for ${numberOfGuests} people on ${date} at ${time}. ${weatherNote}`;
        }

        res.json(aiResponse);

    } catch (error) {
        console.error(error);
        res.status(500).json({ reply: "Server error processing request." });
    }
};

// CORE REQUIREMENTS (CRUD) 

// GET /api/bookings (Admin)
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/bookings/:id (Specific)
exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE /api/bookings/:id (Cancel)
exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};