const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require('../controllers/authController');

// Authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// User profile route
router.get('/users/profile/:id', getUserProfile);

module.exports = router;
