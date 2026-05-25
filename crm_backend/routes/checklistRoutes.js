const express = require('express');
const router = express.Router();
const {
  createChecklist,
  getChecklists,
  getMyChecklists,
  toggleChecklistItem,
  addChecklistItem,
  updateChecklist
} = require('../controllers/checklistController');

const { checkUser, permit } = require('../middleware/rbac');

// Checklist Management Routes
router.post('/checklists', checkUser, permit('admin', 'client_manager'), createChecklist);
router.get('/checklists', checkUser, getChecklists);
router.get('/my-checklists', checkUser, getMyChecklists); // For Flutter customer app
router.patch('/checklists/:id', checkUser, permit('admin', 'client_manager'), updateChecklist);
router.post('/checklists/:id/items', checkUser, permit('admin', 'client_manager'), addChecklistItem);
router.patch('/checklists/:id/items/:itemIndex', checkUser, permit('admin', 'client_manager', 'filling_staff', 'account_manager'), toggleChecklistItem);

module.exports = router;
