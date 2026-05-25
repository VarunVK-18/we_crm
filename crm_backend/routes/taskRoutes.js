const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { 
  createTask,
  getTasks,
  updateTask,
  uploadTaskDocument,
  addTaskComment
} = require('../controllers/taskController');

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

// Task Management Routes
router.post('/tasks', checkUser, preventAuditorWrite, permit('admin', 'account_manager'), createTask);
router.get('/tasks', checkUser, getTasks);
router.patch('/tasks/:id', checkUser, preventAuditorWrite, permit('admin', 'account_manager', 'filling_staff'), updateTask);
router.post('/tasks/:id/documents', checkUser, preventAuditorWrite, permit('admin', 'account_manager', 'filling_staff'), upload.any(), uploadTaskDocument);
router.post('/tasks/:id/comments', checkUser, preventAuditorWrite, permit('admin', 'account_manager', 'filling_staff', 'sales_staff', 'agent'), addTaskComment);

module.exports = router;
