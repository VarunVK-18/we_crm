const express = require('express');
const router = express.Router();
const { checkUser, permit } = require('../middleware/rbac');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const {
  getBucketRequests,
  claimBucketRequest,
  getAvailableJobs,
  selfAssignJob,
  declineBucketRequest,
  getBucketCount,
  directAssignOpportunity
} = require('../controllers/bucketController');

// Admin and client_managers see open requests
router.get('/requests', checkUser, permit('admin', 'client_manager'), getBucketRequests);

// Count badge (for all staff roles)
router.get('/count', checkUser, permit('admin', 'client_manager', 'filling_staff', 'account_manager'), getBucketCount);

// Client manager claims a bucket request (supports optional COI file upload for compliance requests)
router.post('/requests/:id/claim', checkUser, permit('admin', 'client_manager'), upload.single('coiFile'), claimBucketRequest);

// Admin/Manager direct assign
router.post('/requests/direct-assign', checkUser, permit('admin', 'client_manager'), directAssignOpportunity);

// Client manager declines a request
router.post('/requests/:id/decline', checkUser, permit('admin', 'client_manager'), declineBucketRequest);

// Filling staff sees jobs available to their team
router.get('/available', checkUser, permit('filling_staff', 'account_manager'), getAvailableJobs);

// Filling staff self-assigns a job
router.post('/requests/:id/self-assign', checkUser, permit('admin', 'client_manager', 'filling_staff', 'account_manager'), selfAssignJob);

module.exports = router;
