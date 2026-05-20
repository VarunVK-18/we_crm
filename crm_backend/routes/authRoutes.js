const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  getClients,
  registerDirect,
  getTeamGroups,
  deleteUser,
  editUser,
  resetPassword
} = require('../controllers/authController');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Authentication routes
router.post('/register', upload.any(), registerUser);
router.post('/login', loginUser);
router.post('/auth/register-direct', registerDirect);

// User profile route
router.get('/users/profile/:id', getUserProfile);

// Client users listing route
router.get('/users/clients', getClients);

// Employee/Team routes
router.get('/users/team-groups', getTeamGroups);
router.delete('/delete_user/:id', deleteUser);
router.patch('/edit_user/:id', editUser);
router.post('/reset-password/:id', resetPassword);

module.exports = router;
