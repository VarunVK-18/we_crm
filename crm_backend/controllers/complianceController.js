const ComplianceReminder = require('../models/ComplianceReminder');
const ComplianceTask = require('../models/ComplianceTask');
const User = require('../models/User');
const Checklist = require('../models/Checklist');
const complianceService = require('../services/complianceService');
// Helper function to extract dynamic reminders from completed checklists
const getDynamicReminders = (checklists) => {
  const dynamicReminders = [];

  for (const checklist of checklists) {
    if (checklist.final_documents && checklist.final_documents.length > 0) {
      for (const doc of checklist.final_documents) {
        if (doc.expiry_date) {
          const daysLeft = Math.ceil((new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
          let status = 'expiringSoon';
          if (daysLeft <= 0) status = 'expired';
          else if (daysLeft <= 7) status = 'urgent';

          dynamicReminders.push({
            _id: doc._id || doc.document_id,
            title: checklist.service_name + (doc.name ? ` (${doc.name})` : ''),
            dueDate: doc.expiry_date,
            daysLeft,
            status,
            entityName: checklist.client_id ? (checklist.client_id.company_name || checklist.client_id.owner_name) : 'Individual',
            client_id: {
              owner_name: checklist.client_id ? checklist.client_id.owner_name : 'Client',
              company_name: checklist.client_id ? checklist.client_id.company_name : 'Individual'
            }
          });
        }
      }
    }
  }

  return dynamicReminders;
};

// Get all compliance reminders for a user
exports.getUserComplianceReminders = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    // 1. Fetch static/manual compliance reminders
    const manualReminders = await ComplianceReminder.find({ clientUid: userId }).lean();

    // Fetch user details for the manual reminders to map client_id structure
    const client = await User.findById(userId).select('owner_name company_name').lean();
    const manualRemindersMapped = manualReminders.map(rem => {
      const dueDate = new Date(new Date(rem.createdAt).getTime() + rem.daysLeft * 24 * 60 * 60 * 1000);
      const currentDaysLeft = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      let status = 'expiringSoon';
      if (currentDaysLeft <= 0) status = 'expired';
      else if (currentDaysLeft <= 7) status = 'urgent';

      return {
        _id: rem._id,
        title: rem.serviceName,
        dueDate: dueDate,
        daysLeft: currentDaysLeft,
        status: status,
        entityName: rem.entityName,
        client_id: {
          owner_name: client ? client.owner_name : 'Client',
          company_name: client ? client.company_name : 'Individual'
        }
      };
    });

    // 2. Fetch dynamic compliance reminders from checklists with final documents
    const completedChecklists = await Checklist.find({ client_id: userId, 'final_documents.0': { $exists: true } })
      .populate('company_id', 'company_name')
      .populate('client_id', 'custom_client_id owner_name company_name');

    const dynamicReminders = getDynamicReminders(completedChecklists);

    // 3. Merge and sort
    const reminders = [...manualRemindersMapped, ...dynamicReminders].sort((a, b) => a.daysLeft - b.daysLeft);

    res.status(200).json({ reminders });
  } catch (error) {
    console.error('Error fetching compliance reminders:', error);
    res.status(500).json({ message: 'Server error while fetching compliance reminders.', error: error.message });
  }
};

// Create a compliance reminder
exports.createComplianceReminder = async (req, res) => {
  try {
    const { clientUid, serviceName, entityName, daysLeft, status } = req.body;

    if (!clientUid || !serviceName || !entityName) {
      return res.status(400).json({ message: 'clientUid, serviceName and entityName are required.' });
    }

    const reminder = new ComplianceReminder({
      clientUid,
      serviceName,
      entityName,
      daysLeft,
      status
    });

    await reminder.save();
    res.status(201).json({ message: 'Compliance reminder created successfully!', reminder });
  } catch (error) {
    console.error('Error creating compliance reminder:', error);
    res.status(500).json({ message: 'Server error while creating compliance reminder.', error: error.message });
  }
};

// Update compliance reminder
exports.updateComplianceReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const reminder = await ComplianceReminder.findByIdAndUpdate(id, updateData, { new: true });
    if (!reminder) {
      return res.status(404).json({ message: 'Compliance reminder not found.' });
    }

    res.status(200).json({ message: 'Compliance reminder updated successfully!', reminder });
  } catch (error) {
    console.error('Error updating compliance reminder:', error);
    res.status(500).json({ message: 'Server error while updating compliance reminder.', error: error.message });
  }
};

