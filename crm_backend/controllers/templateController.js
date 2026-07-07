const ChecklistTemplate = require('../models/ChecklistTemplate');
const Document = require('../models/Document');
const { logActivity } = require('../middleware/rbac');

// @desc    Get all checklist templates for the company
// @route   GET /api/templates/checklists
// @access  Private (Admin)
const getTemplates = async (req, res) => {
  try {
    const templates = await ChecklistTemplate.find({ company_id: req.user.company_id })
      .populate('sop_document', 'filename _id')
      .populate('document_templates', 'name description _id')
      .populate('items.linked_document_templates', 'name description _id');
    res.status(200).json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upsert a checklist template for a service
// @route   POST /api/templates/checklists
// @access  Private (Admin)
const upsertTemplate = async (req, res) => {
  try {
    const { service_name, items, enable_document_extraction, document_templates, need_temporary } = req.body;

    if (!service_name) {
      return res.status(400).json({ success: false, message: 'Service name is required' });
    }

    let template = await ChecklistTemplate.findOne({ 
      company_id: req.user.company_id, 
      service_name 
    });

    if (template) {
      template.items = items || [];
      if (enable_document_extraction !== undefined) {
        template.enable_document_extraction = enable_document_extraction;
      }
      if (document_templates !== undefined) {
        template.document_templates = document_templates;
      }
      if (need_temporary !== undefined) {
        template.need_temporary = need_temporary;
      }
      await template.save();
    } else {
      template = await ChecklistTemplate.create({
        company_id: req.user.company_id,
        service_name,
        items: items || [],
        enable_document_extraction: enable_document_extraction || false,
        document_templates: document_templates || [],
        need_temporary: need_temporary || false
      });
    }

    // Sync need_temporary to existing checklists and service orders
    const Checklist = require('../models/Checklist');
    const ServiceOrder = require('../models/ServiceOrder');
    
    await Checklist.updateMany(
      { company_id: req.user.company_id, service_name },
      { $set: { need_temporary: template.need_temporary } }
    );
    await ServiceOrder.updateMany(
      { companyId: req.user.company_id, serviceType: service_name },
      { $set: { need_temporary: template.need_temporary } }
    );

    await logActivity(
      req.user._id,
      'template_updated',
      `Updated checklist template for service '${service_name}'`,
      req.user.company_id
    );

    res.status(200).json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload SOP for a checklist template
// @route   POST /api/templates/checklists/:service_name/sop
// @access  Private (Admin)
const uploadSOP = async (req, res) => {
  try {
    const { service_name } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    let template = await ChecklistTemplate.findOne({ 
      company_id: req.user.company_id, 
      service_name 
    });

    if (!template) {
      // Create template if it doesn't exist yet
      template = await ChecklistTemplate.create({
        company_id: req.user.company_id,
        service_name,
        items: [],
        enable_document_extraction: false
      });
    }

    // Save SOP as a Document
    const newDoc = await Document.create({
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      data: req.file.buffer,
      uploadedBy: req.user._id
    });

    template.sop_document = newDoc._id;
    await template.save();

    await logActivity(
      req.user._id,
      'sop_uploaded',
      `Uploaded SOP for service '${service_name}'`,
      req.user.company_id
    );

    res.status(200).json({ success: true, message: 'SOP uploaded successfully', sop_document: { _id: newDoc._id, filename: newDoc.filename } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTemplates,
  upsertTemplate,
  uploadSOP
};
