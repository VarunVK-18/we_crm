const FilingTask = require('../models/FilingTask');
const User = require('../models/User');
const { logActivity } = require('../middleware/rbac');
const Document = require('../models/Document');
const Company = require('../models/Company');
const ChecklistTemplate = require('../models/ChecklistTemplate');
const pdfParse = require('pdf-parse');

function parseWrittenDate(dateStr) {
  try {
    const monthMatch = dateStr.match(/(January|February|March|April|May|June|July|August|September|October|November|December)/i);
    if (!monthMatch) return null;
    const month = monthMatch[1];
    
    let year = new Date().getFullYear();
    const yrStr = dateStr.toLowerCase().replace(/\s+/g, ' ');
    if (yrStr.includes('two thousand eighteen')) year = 2018;
    else if (yrStr.includes('two thousand nineteen')) year = 2019;
    else if (yrStr.includes('two thousand twenty one')) year = 2021;
    else if (yrStr.includes('two thousand twenty two')) year = 2022;
    else if (yrStr.includes('two thousand twenty three')) year = 2023;
    else if (yrStr.includes('two thousand twenty four')) year = 2024;
    else if (yrStr.includes('two thousand twenty five')) year = 2025;
    else if (yrStr.includes('two thousand twenty')) year = 2020;
    else {
      const yrMatch = dateStr.match(/\b(20\d{2})\b/);
      if (yrMatch) year = parseInt(yrMatch[1]);
    }

    let day = 1;
    const digitDayMatch = yrStr.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/);
    if (digitDayMatch) {
      day = parseInt(digitDayMatch[1]);
    } else {
      const days = {
        thirtieth: 30, 'thirty first': 31, 'thirty-first': 31,
        'twenty ninth': 29, 'twenty-ninth': 29, 'twenty eighth': 28, 'twenty-eighth': 28,
        'twenty seventh': 27, 'twenty-seventh': 27, 'twenty sixth': 26, 'twenty-sixth': 26,
        'twenty fifth': 25, 'twenty-fifth': 25, 'twenty fourth': 24, 'twenty-fourth': 24,
        'twenty third': 23, 'twenty-third': 23, 'twenty second': 22, 'twenty-second': 22,
        'twenty first': 21, 'twenty-first': 21, twentieth: 20, nineteenth: 19,
        eighteenth: 18, seventeenth: 17, sixteenth: 16, fifteenth: 15, fourteenth: 14,
        thirteenth: 13, twelfth: 12, eleventh: 11, tenth: 10, ninth: 9, eighth: 8,
        seventh: 7, sixth: 6, fifth: 5, fourth: 4, third: 3, second: 2, first: 1
      };
      for (const [key, val] of Object.entries(days)) {
        if (yrStr.includes(key)) {
          day = val;
          break;
        }
      }
    }
    return new Date(Date.UTC(year, new Date(`${month} 1, 2000`).getMonth(), day));
  } catch (e) {
    return null;
  }
}