// Get all compliance reminders belonging to clients of a given company
exports.getCompanyComplianceReminders = async (req, res) => {
  try {
    const { companyId } = req.params;
    if (!companyId) {
      return res.status(400).json({ message: 'Company ID is required.' });
    }

    // 1. Get client IDs for this company
    let clientFilter = { company_id: companyId, role: 'customer' };
    if (req.user && req.user.role === 'client_manager') {
      clientFilter.$or = [
        { assigned_to: req.user._id },
        { created_by: req.user._id, assigned_to: null }
      ];
    } else if (req.user && (req.user.role === 'account_manager' || req.user.role === 'filling_staff')) {
      clientFilter.assigned_to = req.user._id;
    }
    const clients = await User.find(clientFilter).select('_id owner_name company_name').lean();
    const clientIds = clients.map(client => client._id.toString());

    const clientMap = {};
    clients.forEach(c => {
      clientMap[c._id.toString()] = c;
    });

    // 2. Fetch manual reminders for these clients
    const manualReminders = await ComplianceReminder.find({ clientUid: { $in: clientIds } }).lean();
    const manualRemindersMapped = manualReminders.map(rem => {
      const client = clientMap[rem.clientUid] || { owner_name: 'Client', company_name: 'Individual' };
      const dueDate = new Date(new Date(rem.createdAt).getTime() + rem.daysLeft * 24 * 60 * 60 * 1000);
      const currentDaysLeft = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      let status = 'expiringSoon';
      if (currentDaysLeft <= 0) status = 'expired';
      else if (currentDaysLeft <= 7) status = 'urgent';

      return {
        _id: rem._id,
        title: rem.serviceName,
        dueDate: dueDate,
        daysLeft: currentDaysLeft,
        status: status,
        entityName: rem.entityName,
        client_id: {
          owner_name: client.owner_name,
          company_name: client.company_name
        }
      };
    });

    // 3. Fetch dynamic compliance reminders from checklists with final documents for this company
    let checklistFilter = { 
      company_id: companyId, 
      'final_documents.0': { $exists: true } 
    };

    if (req.user && ['client_manager', 'account_manager', 'filling_staff'].includes(req.user.role)) {
      const Checklist = require('../models/Checklist');
      const authorizedChecklists = await Checklist.find({
          $or: [
              { assigned_to: req.user._id },
              { client_id: { $in: clientIds } }
          ]
      }).select('_id');
      checklistFilter._id = { $in: authorizedChecklists.map(c => c._id) };
    } else {
      checklistFilter.client_id = { $in: clientIds };
    }

    const completedChecklists = await Checklist.find(checklistFilter)
      .populate('company_id', 'company_name')
      .populate('client_id', 'custom_client_id owner_name company_name');

    const dynamicReminders = getDynamicReminders(completedChecklists);

    // 4. Merge and sort
    const reminders = [...manualRemindersMapped, ...dynamicReminders].sort((a, b) => a.daysLeft - b.daysLeft);

    res.status(200).json({ reminders });
  } catch (error) {
    console.error('Error fetching company compliance reminders:', error);
    res.status(500).json({ message: 'Server error while fetching company compliance reminders.', error: error.message });
  }
};

