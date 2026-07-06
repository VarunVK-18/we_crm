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
  createSupportTicketForChecklist,
  addFinancialLog,
  uploadExpenseBill,
  getExpenses,
  markExpensePaid
} = require('../controllers/checklistController');

const { checkUser, permit } = require('../middleware/rbac');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per file
});

// Checklist Management Routes
router.post('/checklists', checkUser, permit('admin', 'client_manager'), createChecklist);
router.get('/checklists', checkUser, getChecklists);
router.get('/my-checklists', checkUser, getMyChecklists); // For Flutter customer app

// Payment Tracker / Expenses
router.get('/checklists/expenses', checkUser, permit('admin', 'manager', 'client_manager', 'account_manager', 'filling_staff'), getExpenses);
router.patch('/checklists/:id', checkUser, permit('admin', 'client_manager', 'filling_staff', 'account_manager', 'customer'), updateChecklist);
router.post('/checklists/:id/items', checkUser, permit('admin', 'client_manager'), addChecklistItem);
router.patch('/checklists/:id/items/:itemIndex', checkUser, permit('admin', 'client_manager', 'filling_staff', 'account_manager'), toggleChecklistItem);
router.post('/checklists/:id/final-documents', checkUser, permit('admin', 'client_manager', 'filling_staff', 'account_manager'), upload.any(), uploadFinalDocuments);
router.delete('/checklists/:id/final-documents/:docId', checkUser, permit('admin', 'client_manager', 'filling_staff', 'account_manager'), deleteFinalDocument);
router.put('/checklists/:id/final-documents/:docId/reupload', checkUser, permit('admin', 'client_manager', 'filling_staff', 'account_manager'), upload.single('final_file'), reuploadFinalDocument);

// Temporary / Action Required Documents
const { uploadTemporaryDocuments, deleteTemporaryDocument, replyTemporaryDocument, attachDocumentAsTemporary } = require('../controllers/checklistController');
router.post('/checklists/:id/temporary-documents', checkUser, permit('admin', 'client_manager', 'filling_staff', 'account_manager'), upload.any(), uploadTemporaryDocuments);
router.post('/checklists/:id/temporary-documents/from-document', checkUser, permit('admin', 'client_manager', 'filling_staff', 'account_manager'), attachDocumentAsTemporary);
router.delete('/checklists/:id/temporary-documents/:docId', checkUser, permit('admin', 'client_manager', 'filling_staff', 'account_manager'), deleteTemporaryDocument);
router.post('/checklists/:id/temporary-documents/:docId/reply', checkUser, permit('admin', 'customer', 'client_manager'), upload.single('reply_file'), replyTemporaryDocument);

// Document upload route for Flutter customers
const { uploadRequestedDocuments } = require('../controllers/checklistController');
router.post('/checklists/:id/upload-documents', checkUser, upload.any(), uploadRequestedDocuments);

// Support ticket for a checklist
router.post('/checklists/:id/support-ticket', checkUser, createSupportTicketForChecklist);

// Financial log for a checklist
router.post('/checklists/:id/financial-logs', checkUser, permit('admin', 'client_manager', 'filling_staff', 'account_manager'), addFinancialLog);

router.post('/checklists/:id/items/:itemId/expense', checkUser, permit('admin', 'client_manager', 'filling_staff', 'account_manager'), upload.single('bill'), uploadExpenseBill);

router.post('/checklists/:id/items/:itemId/reimburse', checkUser, permit('admin', 'manager'), markExpensePaid);

module.exports = router;
