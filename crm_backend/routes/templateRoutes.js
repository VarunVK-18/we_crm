const express = require('express');
const router = express.Router();
const { checkUser, permit } = require('../middleware/rbac');
const { getTemplates, upsertTemplate } = require('../controllers/templateController');

// All template routes are restricted to Admin
router.use(checkUser);
router.use(permit('admin'));

router.get('/checklists', getTemplates);
router.post('/checklists', upsertTemplate);

module.exports = router;
