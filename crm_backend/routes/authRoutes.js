const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  getClients,
  getClientsOpportunities,
  getClientsSummary,
  outsourceService,
  registerDirect,
  getTeamGroups,
  deleteUser,
  editUser,
  resetPassword,
  registerCompany,
  assignClient,
  approveClient,
  getAuditLogs,
  subscribeService,
  savePanDetails,
  migrateChecklistAssignments,
  uploadProfileImage,
  removeProfileImage,
  uploadEntityLogo,
  removeEntityLogo,
  updateClientEntities,
  getPublicManagers,
  editClientProfile,
  uploadDirectorDocument,
  toggleComplianceRadar,
  reuploadProfileDocument,
  externalOnboard,
  updateMcaProfile,
  getClientsWithNoBankDetails,
  updateClientBankDetails
} = require('../controllers/authController');

const { checkUser, permit, preventAuditorWrite } = require('../middleware/rbac');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Authentication routes
router.post('/register', (req, res, next) => {
  if (req.headers['x-user-id']) {
    return checkUser(req, res, next);
  }
  next();
}, preventAuditorWrite, upload.any(), registerUser);
router.post('/login', loginUser);
router.post('/auth/register-direct', checkUser, preventAuditorWrite, permit('admin'), registerDirect);
router.post('/auth/register-company', registerCompany);

// User profile route
router.get('/users/profile/:id', getUserProfile);
router.patch('/users/profile/:id', checkUser, editClientProfile);
router.post('/users/profile/:id/directors/:index/document', checkUser, upload.single('file'), uploadDirectorDocument);
router.post('/users/profile/:id/subscribe-service', upload.any(), subscribeService);
router.post('/users/profile/:id/pan', upload.single('panFile'), savePanDetails);
router.put('/users/profile/:id/entities', checkUser, preventAuditorWrite, permit('admin', 'client_manager', 'filling_staff'), updateClientEntities);
router.post('/users/profile/:id/upload-image', upload.single('profileImage'), uploadProfileImage);
router.delete('/users/profile/:id/remove-image', removeProfileImage);
router.post('/users/profile/:id/entity/:entityName/upload-logo', upload.single('entityLogo'), uploadEntityLogo);
router.delete('/users/profile/:id/entity/:entityName/remove-logo', removeEntityLogo);
router.put('/users/profile/:id/documents/reupload', checkUser, upload.single('file'), reuploadProfileDocument);
router.post('/users/me/mca-profile', checkUser, upload.any(), updateMcaProfile);

// Client users listing & actions route
router.get('/users/clients/summary', checkUser, getClientsSummary); // Lightweight client list for dashboard
router.get('/users/clients/no-bank-details', checkUser, permit('admin', 'client_manager'), getClientsWithNoBankDetails);
router.patch('/users/clients/:id/bank-details', checkUser, preventAuditorWrite, permit('admin', 'client_manager'), updateClientBankDetails);
router.get('/users/clients', checkUser, getClients);
router.post('/users/clients/opportunities/query', checkUser, getClientsOpportunities);
router.patch('/users/clients/:id/assign', checkUser, preventAuditorWrite, permit('admin', 'client_manager'), assignClient);
router.patch('/users/clients/:id/onboarding', checkUser, preventAuditorWrite, permit('admin', 'client_manager'), approveClient);
router.patch('/users/clients/:id/compliance-radar', checkUser, preventAuditorWrite, permit('admin', 'client_manager', 'filling_staff'), toggleComplianceRadar);
router.post('/users/clients/:id/outsource-service', checkUser, preventAuditorWrite, permit('admin', 'client_manager'), outsourceService);
router.post('/users/clients/external-onboard', checkUser, preventAuditorWrite, permit('admin', 'client_manager'), upload.single('coiFile'), externalOnboard);

// Employee/Team routes
router.get('/users/team-groups', checkUser, getTeamGroups);
router.get('/users/public/managers', getPublicManagers);
router.delete('/delete_user/:id', checkUser, preventAuditorWrite, permit('admin'), deleteUser);
router.patch('/edit_user/:id', checkUser, preventAuditorWrite, permit('admin'), editUser);
router.post('/reset-password/:id', checkUser, preventAuditorWrite, permit('admin'), resetPassword);

// Audit logs route
router.get('/audit-logs', checkUser, permit('admin', 'auditor'), getAuditLogs);

// Migration: re-assign pending checklists from filing_staff to client_manager
router.post('/admin/migrate-checklist-assignments', checkUser, permit('admin'), migrateChecklistAssignments);

module.exports = router;