// Get all compliance tasks globally (For Filing Staff / Admins)
exports.getAllComplianceTasks = async (req, res) => {
  try {
    let taskFilter = {};
    let checklistFilter = { 'final_documents.0': { $exists: true } };

    if (req.user) {
      if (req.user.company_id) {
        taskFilter.companyId = req.user.company_id;
        checklistFilter.company_id = req.user.company_id;
      }

      const role = req.user.role;
      if (role === 'client_manager' || role === 'account_manager' || role === 'filling_staff') {
        let clientFilter = { role: 'customer', in_compliance_radar: { $ne: false } };
        if (role === 'client_manager') {
          clientFilter.$or = [
            { assigned_to: req.user._id },
            { created_by: req.user._id, assigned_to: null }
          ];
        } else {
          clientFilter.assigned_to = req.user._id;
        }

        // Run auth lookups in parallel
        const [authorizedClients, globalRadarClients] = await Promise.all([
          User.find(clientFilter).select('_id').lean(),
          User.find({ role: 'customer', in_compliance_radar: { $ne: false } }).select('_id').lean()
        ]);

        const authorizedClientIds = authorizedClients.map(c => c._id);
        const globalRadarClientIds = globalRadarClients.map(c => c._id);

        const authorizedChecklists = await Checklist.find({
          client_id: { $in: globalRadarClientIds },
          $or: [
            { assigned_to: req.user._id },
            { client_id: { $in: authorizedClientIds } }
          ]
        }).select('_id').lean();
        const authorizedChecklistIds = authorizedChecklists.map(c => c._id);

        taskFilter.$or = [
          { checklistId: { $in: authorizedChecklistIds } },
          { clientUid: { $in: authorizedClientIds }, checklistId: { $exists: false } },
          { clientUid: { $in: authorizedClientIds }, checklistId: null }
        ];
        checklistFilter._id = { $in: authorizedChecklistIds };
      } else {
        // For admin/others, still filter out clients not in compliance radar
        const radarClients = await User.find({ role: 'customer', in_compliance_radar: { $ne: false } }).select('_id').lean();
        const radarClientIds = radarClients.map(c => c._id);

        taskFilter.clientUid = { $in: radarClientIds };
        checklistFilter.client_id = { $in: radarClientIds };
      }
    }

    // Fetch tasks and completed checklists in parallel
    // NOTE: We do NOT populate proofDocument/certificateDocument/acknowledgementDocument here
    // because the radar list doesn't show them — they are fetched on the Details page only.
    const [tasks, completedChecklists] = await Promise.all([
      ComplianceTask.find(taskFilter)
        .populate('clientUid', 'owner_name company_name custom_client_id')
        .populate('companyId', 'company_name')
        .populate('checklistId', 'service_name details custom_service_id')
        .select('-proofDocument -certificateDocument -acknowledgementDocument -description -warning_status')
        .sort({ dueDate: 1 })
        .lean(),
      Checklist.find(checklistFilter)
        .populate('client_id', 'custom_client_id owner_name company_name')
        .select('service_name final_documents client_id company_id')
        .lean()
    ]);

    const today = new Date();
    const mappedTasks = tasks.map(task => {
      const daysLeft = Math.ceil((new Date(task.dueDate) - today) / (1000 * 60 * 60 * 24));

      let computedStatus = task.status;
      if (computedStatus !== 'Completed') {
        computedStatus = complianceService.calculateStatus(task.dueDate, null);
      }

      let entityName = task.entityName;
      if (!entityName && task.checklistId && task.checklistId.details) {
        entityName = task.checklistId.details.companyName || task.checklistId.details.proposed_company_name || task.checklistId.details.businessName;
      }
      if (!entityName && task.clientUid) {
        entityName = task.clientUid.company_name || task.clientUid.owner_name;
      }
      if (!entityName) entityName = 'Individual';

      return {
        ...task,
        entityName,
        clientDetails: task.clientUid,
        daysLeft,
        status: computedStatus
      };
    });

    const dynamicRemindersRaw = getDynamicReminders(completedChecklists);
    const mappedDynamic = dynamicRemindersRaw.map(r => {
      let mappedStatus = 'Upcoming';
      if (r.daysLeft <= 0) mappedStatus = 'Overdue';
      else if (r.daysLeft <= 3) mappedStatus = 'Critical';
      else if (r.daysLeft <= 10) mappedStatus = 'Due Soon';

      return {
        _id: r._id,
        title: r.title + ' Renewal',
        entityName: r.entityName,
        dueDate: r.dueDate,
        daysLeft: r.daysLeft,
        status: mappedStatus,
        clientUid: r.client_id,
        clientDetails: r.client_id
      };
    });

    const finalTasks = [...mappedTasks, ...mappedDynamic].sort((a, b) => a.daysLeft - b.daysLeft);

    res.status(200).json({ success: true, tasks: finalTasks });
  } catch (error) {
    console.error('Error fetching all compliance tasks:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get compliance tasks for a user
exports.getUserComplianceTasks = async (req, res) => {
  try {
    const { userId } = req.params;

    const tasks = await ComplianceTask.find({ clientUid: userId })
      .populate('clientUid', 'owner_name company_name email phone custom_client_id')
      .populate('companyId', 'company_name')
      .populate('checklistId', 'service_name details custom_service_id')
      .populate('proofDocument')
      .populate('certificateDocument')
      .populate('acknowledgementDocument')
      .populate('noticeDocument')
      .populate('shareholdersDocument')
      .populate('shareholdersReplyDocument')
      .populate('directorsDocument')
      .populate('directorsReplyDocument')
      .populate('notesDocument')
      .populate('notesReplyDocument')
      .populate('temporaryDocument')
      .populate('temporaryReplyDocument')
      .populate('normalDocument')
      .sort({ dueDate: 1 })
      .lean();

    const today = new Date();
    const mappedTasks = tasks.map(task => {
      const daysLeft = Math.ceil((new Date(task.dueDate) - today) / (1000 * 60 * 60 * 24));
      
      let computedStatus = task.status;
      if (computedStatus !== 'Completed') {
        computedStatus = complianceService.calculateStatus(task.dueDate, null);
      }
      
      let entityName = task.entityName;
      if (!entityName && task.checklistId && task.checklistId.details) {
         entityName = task.checklistId.details.companyName || task.checklistId.details.proposed_company_name || task.checklistId.details.businessName;
      }
      if (!entityName && task.clientUid) {
         entityName = task.clientUid.company_name || task.clientUid.owner_name;
      }
      if (!entityName) {
         entityName = 'Individual';
      }

      return {
        ...task,
        entityName,
        daysLeft,
        status: computedStatus
      };
    });

    // Fetch dynamic reminders (e.g. from Trademark/FSSAI document expiry dates)
    const completedChecklists = await Checklist.find({ client_id: userId, 'final_documents.0': { $exists: true } })
      .populate('company_id', 'company_name')
      .populate('client_id', 'custom_client_id owner_name company_name')
      .lean();

    const dynamicRemindersRaw = getDynamicReminders(completedChecklists);
    
    const mappedDynamic = dynamicRemindersRaw.map(r => {
      let mappedStatus = 'Upcoming';
      if (r.daysLeft < 0) mappedStatus = 'Overdue';
      else if (r.daysLeft <= 3) mappedStatus = 'Critical';
      else if (r.daysLeft <= 10) mappedStatus = 'Due Soon';
      
      return {
        _id: r._id,
        title: r.title + ' Renewal',
        entityName: r.entityName,
        dueDate: r.dueDate,
        daysLeft: r.daysLeft,
        status: mappedStatus
      };
    });

    const finalTasks = [...mappedTasks, ...mappedDynamic].sort((a, b) => a.daysLeft - b.daysLeft);

    res.status(200).json({ success: true, tasks: finalTasks });
  } catch (error) {
    console.error('Error fetching compliance tasks:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single compliance task by ID
exports.getComplianceTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await ComplianceTask.findById(id)
      .populate('clientUid', 'owner_name company_name email phone custom_client_id')
      .populate('companyId', 'company_name')
      .populate('checklistId', 'service_name details')
      .populate('proofDocument')
      .populate('certificateDocument')
      .populate('acknowledgementDocument')
      .populate('noticeDocument')
      .populate('noticeReplyDocument')
      .populate('shareholdersDocument')
      .populate('shareholdersReplyDocument')
      .populate('directorsDocument')
      .populate('directorsReplyDocument')
      .populate('notesDocument')
      .populate('notesReplyDocument')
      .populate('temporaryDocument')
      .populate('temporaryReplyDocument')
      .populate('normalDocument')
      .populate('assigned_staff_id', 'owner_name email')
      .lean();

    if (!task) {
      // It might be a dynamic reminder. To handle dynamic reminders, we need to check completed checklists
      // For now, if not found in ComplianceTask, try returning 404
      return res.status(404).json({ success: false, message: 'Task not found in Compliance Tasks list' });
    }

    const today = new Date();
    const daysLeft = Math.ceil((new Date(task.dueDate) - today) / (1000 * 60 * 60 * 24));
    
    let computedStatus = task.status;
    const complianceService = require('../services/complianceService');
    if (computedStatus !== 'Completed') {
      computedStatus = complianceService.calculateStatus(task.dueDate, null);
    }
    
    let entityName = task.entityName;
    if (!entityName && task.checklistId && task.checklistId.details) {
       entityName = task.checklistId.details.companyName || task.checklistId.details.proposed_company_name || task.checklistId.details.businessName;
    }
    if (!entityName && task.clientUid) {
       entityName = task.clientUid.company_name || task.clientUid.owner_name;
    }
    if (!entityName) {
       entityName = 'Individual';
    }

    const taskDetails = {
      ...task,
      entityName,
      daysLeft,
      status: computedStatus,
      message: daysLeft <= 0 ? 'Overdue - Penalty Applicable' : `Due in ${daysLeft} days`
    };

    res.status(200).json({ success: true, task: taskDetails });
  } catch (error) {
    console.error('Error fetching compliance task by id:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Complete a compliance task with proofs
exports.completeComplianceTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await ComplianceTask.findById(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const Document = require('../models/Document');
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const newDoc = await Document.create({
          filename: file.originalname,
          contentType: file.mimetype,
          data: file.buffer,
          uploadedBy: req.user._id
        });
        
        if (file.fieldname === 'proofDocument') task.proofDocument = newDoc._id;
        if (file.fieldname === 'certificateDocument') task.certificateDocument = newDoc._id;
        if (file.fieldname === 'acknowledgementDocument') task.acknowledgementDocument = newDoc._id;
      }
    }

    task.status = 'Completed';
    task.completedAt = new Date();
    await task.save();

    res.status(200).json({ success: true, task });
  } catch (error) {
    console.error('Error completing compliance task:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// Upload a single document for a compliance task
exports.uploadComplianceDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentType } = req.body;
    
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    
    const validTypes = [
      'certificate', 'acknowledgement', 'notice', 'shareholders', 'directors', 'notes', 'temporary', 'normal',
      'noticeReply', 'shareholdersReply', 'directorsReply', 'notesReply', 'temporaryReply'
    ];
    if (!validTypes.includes(documentType)) {
      return res.status(400).json({ success: false, message: 'Invalid documentType' });
    }

    const task = await ComplianceTask.findById(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const Document = require('../models/Document');
    const newDoc = await Document.create({
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      data: req.file.buffer,
      uploadedBy: req.user._id
    });

    task[`${documentType}Document`] = newDoc._id;
    await task.save();

    res.status(200).json({ success: true, message: 'Document uploaded successfully', docId: newDoc._id });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate a document from a template for a compliance task
exports.generateDocumentFromTemplateForTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { templateId, documentType } = req.body;

    const validTypes = ['notice', 'shareholders', 'directors', 'notes'];
    if (!validTypes.includes(documentType)) {
      return res.status(400).json({ success: false, message: 'Invalid documentType' });
    }

    const task = await ComplianceTask.findById(id).populate('checklistId');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const DocumentTemplate = require('../models/DocumentTemplate');
    const tmpl = await DocumentTemplate.findOne({ _id: templateId, company_id: req.user.company_id });
    if (!tmpl) return res.status(404).json({ success: false, message: 'Template not found' });

    // Use checklist for placeholders if available
    let placeholders = {};
    if (task.checklistId) {
      const { buildPlaceholderMap } = require('./documentTemplateController');
      // buildPlaceholderMap might not be directly exported, let's just do a basic one or require it
      // Actually, building placeholders is complex. Let's do a basic one for now.
      const checklist = await require('../models/Checklist').findById(task.checklistId._id).lean();
      if (checklist) {
         try {
           const docCtrl = require('./documentTemplateController');
           if(typeof docCtrl.buildPlaceholderMap === 'function') {
             placeholders = await docCtrl.buildPlaceholderMap(checklist);
           }
         } catch(e) {}
      }
    }

    // Merge manual placeholders from req.body
    if (req.body.placeholders) {
      for (const [k, v] of Object.entries(req.body.placeholders)) {
        placeholders[`{{${k}}}`] = v;
      }
    }

    // Apply placeholders
    let filledHtml = tmpl.html_content;
    for (const [key, value] of Object.entries(placeholders)) {
      filledHtml = filledHtml.split(key).join(value || '');
    }

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
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    pdfBuffer = await page.pdf({ format: 'A4', margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }, printBackground: true });
    await browser.close();

    const Document = require('../models/Document');
    const safeDocName = `${tmpl.name} - Generated.pdf`;
    const newDoc = await Document.create({
      filename: safeDocName,
      contentType: 'application/pdf',
      data: Buffer.from(pdfBuffer),
      uploadedBy: req.user._id
    });

    task[`${documentType}Document`] = newDoc._id;
    await task.save();

    res.status(200).json({ success: true, message: 'Document generated successfully', docId: newDoc._id });
  } catch (error) {
    console.error('Error generating document:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
