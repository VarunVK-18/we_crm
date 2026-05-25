const ChecklistTemplate = require('../models/ChecklistTemplate');
const { logActivity } = require('../middleware/rbac');

// @desc    Get all checklist templates for the company
// @route   GET /api/templates/checklists
// @access  Private (Admin)
const getTemplates = async (req, res) => {
  try {
    const templates = await ChecklistTemplate.find({ company_id: req.user.company_id });
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
    const { service_name, items } = req.body;

    if (!service_name) {
      return res.status(400).json({ success: false, message: 'Service name is required' });
    }

    let template = await ChecklistTemplate.findOne({ 
      company_id: req.user.company_id, 
      service_name 
    });

    if (template) {
      template.items = items || [];
      await template.save();
    } else {
      template = await ChecklistTemplate.create({
        company_id: req.user.company_id,
        service_name,
        items: items || []
      });
    }

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

module.exports = {
  getTemplates,
  upsertTemplate
};
