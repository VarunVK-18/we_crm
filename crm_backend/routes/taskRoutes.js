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

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1 * 1024 * 1024 } // 1MB limit
});

// Task Management Routes
router.post('/tasks', checkUser, preventAuditorWrite, permit('admin', 'client_manager'), createTask);
router.get('/tasks', checkUser, getTasks);
router.patch('/tasks/:id', checkUser, preventAuditorWrite, permit('admin', 'client_manager', 'filling_staff', 'account_manager'), updateTask);
router.post('/tasks/:id/documents', checkUser, preventAuditorWrite, permit('admin', 'client_manager', 'filling_staff', 'account_manager'), upload.any(), uploadTaskDocument);
router.post('/tasks/:id/comments', checkUser, preventAuditorWrite, permit('admin', 'client_manager', 'filling_staff', 'account_manager'), addTaskComment);

module.exports = router;
