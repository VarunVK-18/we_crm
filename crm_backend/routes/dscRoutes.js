const express = require('express');
const router = express.Router();
const dscController = require('../controllers/dscController');

router.get('/user/:userId', dscController.getUserDscOrders);
router.post('/', dscController.createDscOrder);
router.put('/:id', dscController.updateDscOrder);

module.exports = router;