// @desc    Create a new filing task
// @route   POST /api/tasks
// @access  Private (Admin, Account Manager)
const createTask = async (req, res) => {
  try {
    const { client_id, assigned_to, title, description } = req.body;
    if (!client_id || !title || !assigned_to) {
      return res.status(400).json({ success: false, message: 'Client ID, title, and assigned staff are required' });
    }

    const client = await User.findById(client_id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    let staffName = 'None';
    if (assigned_to) {
      const staff = await User.findById(assigned_to);
      if (!staff) {
        return res.status(404).json({ success: false, message: 'Assigned employee not found' });
      }
      staffName = staff.owner_name;
    }

    const task = await FilingTask.create({
      company_id: req.user.company_id,
      client_id,
      assigned_to: assigned_to || null,
      created_by: req.user._id,
      title,
      description: description || ''
    });

    if (assigned_to) {
      const Notification = require('../models/Notification');
      await Notification.create({
        client_id: assigned_to,
        title: 'New Task Assigned',
        message: `You have been assigned the task '${title}' for client '${client.owner_name}'`,
        type: 'status_update'
      });
    }

    await logActivity(
      req.user._id,
      'task_creation',
      `Created legal filing task '${title}' for client '${client.owner_name}', assigned to '${staffName}'`,
      req.user.company_id
    );

    res.status(201).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get tasks scoped by role
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const userCompanyId = req.user.company_id;
    const filter = {};
    if (userCompanyId) {
      filter.company_id = userCompanyId;
    }

    // Role scoping
    const role = req.user.role;
    if (role === 'filling_staff') {
      // Filling Staff: View only tasks assigned to them
      filter.assigned_to = req.user._id;
    } else if (role === 'account_manager') {
      // Account Manager: View tasks for clients assigned to them
      const clients = await User.find({ assigned_to: req.user._id }).select('_id');
      const clientIds = clients.map(c => c._id);
      filter.$or = [
        { created_by: req.user._id },
        { client_id: { $in: clientIds } }
      ];
    } else if (role === 'client_manager') {
      // Client Manager: View tasks they created
      filter.created_by = req.user._id;
    }
    // admin sees all tasks — no extra filter

    const tasks = await FilingTask.find(filter)
      .populate('client_id', 'owner_name company_name email phone onboarding_documents gstin_file pan_file')
      .populate('assigned_to', 'owner_name email role')
      .populate('created_by', 'owner_name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update filing task (status, assign employee)
// @route   PATCH /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assigned_to, title, description } = req.body;

    const task = await FilingTask.findById(id).populate('client_id', 'owner_name');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Filing task not found' });
    }

    const oldStatus = task.status;
    const oldAssignedTo = task.assigned_to ? task.assigned_to.toString() : null;

    if (status) task.status = status;
    if (assigned_to !== undefined) {
      task.assigned_to = assigned_to || null;
      if (assigned_to && assigned_to.toString() !== oldAssignedTo) {
        const Notification = require('../models/Notification');
        await Notification.create({
          client_id: assigned_to,
          title: 'New Task Assigned',
          message: `You have been assigned the task '${task.title}' for client '${task.client_id?.owner_name}'`,
          type: 'status_update'
        });
      }
    }
    if (title) task.title = title;
    if (description !== undefined) task.description = description;

    await task.save();

    let detailsMsg = `Updated task '${task.title}' for client '${task.client_id?.owner_name}'`;
    if (status && status !== oldStatus) {
      detailsMsg += ` status from '${oldStatus}' to '${status}'`;
    }

    await logActivity(
      req.user._id,
      'task_update',
      detailsMsg,
      req.user.company_id
    );

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload document to task
// @route   POST /api/tasks/:id/documents
// @access  Private
const uploadTaskDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { document_name } = req.body;

    if (!document_name) {
      return res.status(400).json({ success: false, message: 'Document name is required' });
    }

    const task = await FilingTask.findById(id).populate('client_id', 'owner_name');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Filing task not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const file = req.files[0];
    const doc = await Document.create({
      filename: file.originalname,
      contentType: file.mimetype,
      data: file.buffer,
      uploadedBy: req.user._id
    });
    const fileUrl = `api/documents/${doc._id}`;

    task.documents.push({
      name: document_name,
      fileUrl
    });

    // Check for OCR Extraction
    const template = await ChecklistTemplate.findOne({
      company_id: req.user.company_id,
      service_name: task.title
    });
    
    const extractionEnabled = template?.enable_document_extraction === true;
    
    if (extractionEnabled && document_name.toLowerCase().includes('incorporation') && file.mimetype === 'application/pdf') {
      try {
        const pdfData = await pdfParse(file.buffer);
        const text = pdfData.text.replace(/\n/g, ' ').replace(/\s+/g, ' ');
        
        let extractedCompany = '';
        let extractedCin = '';
        let extractedTan = '';
        let extractedPan = '';
        let extractedDate = null;

        const nameMatch = text.match(/I hereby certify that\s+([^]+?)\s+is incorporated/i);
        if (nameMatch) extractedCompany = nameMatch[1].trim();

        const cinMatch = text.match(/([L|U]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6})/);
        if (cinMatch) extractedCin = cinMatch[1].trim();

        const tanMatch = text.match(/\b([A-Z]{4}\d{5}[A-Z])\b/);
        if (tanMatch) extractedTan = tanMatch[1].trim();

        const panRegex = /\b([A-Z]{5}\d{4}[A-Z])\b/g;
        let match;
        while ((match = panRegex.exec(text)) !== null) {
          if (!extractedCin.includes(match[1]) && match[1] !== extractedTan) {
            extractedPan = match[1];
            break;
          }
        }

        let dateMatch = text.match(/this\s+(.+?)\s+under the Companies Act/i);
        if (!dateMatch) {
          dateMatch = text.match(/this\s+([^.]+?(?:two thousand[a-z\s]*|20\d{2}))/i);
        }
        if (!dateMatch) {
          dateMatch = text.match(/(\d{1,2}(?:st|nd|rd|th)?\s+(?:day of\s+)?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*,?\s*(?:two thousand[a-z\s]*|20\d{2}))/i);
        }
        if (dateMatch) {
          extractedDate = parseWrittenDate(dateMatch[1].trim());
        }

        if (extractedCompany || extractedCin || extractedTan) {
          const client = await User.findById(task.client_id._id);
          if (client) {
            if (extractedCompany) client.company_name = extractedCompany;
            if (extractedCin) client.cin = extractedCin;
            if (extractedTan) client.tan = extractedTan;
            if (extractedDate) client.incorporation_date = extractedDate;

            let foundEntity = false;
            
            if (extractedCompany) {
              const entityMatch = client.client_entities.find(e => 
                e.entityName && (
                  extractedCompany.toLowerCase().includes(e.entityName.toLowerCase()) || 
                  e.entityName.toLowerCase().includes(extractedCompany.toLowerCase())
                )
              );
              if (entityMatch) {
                entityMatch.entityName = extractedCompany;
                if (extractedCin) entityMatch.cin = extractedCin;
                if (extractedTan) entityMatch.tan = extractedTan;
                if (extractedPan) entityMatch.pan = extractedPan;
                if (extractedDate) entityMatch.incorporationDate = extractedDate;
                foundEntity = true;
              }
            }
            
            if (!foundEntity) {
              if (client.client_entities.length === 1 && !client.client_entities[0].cin) {
                 const entityMatch = client.client_entities[0];
                 entityMatch.entityName = extractedCompany;
                 if (extractedCin) entityMatch.cin = extractedCin;
                 if (extractedTan) entityMatch.tan = extractedTan;
                 if (extractedPan) entityMatch.pan = extractedPan;
                 if (extractedDate) entityMatch.incorporationDate = extractedDate;
                 foundEntity = true;
              } else if (extractedCompany) {
                client.client_entities.push({
                  entityName: extractedCompany,
                  cin: extractedCin || '',
                  tan: extractedTan || '',
                  pan: extractedPan || '',
                  incorporationDate: extractedDate
                });
              }
            }

            await client.save();
          }
        }
      } catch (e) {
        console.error('OCR Extraction Error:', e);
      }
    }

    await task.save();

    await logActivity(
      req.user._id,
      'task_document_upload',
      `Uploaded document '${document_name}' for task '${task.title}' (Client: '${task.client_id?.owner_name}')`,
      req.user.company_id
    );

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addTaskComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const task = await FilingTask.findById(id).populate('client_id', 'owner_name');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Filing task not found' });
    }

    task.comments.push({
      author: req.user.owner_name,
      text: comment
    });

    await task.save();

    await logActivity(
      req.user._id,
      'task_comment',
      `Commented on task '${task.title}' (Client: '${task.client_id?.owner_name}')`,
      req.user.company_id
    );

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTask,
  uploadTaskDocument,
  addTaskComment
};
