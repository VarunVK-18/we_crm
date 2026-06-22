const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { checkUser } = require('../middleware/rbac');

router.get('/client/:clientId', checkUser, certificateController.getClientCertificates);
router.post('/:id/renew', checkUser, certificateController.renewCertificate);

// Admin / Webhook endpoints (add admin protection if needed)
router.post('/', certificateController.createCertificate);

module.exports = router;
