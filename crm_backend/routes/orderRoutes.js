const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { checkUser } = require('../middleware/rbac');
const multer = require('multer');

const upload = multer({
  dest: 'uploads/dpiit/',
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
});

router.get('/user/:userId', orderController.getUserOrders);
router.get('/company/:companyId', checkUser, orderController.getCompanyOrders);
router.post('/', orderController.createOrder);
router.put('/:id', orderController.updateOrder);

router.post(
  '/:id/dpiit-form',
  upload.fields([
    { name: 'incorpCert', maxCount: 1 },
    { name: 'pan', maxCount: 1 },
    { name: 'logo', maxCount: 1 },
    { name: 'pitchDeck', maxCount: 1 },
  ]),
  orderController.submitDpiitForm
);

module.exports = router;
