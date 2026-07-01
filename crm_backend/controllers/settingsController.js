const Company = require('../models/Company');
const { logActivity } = require('../middleware/rbac');

// @desc    Get company settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'User is not linked to any company' });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    res.status(200).json({ 
      success: true, 
      settings: company.settings || {
        incorporation_fee: 5000,
        default_filing_tax: 18,
        gst_percentage: 18,
        cgst_percentage: 9,
        allow_agent_registration: true,
        require_document_verification: true,
        enable_document_extraction: false
      },
      company: {
        company_name: company.company_name,
        gstin: company.gstin,
        phone: company.phone,
        address: company.address
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update company settings
// @route   POST /api/settings
// @access  Private (Admin)
const updateSettings = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'User is not linked to any company' });
    }

    const { incorporation_fee, default_filing_tax, gst_percentage, cgst_percentage, allow_agent_registration, require_document_verification, enable_document_extraction, bank_details, company_name, gstin, phone, address } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    if (!company.settings) {
      company.settings = {};
    }

    if (incorporation_fee !== undefined) company.settings.incorporation_fee = Number(incorporation_fee);
    if (default_filing_tax !== undefined) company.settings.default_filing_tax = Number(default_filing_tax);
    if (gst_percentage !== undefined) company.settings.gst_percentage = Number(gst_percentage);
    if (cgst_percentage !== undefined) company.settings.cgst_percentage = Number(cgst_percentage);
    if (allow_agent_registration !== undefined) company.settings.allow_agent_registration = Boolean(allow_agent_registration);
    if (require_document_verification !== undefined) company.settings.require_document_verification = Boolean(require_document_verification);
    if (enable_document_extraction !== undefined) company.settings.enable_document_extraction = Boolean(enable_document_extraction);
    if (bank_details !== undefined) company.settings.bank_details = bank_details;

        if (company_name !== undefined) company.company_name = company_name;
    if (gstin !== undefined) company.gstin = gstin;
    if (phone !== undefined) company.phone = phone;
    if (address !== undefined) company.address = address;

    await company.save();

    await logActivity(
      req.user._id,
      'settings_update',
      `Updated company system settings`,
      companyId
    );

    res.status(200).json({ success: true, message: 'Settings updated successfully', settings: company.settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBankSettings = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'User is not linked to any company' });
    }
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.status(200).json({ success: true, settings: company.settings?.bank_details || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getBankSettings
};
