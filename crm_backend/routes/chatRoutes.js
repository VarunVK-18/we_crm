const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { checkUser } = require('../middleware/rbac');


router.get('/conversations/unread-count', checkUser, chatController.getUnreadCount);
router.get('/conversations/all', checkUser, chatController.getConversations);
router.get('/:orderId', chatController.getMessages);
router.post('/:orderId', chatController.sendMessage);
router.put('/:orderId/seen', chatController.markAsSeen);

module.exports = router;
