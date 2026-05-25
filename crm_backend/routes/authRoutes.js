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
  resetPassword,
  registerCompany,
  assignClient,
  approveClient,
  getAuditLogs,
  subscribeService
} = require('../controllers/authController');

const { checkUser, permit, preventAuditorWrite } = require('../middleware/rbac');

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
router.post('/register', (req, res, next) => {
  if (req.headers['x-user-id']) {
    return checkUser(req, res, next);
  }
  next();
}, preventAuditorWrite, upload.any(), registerUser);
router.post('/login', loginUser);
router.post('/auth/register-direct', checkUser, preventAuditorWrite, permit('admin'), registerDirect);
router.post('/auth/register-company', registerCompany);

// User profile route
router.get('/users/profile/:id', getUserProfile);
router.post('/users/profile/:id/subscribe-service', upload.any(), subscribeService);

// Client users listing & actions route
router.get('/users/clients', checkUser, getClients);
router.patch('/users/clients/:id/assign', checkUser, preventAuditorWrite, permit('admin', 'client_manager'), assignClient);
router.patch('/users/clients/:id/onboarding', checkUser, preventAuditorWrite, permit('admin', 'client_manager'), approveClient);

// Employee/Team routes
router.get('/users/team-groups', checkUser, getTeamGroups);
router.delete('/delete_user/:id', checkUser, preventAuditorWrite, permit('admin'), deleteUser);
router.patch('/edit_user/:id', checkUser, preventAuditorWrite, permit('admin'), editUser);
router.post('/reset-password/:id', checkUser, preventAuditorWrite, permit('admin'), resetPassword);

// Audit logs route
router.get('/audit-logs', checkUser, permit('admin', 'auditor'), getAuditLogs);

module.exports = router;
