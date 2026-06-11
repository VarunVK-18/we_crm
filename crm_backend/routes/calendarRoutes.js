const express = require('express');
const router = express.Router();
const multer = require('multer');
const { checkUser, permit } = require('../middleware/rbac');
const calendarController = require('../controllers/calendarController');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Routes
router.post('/upload', checkUser, permit('admin', 'manager'), upload.single('file'), calendarController.uploadCalendar);
router.get('/latest', checkUser, calendarController.getLatestCalendar);
router.get('/', checkUser, permit('admin', 'manager'), calendarController.getAllCalendars);

module.exports = router;
