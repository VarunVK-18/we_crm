const express = require('express');
const router = express.Router();
const { checkUser, permit } = require('../middleware/rbac');
const {
  listDocumentTemplates,
  createDocumentTemplate,
  updateDocumentTemplate,
  deleteDocumentTemplate,
  generateDocumentFromTemplate,
  getTemplatesForService,
  mapTemplatesToService,
  previewPopulatedTemplate,
} = require('../controllers/documentTemplateController');

router.use(checkUser);

// CRUD — admin only
router.get('/', permit('admin', 'client_manager', 'filing_staff', 'filling_staff', 'account_manager', 'staff'), listDocumentTemplates);
router.post('/', permit('admin'), createDocumentTemplate);
router.put('/:id', permit('admin'), updateDocumentTemplate);
router.delete('/:id', permit('admin'), deleteDocumentTemplate);

// Preview populated template with client data
router.post('/:id/preview-populated', permit('admin', 'client_manager', 'filing_staff', 'filling_staff', 'account_manager', 'staff'), previewPopulatedTemplate);

// Generate PDF from template — staff + admin
router.post('/:id/generate', permit('admin', 'client_manager', 'filing_staff', 'filling_staff', 'account_manager', 'staff'), generateDocumentFromTemplate);

// Service mapping
router.get('/for-service/:service_name', permit('admin', 'client_manager', 'filing_staff', 'filling_staff', 'account_manager', 'staff'), getTemplatesForService);
router.post('/map-to-service', permit('admin'), mapTemplatesToService);

module.exports = router;
