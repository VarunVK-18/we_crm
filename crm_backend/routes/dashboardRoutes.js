const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { checkUser } = require('../middleware/rbac');

// GET /api/dashboard/stats?month=YYYY-MM
router.get('/stats', checkUser, getDashboardStats);

module.exports = router;
