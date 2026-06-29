const express = require('express');
const router = express.Router();
const {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  incrementClick
} = require('../controllers/bannerController');
const { checkUser, permit, preventAuditorWrite } = require('../middleware/rbac');
const multer = require('multer');

// Configure multer for file uploads in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  }
});

router.route('/')
  .get(checkUser, getBanners)
  .post(checkUser, preventAuditorWrite, permit('admin'), upload.any(), createBanner);

router.route('/:id')
  .put(checkUser, preventAuditorWrite, permit('admin'), upload.any(), updateBanner)
  .delete(checkUser, preventAuditorWrite, permit('admin'), deleteBanner);

router.post('/:id/click', checkUser, incrementClick);

module.exports = router;
