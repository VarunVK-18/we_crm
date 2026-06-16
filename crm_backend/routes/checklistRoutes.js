const express = require('express');
const router = express.Router();
const {
  createChecklist,
  getChecklists,
  getMyChecklists,
  toggleChecklistItem,
  addChecklistItem,
  updateChecklist,
  uploadFinalDocuments,
  deleteFinalDocument,
  reuploadFinalDocument,
  createSupportTicketForChecklist
} = require('../controllers/checklistController');

const { checkUser, permit } = require('../middleware/rbac');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit per file
});

// Checklist Management Routes
router.post('/checklists', checkUser, permit('admin', 'client_manager'), createChecklist);
router.get('/checklists', checkUser, getChecklists);
router.get('/my-checklists', checkUser, getMyChecklists); // For Flutter customer app
router.patch('/checklists/:id', checkUser, permit('admin', 'client_manager', 'filling_staff', 'account_manager', 'customer'), updateChecklist);
router.post('/checklists/:id/items', checkUser, permit('admin', 'client_manager'), addChecklistItem);
router.patch('/checklists/:id/items/:itemIndex', checkUser, permit('admin', 'client_manager', 'filling_staff', 'account_manager'), toggleChecklistItem);
router.post('/checklists/:id/final-documents', checkUser, permit('admin', 'client_manager', 'filling_staff', 'account_manager'), upload.any(), uploadFinalDocuments);
router.delete('/checklists/:id/final-documents/:docId', checkUser, permit('admin', 'client_manager', 'filling_staff', 'account_manager'), deleteFinalDocument);
router.put('/checklists/:id/final-documents/:docId/reupload', checkUser, permit('admin', 'client_manager', 'filling_staff', 'account_manager'), upload.single('final_file'), reuploadFinalDocument);

// Document upload route for Flutter customers
const { uploadRequestedDocuments } = require('../controllers/checklistController');
router.post('/checklists/:id/upload-documents', checkUser, upload.any(), uploadRequestedDocuments);

// Support ticket for a checklist
router.post('/checklists/:id/support-ticket', checkUser, createSupportTicketForChecklist);

module.exports = router;
