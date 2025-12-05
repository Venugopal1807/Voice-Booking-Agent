const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// 1. Voice Agent Interaction (The Core)
router.post('/chat', bookingController.handleVoiceInteraction);

// 2. Admin / CRUD Endpoints (The Requirements)
router.get('/', bookingController.getAllBookings);
router.get('/:id', bookingController.getBookingById);
router.delete('/:id', bookingController.deleteBooking);

module.exports = router;