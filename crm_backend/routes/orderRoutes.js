const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.get('/user/:userId', orderController.getUserOrders);
router.post('/', orderController.createOrder);
router.put('/:id', orderController.updateOrder);

module.exports = router;
