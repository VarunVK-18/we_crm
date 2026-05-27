const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.get('/:orderId', chatController.getMessages);
router.post('/:orderId', chatController.sendMessage);

module.exports = router;
