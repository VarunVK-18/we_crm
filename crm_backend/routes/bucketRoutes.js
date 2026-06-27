const express = require('express');
const router = express.Router();
const { checkUser, permit } = require('../middleware/rbac');
const {
  getBucketRequests,
  claimBucketRequest,
  getAvailableJobs,
  selfAssignJob,
  declineBucketRequest,
  getBucketCount
} = require('../controllers/bucketController');

// Admin and client_managers see open requests
router.get('/requests', checkUser, permit('admin', 'client_manager'), getBucketRequests);

// Count badge (for all staff roles)
router.get('/count', checkUser, permit('admin', 'client_manager', 'filling_staff', 'account_manager'), getBucketCount);

// Client manager claims a bucket request
router.post('/requests/:id/claim', checkUser, permit('admin', 'client_manager'), claimBucketRequest);

// Client manager declines a request
router.post('/requests/:id/decline', checkUser, permit('admin', 'client_manager'), declineBucketRequest);

// Filling staff sees jobs available to their team
router.get('/available', checkUser, permit('filling_staff', 'account_manager'), getAvailableJobs);

// Filling staff self-assigns a job
router.post('/requests/:id/self-assign', checkUser, permit('filling_staff', 'account_manager'), selfAssignJob);

module.exports = router;
