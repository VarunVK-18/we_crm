const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, getClients } = require('../controllers/authController');

// Authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// User profile route
router.get('/users/profile/:id', getUserProfile);

// Client users listing route
router.get('/users/clients', getClients);

module.exports = router;
