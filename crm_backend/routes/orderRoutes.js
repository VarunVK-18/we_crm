const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { checkUser } = require('../middleware/rbac');

router.get('/user/:userId', orderController.getUserOrders);
router.get('/company/:companyId', checkUser, orderController.getCompanyOrders);
router.post('/', orderController.createOrder);
router.put('/:id', orderController.updateOrder);

module.exports = router;
