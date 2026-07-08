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

  // Parse directors array from checklist.details
  let directorsList = [];
  if (checklist?.details && typeof checklist.details === 'object') {
    const rawDirs = checklist.details.directors || checklist.details.partners || checklist.details.members;
    if (rawDirs) {
      try {
        if (typeof rawDirs === 'string') {
          directorsList = JSON.parse(rawDirs);
        } else if (Array.isArray(rawDirs)) {
          directorsList = rawDirs;
        }
      } catch (e) {
        console.error("Failed to parse directors on backend:", e);
      }
    }
  }

  let directorNames = client?.directors?.map(d => d.fullName).filter(Boolean).join(', ') || '';
  if (!directorNames && directorsList && directorsList.length > 0) {
    directorNames = directorsList.map(d => d.fullName || d.name || '').filter(Boolean).join(', ');
  }

  let dinNumbers = client?.directors?.map(d => d.din).filter(Boolean).join(', ') || '';
  if (!dinNumbers && directorsList && directorsList.length > 0) {
    dinNumbers = directorsList.map(d => d.din || '').filter(Boolean).join(', ');
  }

  // Fallback to checklist.details keys if empty
  if (!directorNames && checklist?.details) {
    const details = checklist.details;
    const keys = Object.keys(details);
    const nameKeys = keys.filter(k => {
      const kl = k.toLowerCase();
      return (kl.includes('director') || kl.includes('partner') || kl.includes('proprietor')) && kl.includes('name');
    });
    if (nameKeys.length > 0) {
      directorNames = nameKeys.map(k => details[k]).filter(Boolean).join(', ');
    } else {
      const genKeys = keys.filter(k => {
        const kl = k.toLowerCase();
        return kl.includes('director') || kl.includes('partner') || kl.includes('proprietor');
      });
      if (genKeys.length > 0) {
        directorNames = genKeys.map(k => details[k]).filter(Boolean).join(', ');
      }
    }
  }

  if (!dinNumbers && checklist?.details) {
    const details = checklist.details;
    const keys = Object.keys(details);
    const dinKeys = keys.filter(k => {
      const kl = k.toLowerCase();
      return kl.includes('din') || kl.includes('director identification number');
    });
    if (dinKeys.length > 0) {
      dinNumbers = dinKeys.map(k => details[k]).filter(Boolean).join(', ');
    }
  }

  const placeholderMap = {
    '{{client_name}}': checklist?.details?.ownerName || checklist?.details?.owner_name || client?.owner_name || client?.name || '',
    '{{company_name}}': checklist?.details?.companyName || checklist?.details?.company_name || client?.company_name || '',
    '{{email}}': checklist?.details?.companyEmail || client?.email || '',
    '{{phone}}': checklist?.details?.companyPhone || client?.phone || '',
    '{{address}}': checklist?.details?.address || checklist?.details?.['Company Address'] || client?.address || '',
    '{{pan}}': checklist?.details?.pan || checklist?.details?.['PAN'] || client?.pan || '',
    '{{gstin}}': checklist?.details?.gstin || checklist?.details?.['GSTIN'] || client?.gstin || '',
    '{{cin}}': checklist?.details?.cin || checklist?.details?.['CIN'] || client?.cin || '',
    '{{tan}}': checklist?.details?.tan || checklist?.details?.['TAN'] || client?.tan || '',
    '{{director_count}}': String(checklist?.details?.director_count || (directorsList && directorsList.length > 0 ? directorsList.length : '') || client?.director_count || ''),
    '{{director_name}}': directorNames,
    '{{din_number}}': dinNumbers,
    '{{business_type}}': checklist?.details?.business_type || checklist?.details?.['Business Type'] || client?.business_type || '',
    '{{service_name}}': checklist?.service_name || '',
    '{{service_id}}': checklist?.custom_service_id || '',
    '{{today_date}}': dateStr,
    '{{company_letterhead}}': company?.company_name || 'WE CRM',
  };

  // Dynamically map all checklist.details keys to placeholders
  if (checklist?.details && typeof checklist.details === 'object') {
    for (const [key, value] of Object.entries(checklist.details)) {
      if (value) {
        // e.g. "Director 1 Name" -> "{{director_1_name}}"
        const snakeKey = key.toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_+|_+$/g, '');
        placeholderMap[`{{${snakeKey}}}`] = String(value);

        // e.g. "Director 1 Name" -> "{{director 1 name}}"
        const spaceKey = key.toLowerCase().trim();
        placeholderMap[`{{${spaceKey}}}`] = String(value);
      }
    }
  }

  // Inject parsed directors list into placeholderMap
  if (directorsList && directorsList.length > 0) {
    directorsList.forEach((d, i) => {
      const idx = i + 1;
      const name = d.fullName || d.name || '';
      const din = d.din || d.dinNumber || '';
      const pan = d.pan || d.panNumber || '';
      
      placeholderMap[`{{director_${idx}_name}}`] = name;
      placeholderMap[`{{director ${idx} name}}`] = name;
      placeholderMap[`{{director_${idx}_din}}`] = din;
      placeholderMap[`{{director ${idx} din}}`] = din;
      placeholderMap[`{{director_${idx}_pan}}`] = pan;
      placeholderMap[`{{director ${idx} pan}}`] = pan;
    });
  }

  return placeholderMap;
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
    const { name, description, html_content, requires_customer_verification } = req.body;
    if (!name || !html_content) {
      return res.status(400).json({ success: false, message: 'name and html_content are required' });
    }
    const tmpl = await DocumentTemplate.create({
      company_id: req.user.company_id,
      name,
      description: description || '',
      html_content,
      created_by: req.user._id,
      requires_customer_verification: !!requires_customer_verification
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

const previewPopulatedTemplate = async (req, res) => {
  try {
    const { checklist_id } = req.body;
    if (!checklist_id) {
      return res.status(400).json({ success: false, message: 'checklist_id is required' });
    }

    const tmpl = await DocumentTemplate.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!tmpl) return res.status(404).json({ success: false, message: 'Template not found' });

    const checklist = await Checklist.findById(checklist_id).lean();
    if (!checklist) return res.status(404).json({ success: false, message: 'Checklist not found' });

    const placeholders = await buildPlaceholderMap(checklist);
    const populatedHtml = applyPlaceholders(tmpl.html_content, placeholders);

    res.json({ success: true, html: populatedHtml });
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
  previewPopulatedTemplate,
};
