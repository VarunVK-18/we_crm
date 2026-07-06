const DocumentTemplate = require('../models/DocumentTemplate');
const ChecklistTemplate = require('../models/ChecklistTemplate');
const Document = require('../models/Document');
const Checklist = require('../models/Checklist');
const User = require('../models/User');
const Company = require('../models/Company');
const { logActivity } = require('../middleware/rbac');

// ─── Placeholder Resolution ────────────────────────────────────────────────

/**
 * Build a placeholder map from checklist + client + company data.
 */
async function buildPlaceholderMap(checklist) {
  const client = await User.findById(checklist.client_id).lean();
  const company = await Company.findById(checklist.company_id).lean();
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  return {
    '{{client_name}}': client?.owner_name || '',
    '{{company_name}}': client?.company_name || '',
    '{{email}}': client?.email || '',
    '{{phone}}': client?.phone || '',
    '{{address}}': client?.address || '',
    '{{pan}}': client?.pan || '',
    '{{gstin}}': client?.gstin || '',
    '{{cin}}': client?.cin || '',
    '{{tan}}': client?.tan || '',
    '{{director_count}}': String(client?.director_count || ''),
    '{{business_type}}': client?.business_type || '',
    '{{service_name}}': checklist?.service_name || '',
    '{{service_id}}': checklist?.custom_service_id || '',
    '{{today_date}}': dateStr,
    '{{company_letterhead}}': company?.company_name || 'WE CRM',
  };
}

/**
 * Replace all {{placeholder}} tokens in HTML content.
 */
function applyPlaceholders(html, map) {
  let result = html;
  for (const [key, value] of Object.entries(map)) {
    result = result.split(key).join(value);
  }
  return result;
}

// ─── CRUD Controllers ──────────────────────────────────────────────────────

// GET /api/document-templates
const listDocumentTemplates = async (req, res) => {
  try {
    const templates = await DocumentTemplate.find({ company_id: req.user.company_id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/document-templates
const createDocumentTemplate = async (req, res) => {
  try {
    const { name, description, html_content } = req.body;
    if (!name || !html_content) {
      return res.status(400).json({ success: false, message: 'name and html_content are required' });
    }
    const tmpl = await DocumentTemplate.create({
      company_id: req.user.company_id,
      name,
      description: description || '',
      html_content,
      created_by: req.user._id
    });
    await logActivity(req.user._id, 'document_template_created', `Created document template '${name}'`, req.user.company_id);
    res.status(201).json({ success: true, template: tmpl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/document-templates/:id
const updateDocumentTemplate = async (req, res) => {
  try {
    const tmpl = await DocumentTemplate.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: req.body },
      { new: true }
    );
    if (!tmpl) return res.status(404).json({ success: false, message: 'Template not found' });
    await logActivity(req.user._id, 'document_template_updated', `Updated document template '${tmpl.name}'`, req.user.company_id);
    res.json({ success: true, template: tmpl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/document-templates/:id
const deleteDocumentTemplate = async (req, res) => {
  try {
    const tmpl = await DocumentTemplate.findOneAndDelete({ _id: req.params.id, company_id: req.user.company_id });
    if (!tmpl) return res.status(404).json({ success: false, message: 'Template not found' });
    // Remove references from any ChecklistTemplate mappings
    await ChecklistTemplate.updateMany(
      { company_id: req.user.company_id },
      { $pull: { document_templates: tmpl._id } }
    );
    await logActivity(req.user._id, 'document_template_deleted', `Deleted document template '${tmpl.name}'`, req.user.company_id);
    res.json({ success: true, message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/document-templates/:id/generate
// Body: { checklist_id }
const generateDocumentFromTemplate = async (req, res) => {
  try {
    const { checklist_id, custom_values } = req.body;
    if (!checklist_id) {
      return res.status(400).json({ success: false, message: 'checklist_id is required' });
    }

    const tmpl = await DocumentTemplate.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!tmpl) return res.status(404).json({ success: false, message: 'Template not found' });

    const checklist = await Checklist.findById(checklist_id).lean();
    if (!checklist) return res.status(404).json({ success: false, message: 'Checklist not found' });

    const placeholders = await buildPlaceholderMap(checklist);
    
    // Merge any custom inputs filled in by the staff
    if (custom_values && typeof custom_values === 'object') {
      Object.assign(placeholders, custom_values);
    }

    const baseHtml = req.body.override_html || tmpl.html_content;
    const filledHtml = applyPlaceholders(baseHtml, placeholders);

    // Wrap in a styled page for PDF rendering
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000; padding: 10px 20px; line-height: 1.6; }
    h1, h2, h3 { margin-bottom: 12px; }
    p { margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    td, th { border: 1px solid #333; padding: 6px 10px; }
    .page-break { page-break-after: always; }
  </style>
</head>
<body>${filledHtml}</body>
</html>`;

    let pdfBuffer;
    try {
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
      pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
        printBackground: true
      });
      await browser.close();
    } catch (puppeteerErr) {
      console.error('Puppeteer error:', puppeteerErr);
      return res.status(500).json({ success: false, message: 'PDF generation failed: ' + puppeteerErr.message });
    }

    // Save the PDF as a Document record
    const safeDocName = `${tmpl.name} - ${placeholders['{{company_name}}'] || placeholders['{{client_name}}'] || 'Document'}.pdf`;
    const savedDoc = await Document.create({
      filename: safeDocName,
      contentType: 'application/pdf',
      data: Buffer.from(pdfBuffer),
      uploadedBy: req.user._id
    });

    await logActivity(
      req.user._id,
      'document_generated',
      `Generated '${tmpl.name}' for checklist ${checklist_id}`,
      req.user.company_id
    );

    res.status(201).json({
      success: true,
      document: {
        _id: savedDoc._id,
        filename: savedDoc.filename
      }
    });
  } catch (err) {
    console.error('generateDocumentFromTemplate error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/document-templates/for-service/:service_name
// Returns the doc templates linked to a given service (or all if not found)
const getTemplatesForService = async (req, res) => {
  try {
    const { service_name } = req.params;
    const checklistTemplate = await ChecklistTemplate.findOne({
      company_id: req.user.company_id,
      service_name: decodeURIComponent(service_name)
    }).populate('document_templates').lean();

    if (checklistTemplate && checklistTemplate.document_templates?.length) {
      return res.json({ success: true, templates: checklistTemplate.document_templates });
    }

    // Fallback: return all templates
    const all = await DocumentTemplate.find({ company_id: req.user.company_id }).sort({ name: 1 }).lean();
    res.json({ success: true, templates: all });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/document-templates/map-to-service
// Body: { service_name, template_ids: [...] }
const mapTemplatesToService = async (req, res) => {
  try {
    const { service_name, template_ids } = req.body;
    if (!service_name) {
      return res.status(400).json({ success: false, message: 'service_name is required' });
    }

    let checklistTmpl = await ChecklistTemplate.findOne({ company_id: req.user.company_id, service_name });
    if (!checklistTmpl) {
      checklistTmpl = await ChecklistTemplate.create({
        company_id: req.user.company_id,
        service_name,
        items: [],
        document_templates: template_ids || []
      });
    } else {
      checklistTmpl.document_templates = template_ids || [];
      await checklistTmpl.save();
    }

    res.json({ success: true, message: 'Templates mapped successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  listDocumentTemplates,
  createDocumentTemplate,
  updateDocumentTemplate,
  deleteDocumentTemplate,
  generateDocumentFromTemplate,
  getTemplatesForService,
  mapTemplatesToService,
};
