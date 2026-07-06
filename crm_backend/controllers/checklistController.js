const Checklist = require('../models/Checklist');
const User = require('../models/User');
const Team = require('../models/Team');
const { getNextServiceId } = require('../utils/counterHelper');
const { logActivity } = require('../middleware/rbac');
const Document = require('../models/Document');
const Subscription = require('../models/Subscription');
const pdfParse = require('pdf-parse');
const complianceService = require('../services/complianceService');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

// @desc    Create a new service checklist for a client
// @route   POST /api/checklists
// @access  Private (Admin, Client Manager)
const createChecklist = async (req, res) => {
  try {
    const { client_id, service_name, assigned_to, items, notes } = req.body;

    if (!client_id || !service_name) {
      return res.status(400).json({ success: false, message: 'Client ID and service name are required' });
    }

    const client = await User.findById(client_id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Parse items if provided
    let parsedItems = [];
    if (items) {
      const raw = typeof items === 'string' ? JSON.parse(items) : items;
      parsedItems = raw.map(item => {
        if (typeof item === 'string') return { title: item, label: item, isChecked: false };
        return {
          title: item.title || item.label,
          label: item.label || item.title,
          description: item.description || '',
          isChecked: false
        };
      });
    }

    let custom_service_id = null;
    try {
      const compId = req.user.company_id._id || req.user.company_id;
      custom_service_id = await getNextServiceId(compId);
    } catch (e) { console.error('Failed to generate custom_service_id', e); }

    const checklist = await Checklist.create({
      company_id: req.user.company_id,
      custom_service_id,
      client_id,
      service_name,
      assigned_to: assigned_to || null,
      created_by: req.user._id,
      items: parsedItems,
      notes: notes || ''
    });

    if (assigned_to) {
      const Notification = require('../models/Notification');
      await Notification.create({
        client_id: assigned_to,
        title: 'New Service Assigned',
        message: `You have been assigned to handle the service '${service_name}' for client '${client.owner_name}'`,
        type: 'status_update',
        order_id: checklist._id
      });
    }

    await logActivity(
      req.user._id,
      'checklist_created',
      `Created checklist for service '${service_name}' for client '${client.owner_name}'`,
      req.user.company_id
    );

    const populated = await Checklist.findById(checklist._id)
      .populate('client_id', 'custom_client_id owner_name company_name email onboarding_documents')
      .populate('assigned_to', 'owner_name email role')
      .populate('created_by', 'owner_name email role')
      .populate('items.checkedBy', 'owner_name');

    res.status(201).json({ success: true, checklist: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get checklists scoped by role
// @route   GET /api/checklists
// @access  Private
const getChecklists = async (req, res) => {
  try {
    const userCompanyId = req.user.company_id;
    const filter = {};
    if (userCompanyId) {
      filter.company_id = userCompanyId;
    }

    const role = req.user.role;
    if (role === 'filling_staff' || role === 'account_manager') {
      // See only checklists assigned to them or their team
      const myTeams = await Team.find({ members: req.user._id }).select('_id');
      const myTeamIds = myTeams.map(t => t._id);
      filter.$or = [
        { assigned_to: req.user._id },
        { assigned_team: { $in: myTeamIds } }
      ];
    } else if (role === 'client_manager') {
      // See checklists for authorized clients OR checklists directly assigned to them
      const myClients = await User.find({
        role: 'customer',
        $or: [
          { assigned_to: req.user._id },
          { created_by: req.user._id, assigned_to: null }
        ]
      }).select('_id');
      const myClientIds = myClients.map(c => c._id);
      const myTeams = await Team.find({ members: req.user._id }).select('_id');
      const myTeamIds = myTeams.map(t => t._id);
      filter.$or = [
        { assigned_to: req.user._id },
        { assigned_team: { $in: myTeamIds } },
        { client_id: { $in: myClientIds } }
      ];
    }
    // admin sees all (no extra filter)

    // Also allow filtering by client_id query param
    if (req.query.client_id) {
      filter.client_id = req.query.client_id;
    }

    const checklists = await Checklist.find(filter)
      .populate('client_id', 'custom_client_id owner_name company_name email onboarding_documents')
      .populate('assigned_to', 'owner_name email role')
      .populate('assigned_team', 'name')
      .populate('created_by', 'owner_name email role')
      .populate('items.checkedBy', 'owner_name')
      .sort({ createdAt: -1 });

    // Auto-fetch/populate items from ChecklistTemplate if checklist has 0 items
    const ChecklistTemplate = require('../models/ChecklistTemplate');
    const checklistsData = [];

    for (let cl of checklists) {
      const template = await ChecklistTemplate.findOne({
        company_id: cl.company_id,
        service_name: cl.service_name
      });

      if (!cl.items || cl.items.length === 0) {
        if (template && template.items && template.items.length > 0) {
          cl.items = template.items.map(item => ({
            title: item.title,
            description: item.description,
            label: item.title,
            isChecked: false
          }));
          await cl.save();
          console.log(`[DEBUG] Dynamically populated ${cl.items.length} items from template for checklist ID ${cl._id} (${cl.service_name})`);
        }
      }

      let clObj = cl.toObject();
      if (template && template.sop_document) {
        clObj.sop_document = template.sop_document;
      }
      checklistsData.push(clObj);
    }

    res.status(200).json({ success: true, checklists: checklistsData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle a checklist item checked/unchecked
// @route   PATCH /api/checklists/:id/items/:itemIndex
// @access  Private (Admin, Client Manager, Filing Staff, Account Manager)
const toggleChecklistItem = async (req, res) => {
  try {
    const { id, itemIndex } = req.params;
    const idx = parseInt(itemIndex, 10);

    const checklist = await Checklist.findById(id);
    if (!checklist) {
      return res.status(404).json({ success: false, message: 'Checklist not found' });
    }

    if (idx < 0 || idx >= checklist.items.length) {
      return res.status(400).json({ success: false, message: 'Invalid item index' });
    }

    const item = checklist.items[idx];
    item.isChecked = !item.isChecked;
    item.checkedAt = item.isChecked ? new Date() : null;
    item.checkedBy = item.isChecked ? req.user._id : null;

    if (item.title && item.title.startsWith('[Support]')) {
      const Ticket = require('../models/Ticket');
      await Ticket.updateOne(
        { userId: checklist.client_id.toString(), description: item.description },
        { status: item.isChecked ? 'Resolved' : 'In Progress' }
      );

      if (item.isChecked && checklist.client_id) {
        const Notification = require('../models/Notification');
        await Notification.create({
          client_id: checklist.client_id,
          title: 'Support Ticket Resolved',
          message: `Your support ticket "${item.title.replace('[Support] ', '')}" has been resolved!`,
          type: 'status_update',
          order_id: checklist._id
        });
      }
    }

    const prevStatus = checklist.status;
    await checklist.save();

    if (checklist.status === 'completed' && prevStatus !== 'completed' && checklist.client_id) {
      const Notification = require('../models/Notification');
      await Notification.create({
        client_id: checklist.client_id,
        title: 'Service Completed 🎉',
        message: `Your service '${checklist.service_name}' has been successfully completed!`,
        type: 'status_update',
        order_id: checklist._id
      });


    }

    if (checklist.status === 'completed' && checklist.recommended_plan) {
      const existingSub = await Subscription.findOne({ checklist_id: checklist._id });
      if (!existingSub) {
        let planTier = 'Startup';
        if (checklist.recommended_plan === 'Business Plan') planTier = 'Business';
        if (checklist.recommended_plan === 'Corporate Plan') planTier = 'Corporate';
        
        const activationDate = new Date();
        const expiryDate = new Date();
        const currentMonth = activationDate.getMonth();
        const targetYear = currentMonth > 2 ? activationDate.getFullYear() + 1 : activationDate.getFullYear();
        expiryDate.setFullYear(targetYear, 2, 31);
        expiryDate.setHours(23, 59, 59, 999);
        
        await Subscription.create({
          client_id: checklist.client_id,
          company_id: checklist.company_id,
          checklist_id: checklist._id,
          plan_name: checklist.recommended_plan,
          plan_tier: planTier,
          service_type: checklist.service_name,
          service_fee: checklist.recommended_fee,
          activation_date: activationDate,
          expiry_date: expiryDate,
          status: 'Active'
        });
        console.log(`[DEBUG] Auto-activated subscription for ${checklist.service_name}`);
      }
    }

    const populated = await Checklist.findById(id)
      .populate('client_id', 'custom_client_id owner_name company_name email onboarding_documents')
      .populate('assigned_to', 'owner_name email role')
      .populate('assigned_team', 'name')
      .populate('created_by', 'owner_name email role')
      .populate('items.checkedBy', 'owner_name');

    await logActivity(
      req.user._id,
      'checklist_item_toggled',
      `${item.isChecked ? 'Checked' : 'Unchecked'} item '${item.title || item.label}' on checklist for service '${checklist.service_name}'`,
      req.user.company_id
    );

    res.status(200).json({ success: true, checklist: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a new item to an existing checklist
// @route   POST /api/checklists/:id/items
// @access  Private (Admin, Client Manager)
const addChecklistItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, label } = req.body;

    if (!title && !label) {
      return res.status(400).json({ success: false, message: 'Item title is required' });
    }

    const checklist = await Checklist.findById(id);
    if (!checklist) {
      return res.status(404).json({ success: false, message: 'Checklist not found' });
    }

    checklist.items.push({
      title: title || label,
      label: label || title, // Keep legacy populated
      description: description || '',
      isChecked: false
    });
    await checklist.save();

    const populated = await Checklist.findById(id)
      .populate('client_id', 'custom_client_id owner_name company_name email onboarding_documents')
      .populate('assigned_to', 'owner_name email role')
      .populate('assigned_team', 'name')
      .populate('created_by', 'owner_name email role')
      .populate('items.checkedBy', 'owner_name');

    res.status(200).json({ success: true, checklist: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update checklist metadata (assigned_to, notes)
// @route   PATCH /api/checklists/:id
// @access  Private (Admin, Client Manager)
const updateChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to, assigned_team, notes, stage, items, requested_documents, status, details, advanceAmountPaid, applicationId } = req.body;

    const checklist = await Checklist.findById(id);
    if (!checklist) {
      return res.status(404).json({ success: false, message: 'Checklist not found' });
    }

    if (req.user.role === 'customer') {
      if (checklist.client_id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this checklist' });
      }
      if (details !== undefined) {
        checklist.details = { ...details, clientFormSubmitted: true };
        checklist.action_required = false;
      }
    } else {
      if (assigned_team !== undefined) {
        checklist.assigned_team = assigned_team || null;
      }
      if (assigned_to !== undefined) {
        const prevAssigned = checklist.assigned_to ? checklist.assigned_to.toString() : null;
        checklist.assigned_to = assigned_to || null;
        
        if (assigned_to && assigned_to.toString() !== prevAssigned) {
          const Notification = require('../models/Notification');
          await Notification.create({
            client_id: assigned_to,
            title: 'New Service Assigned',
            message: `You have been assigned to handle the service '${checklist.service_name}'`,
            type: 'status_update',
            order_id: checklist._id
          });
        }
        
        // Set action_required for ALL services that have a form
        if (assigned_to) {
          const formServices = [
            'dpiit', 'private limited', 'trademark', 'trade mark', 'llp', 'msme',
            'gst', 'iso', 'fssai', 'one person company', 'opc', 'lei', 'lie', 'bis',
            'mca', 'dsc', 'iec', 'proprietorship', 'tds', 'pan, tan', 'pf', 'patent',
            'copyright', 'itr'
          ];
          const svcLower = checklist.service_name ? checklist.service_name.toLowerCase() : '';
          if (formServices.some(s => svcLower.includes(s))) {
            checklist.action_required = true;
          }
        }
      }
      if (notes !== undefined) checklist.notes = notes;
      if (stage !== undefined) checklist.stage = stage;
      if (status !== undefined) {
        const prevStatus = checklist.status;
        checklist.status = status;
        
        // Notify client if service is marked as completed
        if (status === 'completed' && prevStatus !== 'completed' && checklist.client_id) {
          const Notification = require('../models/Notification');
          await Notification.create({
            client_id: checklist.client_id,
            title: 'Service Completed 🎉',
            message: `Your service '${checklist.service_name}' has been successfully completed!`,
            type: 'status_update',
            order_id: checklist._id
          });


        }
      }
      if (requested_documents !== undefined) {
        const oldDocs = checklist.requested_documents || [];
        const newDocs = requested_documents || [];

        // Find documents that are new and not uploaded
        const newlyRequested = newDocs.filter(nd => !nd.isUploaded && !oldDocs.some(od => od.name === nd.name));

        checklist.requested_documents = requested_documents;

        if (newlyRequested.length > 0 && checklist.client_id) {
          const Notification = require('../models/Notification');
          const docNames = newlyRequested.map(d => d.name).join(', ');
          await Notification.create({
            client_id: checklist.client_id,
            title: 'Action Required: Documents Requested',
            message: `Your expert requested: ${docNames}. Please upload them.`,
            type: 'document_request',
            order_id: id
          });
        }
      }
      if (details !== undefined) checklist.details = details;

      // Allow bulk item update (e.g. replacing all items)
      if (items !== undefined) {
        const raw = typeof items === 'string' ? JSON.parse(items) : items;
        checklist.items = raw.map((item) => ({
          title: item.title || item.label,
          label: item.label || item.title,
          description: item.description || '',
          isChecked: item.isChecked || false
        }));
      }
      
      if (advanceAmountPaid !== undefined) {
        checklist.advanceAmountPaid = advanceAmountPaid;
      }
    }

    if (applicationId !== undefined) {
      if (!checklist.details) checklist.details = {};
      checklist.details.applicationId = applicationId;
      checklist.markModified('details');
      
      // Sync the Application ID with the client's entity profile
      if (checklist.client_id) {
        const User = require('../models/User');
        const user = await User.findById(checklist.client_id);
        if (user && user.client_entities && user.client_entities.length > 0) {
          // Find the entity that matches the checklist's entityName
          const entityName = checklist.details.entityName || '';
          let entityIndex = -1;
          
          if (entityName) {
             entityIndex = user.client_entities.findIndex(e => e.entityName === entityName);
          } else {
             // If no entity name, just update the first one
             entityIndex = 0;
          }
          
          if (entityIndex !== -1) {
            const svcLower = checklist.service_name ? checklist.service_name.toLowerCase() : '';
            let modified = false;
            
            if (svcLower.includes('trademark') || svcLower.includes('trade mark')) {
              user.client_entities[entityIndex].trademarkApplicationNumber = applicationId;
              modified = true;
            } else if (svcLower.includes('patent')) {
              user.client_entities[entityIndex].patentApplicationNumber = applicationId;
              modified = true;
            } else if (svcLower.includes('copyright')) {
              user.client_entities[entityIndex].copyrightRegistrationNumber = applicationId;
              modified = true;
            }
            
            if (modified) {
              user.markModified('client_entities');
              await user.save();
            }
          }
        }
      }
    }

    if (details !== undefined) {
      checklist.markModified('details');
    }

    await checklist.save();

    if (checklist.status === 'completed' && checklist.recommended_plan) {
      const existingSub = await Subscription.findOne({ checklist_id: checklist._id });
      if (!existingSub) {
        let planTier = 'Startup';
        if (checklist.recommended_plan === 'Business Plan') planTier = 'Business';
        if (checklist.recommended_plan === 'Corporate Plan') planTier = 'Corporate';
        
        const activationDate = new Date();
        const expiryDate = new Date();
        const currentMonth = activationDate.getMonth();
        const targetYear = currentMonth > 2 ? activationDate.getFullYear() + 1 : activationDate.getFullYear();
        expiryDate.setFullYear(targetYear, 2, 31);
        expiryDate.setHours(23, 59, 59, 999);
        
        await Subscription.create({
          client_id: checklist.client_id,
          company_id: checklist.company_id,
          checklist_id: checklist._id,
          plan_name: checklist.recommended_plan,
          plan_tier: planTier,
          service_type: checklist.service_name,
          service_fee: checklist.recommended_fee,
          activation_date: activationDate,
          expiry_date: expiryDate,
          status: 'Active'
        });
        console.log(`[DEBUG] Auto-activated subscription for ${checklist.service_name}`);
      }
    }

    const populated = await Checklist.findById(id)
      .populate('client_id', 'custom_client_id owner_name company_name email onboarding_documents')
      .populate('assigned_to', 'owner_name email role')
      .populate('assigned_team', 'name')
      .populate('created_by', 'owner_name email role')
      .populate('items.checkedBy', 'owner_name');

    res.status(200).json({ success: true, checklist: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get checklists for the logged-in customer (Flutter client)
// @route   GET /api/my-checklists
// @access  Private (customer)
const getMyChecklists = async (req, res) => {
  try {
    const clientId = req.user._id;

    const checklists = await Checklist.find({ client_id: clientId })
      .populate('assigned_to', 'owner_name email role phone')
      .populate('created_by', 'owner_name email role')
      .select('service_name company_id custom_service_id status stage items requested_documents final_documents notes assigned_to created_by createdAt updatedAt dealClosedAmount advanceAmountPaid details action_required')
      .sort({ updatedAt: -1 });

    // Auto-fetch/populate items from ChecklistTemplate if checklist has 0 items
    const ChecklistTemplate = require('../models/ChecklistTemplate');
    for (let cl of checklists) {
      if (!cl.items || cl.items.length === 0) {
        const template = await ChecklistTemplate.findOne({
          company_id: cl.company_id,
          service_name: cl.service_name
        });
        if (template && template.items && template.items.length > 0) {
          cl.items = template.items.map(item => ({
            title: item.title,
            description: item.description,
            label: item.title,
            isChecked: false
          }));
          await cl.save();
          console.log(`[DEBUG] getMyChecklists: Dynamically populated ${cl.items.length} items from template for checklist ID ${cl._id} (${cl.service_name})`);
        }
      }
    }

    // Convert to plain objects so we can enrich them without Mongoose restrictions
    const checklistsPlain = checklists.map(c => c.toObject());

    // Fetch corresponding service orders to get dealClosedAmount if present
    const ServiceOrder = require('../models/ServiceOrder');
    const serviceOrders = await ServiceOrder.find({ clientUid: clientId }).lean();

    // Services that require a custom form screen before processing
    const SERVICES_WITH_FORMS = [
      'DPIIT',
      'Private Limited',
      'Trade mark',
      'Trademark',
      'Copyright',
      'LLP',
      'MSME',
      'MSME Certification',
      'GST',
      'GST Registration',
      'GST Compliance',
      'GST Filing',
      'GST Cancellation',
      'ISO',
      'ISO Registration',
      'ISO Certification',
      'FSSAI',
      'FSSAI Registration',
      'FSSAI Food License',
      'One Person Company',
      'OPC',
      'LEI Registration',
      'LEI',
      'LIE Registration',
      'LIE',
      'BIS Registration',
      'BIS',
      'MCA Compliance',
      'DSC',
      'IEC Registration',
      'IEC',
      'Proprietorship',
      'TDS',
      'PAN, TAN',
      'ITR',
      'PF Registration',
      'PF',
      'Patent Registration',
      'Patent',
      'Copyright'
    ];

    const enrichedChecklists = checklistsPlain.map(c => {
      const order = serviceOrders.find(o => o.serviceType === c.service_name);
      const serviceNameLower = c.service_name ? c.service_name.toLowerCase() : '';
      const requiresForm = SERVICES_WITH_FORMS.some(s => serviceNameLower.includes(s.toLowerCase()));
      let dynamicActionRequired = c.action_required;
      let modifiedItems = c.items || [];

      if (requiresForm) {
        // Check if explicit flag is set OR if the "Client Form Filling" step is actually checked
        const clientFormFillingStep = c.items && c.items.find(i => i.title === 'Client Form Filling');
        const isFormFilled = !!(c.details && c.details.clientFormSubmitted) || !!(clientFormFillingStep && clientFormFillingStep.isChecked);

        // Override action_required if form is not filled
        dynamicActionRequired = !isFormFilled;

        // Dynamically inject the form step at the beginning
        modifiedItems = [
          {
            title: "Provide Additional Details",
            description: "Please fill out the required form to begin the process.",
            isChecked: isFormFilled, // Check details instead of action_required
            isActionStep: true
          },
          ...modifiedItems
        ];
      }

      return {
        ...c,
        items: modifiedItems,
        action_required: dynamicActionRequired,
        dealClosedAmount: order?.dealClosedAmount || c.dealClosedAmount || 0
      };
    });

    console.log(`[DEBUG] getMyChecklists returned ${enrichedChecklists.length} items`);
    if (enrichedChecklists.length > 0) {
      console.log(`[DEBUG] First checklist final_documents:`, enrichedChecklists[0].final_documents);
    }

    res.status(200).json({ success: true, checklists: enrichedChecklists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload requested documents from customer app
// @route   POST /api/checklists/:id/upload-documents
// @access  Private (Customer)
const uploadRequestedDocuments = async (req, res) => {
  try {
    console.log(`[DEBUG] uploadRequestedDocuments called for id: ${req.params.id}`);
    console.log(`[DEBUG] Files received:`, req.files ? req.files.length : 0);
    const { id } = req.params;
    const checklist = await Checklist.findById(id);

    if (!checklist) {
      return res.status(404).json({ success: false, message: 'Checklist not found' });
    }

    // Ensure it belongs to the user
    if (checklist.client_id.toString() !== req.user._id.toString() && req.user.role === 'customer') {
      return res.status(403).json({ success: false, message: 'Not authorized to upload to this checklist' });
    }

    if (req.files && req.files.length > 0) {
      for (const f of req.files) {
        // If the new Flutter app sends 'document' and docName in body, use that.
        // Otherwise, fallback to the old Flutter app behavior where the fieldname is the document name.
        const docName = (req.body && req.body.docName) ? req.body.docName : f.fieldname;
        let requestedDocIndex = -1;
        if (req.body && req.body.docIndex !== undefined) {
          requestedDocIndex = parseInt(req.body.docIndex, 10);
        } else {
          requestedDocIndex = checklist.requested_documents.findIndex(d => d.name === docName);
        }

        const doc = await Document.create({
          filename: f.originalname,
          contentType: f.mimetype,
          data: f.buffer,
          uploadedBy: req.user._id
        });

        if (requestedDocIndex !== -1) {
          checklist.requested_documents[requestedDocIndex].fileUrl = `/api/documents/${doc._id}`;
          checklist.requested_documents[requestedDocIndex].isUploaded = true;
          checklist.requested_documents[requestedDocIndex].uploadedAt = new Date();
        } else {
          // If customer uploads something not explicitly requested, add it anyway
          checklist.requested_documents.push({
            name: docName,
            fileUrl: `/api/documents/${doc._id}`,
            isUploaded: true,
            uploadedAt: new Date()
          });
        }
      }
      await checklist.save();

      await logActivity(
        req.user._id,
        'document_uploaded',
        `Uploaded requested documents for service '${checklist.service_name}'`,
        req.user.company_id
      );

      res.status(200).json({ success: true, message: 'Documents uploaded successfully' });
    } else {
      res.status(400).json({ success: false, message: 'No files provided' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload final documents
// @route   POST /api/checklists/:id/final-documents
// @access  Private (Admin, Client Manager, Staff)
const uploadFinalDocuments = async (req, res) => {
  try {
    const { id } = req.params;

    const checklist = await Checklist.findById(id);
    if (!checklist) {
      return res.status(404).json({ success: false, message: 'Checklist not found' });
    }

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];

        // Save to Document collection
        const newDoc = await Document.create({
          filename: file.originalname,
          contentType: file.mimetype,
          data: file.buffer,
          uploadedBy: req.user._id
        });

        checklist.final_documents.push({
          name: file.originalname,
          document_id: newDoc._id,
          uploadedAt: new Date()
        });

        // OCR extraction logic for Incorporation certificates
        if (file.mimetype === 'application/pdf' && (file.originalname.toLowerCase().includes('incorporation') || file.originalname.toLowerCase().includes('coi'))) {
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

            if (!extractedDate) {
              const standardDateMatch = text.match(/\b(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})\b/);
              if (standardDateMatch) {
                const day = parseInt(standardDateMatch[1], 10);
                const month = parseInt(standardDateMatch[2], 10) - 1;
                const year = parseInt(standardDateMatch[3], 10);
                extractedDate = new Date(Date.UTC(year, month, day));
              }
            }

            // Update client profile and specific client entity
            if (extractedCompany || extractedCin || extractedTan) {
              const client = await User.findById(checklist.client_id);
              if (client) {
                if (extractedCompany) client.company_name = extractedCompany;
                if (extractedCin) client.cin = extractedCin;
                if (extractedTan) client.tan = extractedTan;
                if (extractedDate) client.incorporation_date = extractedDate;

                let foundEntity = false;
                const originalName = checklist.details?.entityName || checklist.details?.entity_name || checklist.details?.companyName || checklist.details?.proposed_company_name;

                if (originalName) {
                  const entityMatch = client.client_entities.find(e => 
                    e.entityName && e.entityName.toLowerCase() === originalName.toLowerCase()
                  );
                  if (entityMatch) {
                    if (extractedCompany) entityMatch.entityName = extractedCompany;
                    if (extractedCin) entityMatch.cin = extractedCin;
                    if (extractedTan) entityMatch.tan = extractedTan;
                    if (extractedPan) entityMatch.pan = extractedPan;
                    if (extractedDate) entityMatch.incorporationDate = extractedDate;
                    foundEntity = true;
                  }
                }

                if (!foundEntity && extractedCompany) {
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
                  // Fallback: Only rename the single entity if its name matches the originalName on this checklist
                  if (client.client_entities.length === 1 && !client.client_entities[0].cin &&
                      originalName && client.client_entities[0].entityName &&
                      client.client_entities[0].entityName.toLowerCase() === originalName.toLowerCase()) {
                     const entityMatch = client.client_entities[0];
                     if (extractedCompany) entityMatch.entityName = extractedCompany;
                     if (extractedCin) entityMatch.cin = extractedCin;
                     if (extractedTan) entityMatch.tan = extractedTan;
                     if (extractedPan) entityMatch.pan = extractedPan;
                     if (extractedDate) entityMatch.incorporationDate = extractedDate;
                     foundEntity = true;
                  } 
                  // Another fallback: Find an entity with exactly the originalName
                  else {
                     const entityMatch = client.client_entities.find(e => 
                       !e.cin && originalName && e.entityName && e.entityName.toLowerCase() === originalName.toLowerCase()
                     );
                     if (entityMatch) {
                       if (extractedCompany) entityMatch.entityName = extractedCompany;
                       if (extractedCin) entityMatch.cin = extractedCin;
                       if (extractedTan) entityMatch.tan = extractedTan;
                       if (extractedPan) entityMatch.pan = extractedPan;
                       if (extractedDate) entityMatch.incorporationDate = extractedDate;
                       foundEntity = true;
                     }
                  }

                  if (!foundEntity && (extractedCompany || checklist.details?.companyName || checklist.details?.proposed_company_name)) {
                    client.client_entities.push({
                      entityName: extractedCompany || checklist.details?.companyName || checklist.details?.proposed_company_name || 'Individual',
                      cin: extractedCin || '',
                      tan: extractedTan || '',
                      pan: extractedPan || '',
                      incorporationDate: extractedDate
                    });
                  }
                }

                await client.save();
                console.log(`[OCR] Updated client entities for checklist ${id} (Company: ${extractedCompany})`);

                if (extractedCompany && originalName) {
                  if (checklist.details) {
                    checklist.details.entityName = extractedCompany;
                    checklist.details.entity_name = extractedCompany;
                    if (checklist.details.companyName) checklist.details.companyName = extractedCompany;
                    checklist.markModified('details');
                  }
                  try {
                    const ServiceOrder = require('../models/ServiceOrder');
                    await ServiceOrder.updateMany(
                      { clientUid: checklist.client_id, entityName: originalName },
                      { $set: { entityName: extractedCompany } }
                    );
                  } catch (e) {
                    console.error('Error updating order entity names:', e);
                  }
                }
              }
            }
            
            // Trigger compliance generation
            if (checklist.service_name.includes('Private Limited') && extractedDate) {
              const entityName = checklist.details?.companyName || checklist.details?.proposed_company_name || 'Individual';
              await complianceService.generateCompliancesForPrivateLimited(
                checklist.client_id,
                checklist.company_id,
                checklist._id,
                extractedDate,
                entityName
              );
              console.log(`Generated compliances for ${entityName} with incDate ${extractedDate}`);
            } else if (checklist.service_name.includes('LLP Incorporation') && extractedDate) {
              const entityName = checklist.details?.companyName || checklist.details?.proposed_company_name || 'LLP Entity';
              await complianceService.generateCompliancesForLLP(
                checklist.client_id,
                checklist.company_id,
                checklist._id,
                extractedDate,
                entityName
              );
              console.log(`Generated LLP compliances for ${entityName} with incDate ${extractedDate}`);
            } else if (checklist.service_name.includes('One Person Company') && extractedDate) {
              const entityName = checklist.details?.companyName || checklist.details?.proposed_company_name || 'OPC Entity';
              await complianceService.generateCompliancesForOPC(
                checklist.client_id,
                checklist.company_id,
                checklist._id,
                extractedDate,
                entityName
              );
              console.log(`Generated OPC compliances for ${entityName} with incDate ${extractedDate}`);
            }

          } catch (err) {
            console.error('OCR or Compliance Error:', err);
          }
        }
      }

      // Expiry Certificate Logic
      if (req.body.issueDate && req.body.expiryDate) {
        try {
          const Certificate = require('../models/Certificate');
          const sName = checklist.service_name.toLowerCase();
          const isExpiry = sName.includes('dsc') || sName.includes('digital signature') || sName.includes('fssai') || sName.includes('iso') || sName.includes('trademark') || sName.includes('trade mark') || sName.includes('copyright') || sName.includes('patent') || sName.includes('lei') || sName.includes('lie') || sName.includes('bis');
          
          if (isExpiry) {
            let cert = await Certificate.findOne({ latestRenewalChecklistId: checklist._id });
            if (!cert) {
              const User = require('../models/User');
              const client = await User.findById(checklist.client_id);
              
              cert = new Certificate({
                client_id: checklist.client_id,
                entityName: checklist.details?.companyName || checklist.details?.proposed_company_name || checklist.details?.entityName || checklist.details?.businessName || client?.company_name || 'Individual',
                serviceName: checklist.service_name.replace(/ Renewal$/i, '').trim(),
                certificateNumber: req.body.certificateNumber || 'N/A',
                issueDate: new Date(req.body.issueDate),
                expiryDate: new Date(req.body.expiryDate),
                renewalRequired: true,
                latestRenewalChecklistId: checklist._id
              });
            } else {
              cert.issueDate = new Date(req.body.issueDate);
              cert.expiryDate = new Date(req.body.expiryDate);
              if (req.body.certificateNumber) cert.certificateNumber = req.body.certificateNumber;
              cert.renewalStatus = 'Active';
              cert.latestRenewalChecklistId = undefined; // clear it so it doesn't get stuck
            }
            await cert.save();
            console.log(`[CERTIFICATE] Created/Updated Expiry Certificate for ${checklist.service_name}`);
          }
        } catch (err) {
          console.error('Error creating Certificate record:', err);
        }
      }

      await checklist.save();
    }

    const populated = await Checklist.findById(id)
      .populate('client_id', 'custom_client_id owner_name company_name email onboarding_documents')
      .populate('assigned_to', 'owner_name email role')
      .populate('assigned_team', 'name')
      .populate('created_by', 'owner_name email role')
      .populate('items.checkedBy', 'owner_name');

    res.status(200).json({ success: true, checklist: populated });
  } catch (error) {
    console.error('Final Documents Upload Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a final document from a checklist
// @route   DELETE /api/checklists/:id/final-documents/:docId
// @access  Private (Admin, Client Manager, Staff)
const deleteFinalDocument = async (req, res) => {
  try {
    const { id, docId } = req.params;

    const checklist = await Checklist.findById(id);
    if (!checklist) {
      return res.status(404).json({ success: false, message: 'Checklist not found' });
    }

    // Find the document in the checklist's final_documents array
    const docIndex = checklist.final_documents.findIndex(d => d.document_id && d.document_id.toString() === docId);
    
    if (docIndex === -1) {
      return res.status(404).json({ success: false, message: 'Document not found in this checklist' });
    }

    const deletedDocName = checklist.final_documents[docIndex].name || '';
    if (deletedDocName.toLowerCase().includes('incorporation') || deletedDocName.toLowerCase().includes('coi')) {
      const ComplianceTask = require('../models/ComplianceTask');
      await ComplianceTask.deleteMany({ checklistId: checklist._id });
      console.log(`Deleted compliance tasks for checklist ${id} because COI was deleted.`);
    }

    // Remove from array
    checklist.final_documents.splice(docIndex, 1);
    await checklist.save();

    // Optionally delete from the Document collection as well
    const Document = require('../models/Document');
    await Document.findByIdAndDelete(docId);

    const populated = await Checklist.findById(id)
      .populate('client_id', 'custom_client_id owner_name company_name email onboarding_documents')
      .populate('assigned_to', 'owner_name email role')
      .populate('assigned_team', 'name')
      .populate('created_by', 'owner_name email role')
      .populate('items.checkedBy', 'owner_name');

    res.status(200).json({ success: true, checklist: populated });
  } catch (error) {
    console.error('Final Documents Delete Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Re-upload/Replace a final document in a checklist
// @route   PUT /api/checklists/:id/final-documents/:docId/reupload
// @access  Private (Admin, Client Manager, Staff)
const reuploadFinalDocument = async (req, res) => {
  try {
    const { id, docId } = req.params;

    const checklist = await Checklist.findById(id);
    if (!checklist) {
      return res.status(404).json({ success: false, message: 'Checklist not found' });
    }

    if (!req.file && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const file = req.file || req.files[0];

    // Find the document in the checklist's final_documents array
    const docIndex = checklist.final_documents.findIndex(d => d.document_id && d.document_id.toString() === docId);
    
    if (docIndex === -1) {
      return res.status(404).json({ success: false, message: 'Document not found in this checklist' });
    }

    const Document = require('../models/Document');

    // Create the new Document
    const newDoc = await Document.create({
      filename: file.originalname,
      contentType: file.mimetype,
      data: file.buffer,
      uploadedBy: req.user._id
    });

    // Update the array item
    checklist.final_documents[docIndex].document_id = newDoc._id;
    checklist.final_documents[docIndex].uploadedAt = new Date();

    // OCR extraction logic for Incorporation certificates
    if (file.mimetype === 'application/pdf' && (file.originalname.toLowerCase().includes('incorporation') || file.originalname.toLowerCase().includes('coi'))) {
      try {
        const pdfParse = require('pdf-parse');
        const User = require('../models/User');
        const complianceService = require('../services/complianceService');
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

        if (!extractedDate) {
          const standardDateMatch = text.match(/\b(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})\b/);
          if (standardDateMatch) {
            const day = parseInt(standardDateMatch[1], 10);
            const month = parseInt(standardDateMatch[2], 10) - 1;
            const year = parseInt(standardDateMatch[3], 10);
            extractedDate = new Date(Date.UTC(year, month, day));
          }
        }

        // Update client profile and specific client entity
        if (extractedCompany || extractedCin || extractedTan) {
          const client = await User.findById(checklist.client_id);
          if (client) {
            if (extractedCompany) client.company_name = extractedCompany;
            if (extractedCin) client.cin = extractedCin;
            if (extractedTan) client.tan = extractedTan;
            if (extractedDate) client.incorporation_date = extractedDate;

            let foundEntity = false;
            const originalName = checklist.details?.entityName || checklist.details?.entity_name || checklist.details?.companyName || checklist.details?.proposed_company_name;

            if (originalName) {
              const entityMatch = client.client_entities.find(e => 
                e.entityName && e.entityName.toLowerCase() === originalName.toLowerCase()
              );
              if (entityMatch) {
                if (extractedCompany) entityMatch.entityName = extractedCompany;
                if (extractedCin) entityMatch.cin = extractedCin;
                if (extractedTan) entityMatch.tan = extractedTan;
                if (extractedPan) entityMatch.pan = extractedPan;
                if (extractedDate) entityMatch.incorporationDate = extractedDate;
                foundEntity = true;
              }
            }

            if (!foundEntity && extractedCompany) {
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
              // Fallback: Only rename the single entity if its name matches the originalName on this checklist
              if (client.client_entities.length === 1 && !client.client_entities[0].cin &&
                  originalName && client.client_entities[0].entityName &&
                  client.client_entities[0].entityName.toLowerCase() === originalName.toLowerCase()) {
                  const entityMatch = client.client_entities[0];
                  if (extractedCompany) entityMatch.entityName = extractedCompany;
                  if (extractedCin) entityMatch.cin = extractedCin;
                  if (extractedTan) entityMatch.tan = extractedTan;
                  if (extractedPan) entityMatch.pan = extractedPan;
                  if (extractedDate) entityMatch.incorporationDate = extractedDate;
                  foundEntity = true;
              } 
              // Another fallback: Find an entity with exactly the originalName
              else {
                  const entityMatch = client.client_entities.find(e => 
                    !e.cin && originalName && e.entityName && e.entityName.toLowerCase() === originalName.toLowerCase()
                  );
                  if (entityMatch) {
                    if (extractedCompany) entityMatch.entityName = extractedCompany;
                    if (extractedCin) entityMatch.cin = extractedCin;
                    if (extractedTan) entityMatch.tan = extractedTan;
                    if (extractedPan) entityMatch.pan = extractedPan;
                    if (extractedDate) entityMatch.incorporationDate = extractedDate;
                    foundEntity = true;
                  }
              }

              if (!foundEntity && (extractedCompany || checklist.details?.companyName || checklist.details?.proposed_company_name)) {
                client.client_entities.push({
                  entityName: extractedCompany || checklist.details?.companyName || checklist.details?.proposed_company_name || 'Individual',
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
        
        if (extractedCompany && typeof originalName !== 'undefined' && originalName) {
          if (checklist.details) {
            checklist.details.entityName = extractedCompany;
            checklist.details.entity_name = extractedCompany;
            if (checklist.details.companyName) checklist.details.companyName = extractedCompany;
            checklist.markModified('details');
          }
          try {
            const ServiceOrder = require('../models/ServiceOrder');
            await ServiceOrder.updateMany(
              { clientUid: checklist.client_id, entityName: originalName },
              { $set: { entityName: extractedCompany } }
            );
          } catch (e) {
            console.error('Error updating order entity names:', e);
          }
        }

        // Trigger compliance generation
        if (checklist.service_name.includes('Private Limited') && extractedDate) {
          const entityName = checklist.details?.companyName || checklist.details?.proposed_company_name || 'Individual';
          await complianceService.generateCompliancesForPrivateLimited(
            checklist.client_id,
            checklist.company_id,
            checklist._id,
            extractedDate,
            entityName
          );
        } else if (checklist.service_name.includes('LLP Incorporation') && extractedDate) {
          const entityName = checklist.details?.companyName || checklist.details?.proposed_company_name || 'LLP Entity';
          await complianceService.generateCompliancesForLLP(
            checklist.client_id,
            checklist.company_id,
            checklist._id,
            extractedDate,
            entityName
          );
        } else if (checklist.service_name.includes('One Person Company') && extractedDate) {
          const entityName = checklist.details?.companyName || checklist.details?.proposed_company_name || 'OPC Entity';
          await complianceService.generateCompliancesForOPC(
            checklist.client_id,
            checklist.company_id,
            checklist._id,
            extractedDate,
            entityName
          );
        }

      } catch (err) {
        console.error('OCR or Compliance Error during reupload:', err);
      }
    }

    await checklist.save();

    // Optionally delete the old document
    try {
      await Document.findByIdAndDelete(docId);
    } catch (e) {
      console.error('Error deleting old document:', e);
    }

    const populated = await Checklist.findById(id)
      .populate('client_id', 'custom_client_id owner_name company_name email onboarding_documents')
      .populate('assigned_to', 'owner_name email role')
      .populate('assigned_team', 'name')
      .populate('created_by', 'owner_name email role')
      .populate('items.checkedBy', 'owner_name');

    res.status(200).json({ success: true, checklist: populated });
  } catch (error) {
    console.error('Reupload Final Document Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a support ticket linked to a checklist
// @route   POST /api/checklists/:id/support-ticket
// @access  Private (Customer)
const createSupportTicketForChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, description, userId, userName, userEmail } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ success: false, message: 'Subject and description are required.' });
    }

    const checklist = await Checklist.findById(id);
    if (!checklist) {
      return res.status(404).json({ success: false, message: 'Service order not found.' });
    }

    // 1. Add as a checklist item
    let newItemTitle = `[Support] ${subject}`;
    if (newItemTitle.length > 30) {
      newItemTitle = newItemTitle.substring(0, 27) + '...';
    }
    
    checklist.items.push({
      title: newItemTitle,
      label: newItemTitle,
      description: description,
      isChecked: false
    });
    
    // Only update status if checklist is not already completed
    if (checklist.status !== 'completed') {
      checklist.status = 'in_progress';
    }
    
    await checklist.save();

    // 2. Create standard Ticket for the "Support Tickets" screen
    const Ticket = require('../models/Ticket');
    const ticket = new Ticket({
      userId: userId || req.user._id,
      userName: userName || req.user.owner_name || 'Client',
      userEmail: userEmail || req.user.email || 'client@example.com',
      subject: subject,
      description: description,
      category: checklist.service_name,
      checklistId: checklist._id,
      priority: 'High'
    });
    await ticket.save();

    // 3. Notify the assigned staff and client manager
    const Notification = require('../models/Notification');
    
    // Notify Client Manager (ensure it's not the client themselves)
    if (
      checklist.created_by &&
      checklist.client_id &&
      checklist.created_by.toString() !== checklist.client_id.toString()
    ) {
      await Notification.create({
        client_id: checklist.created_by,
        title: 'New Support Ticket',
        message: `Client raised a support ticket for ${checklist.service_name}: ${subject}`,
        type: 'status_update',
        order_id: checklist._id
      });
    }

    // Notify Filing Staff (ensure it's not the client and not the same as created_by)
    if (
      checklist.assigned_to && 
      checklist.client_id &&
      checklist.assigned_to.toString() !== checklist.client_id.toString() &&
      (!checklist.created_by || checklist.assigned_to.toString() !== checklist.created_by.toString())
    ) {
      await Notification.create({
        client_id: checklist.assigned_to,
        title: 'New Support Ticket',
        message: `Client raised a support ticket for ${checklist.service_name}: ${subject}`,
        type: 'status_update',
        order_id: checklist._id
      });
    }

    res.status(201).json({ success: true, message: 'Support ticket created successfully', ticket, checklist });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a financial log directly to a checklist
// @desc    Upload an expense bill and extract amount/transaction ID
// @route   POST /api/checklists/:id/items/:itemId/expense
// @access  Private (Admin, Client Manager, Staff)
const uploadExpenseBill = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    
    const checklist = await Checklist.findById(id);

    if (!checklist) {
      return res.status(404).json({ success: false, message: 'Checklist not found' });
    }

    // Must be admin, manager, or assigned filing staff
    const isAdminOrManager = req.user.role === 'admin' || req.user.role === 'manager' || req.user.role === 'client_manager' || req.user.role === 'account_manager';
    const isAssignedStaff = checklist.assigned_to && checklist.assigned_to.toString() === req.user._id.toString();

    if (!isAdminOrManager && !isAssignedStaff) {
      return res.status(403).json({ success: false, message: 'Not authorized to upload expense bill' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No bill image provided' });
    }

    const item = checklist.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Checklist item not found' });
    }

    // Extract amount and transaction ID via Gemini
    const keys = [
      process.env.GEMINI_API_KEY1,
      process.env.GEMINI_API_KEY2,
      process.env.GEMINI_API_KEY3
    ].filter(Boolean);

    if (keys.length === 0) {
      return res.status(500).json({ success: false, message: 'No Gemini API keys found' });
    }

    const base64Data = req.file.buffer.toString('base64');
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: req.file.mimetype
      },
    };

    const prompt = `You are an expert OCR AI that extracts the total paid amount and transaction ID from a receipt, bill, or payment screenshot.
Return ONLY a valid JSON object with no markdown formatting or extra text:
{
  "amount": <number or null>,
  "transactionId": "<string or null>"
}
Ensure the amount is a raw number (e.g., 5000, not "5,000" or "Rs 5000").
Extract the transaction ID (often labeled as UTR, Ref No, Transaction ID, UPI Ref, etc.).
If a field is not found, set it to null.`;

    let extractedAmount = 0;
    let extractedTransactionId = null;
    let lastError = null;

    for (const key of keys) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
        
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const jsonText = response.text();
        
        let cleanJsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        const details = JSON.parse(cleanJsonText);
        
        if (details) {
          if (typeof details.amount === 'number') extractedAmount = details.amount;
          if (details.transactionId) extractedTransactionId = String(details.transactionId).trim();
        }
        break; // Success, exit loop
      } catch (error) {
        console.warn(`Key failed for expense OCR, trying next... Error: ${error.message}`);
        lastError = error;
      }
    }

    // Uniqueness validation if a transaction ID was found
    if (extractedTransactionId) {
      const existingTransaction = await Checklist.findOne({
         $or: [
             { 'items.expense.transactionId': extractedTransactionId },
             { 'financialLogs.transactionId': extractedTransactionId }
         ]
      });
      
      if (existingTransaction) {
         return res.status(400).json({ 
           success: false, 
           message: `Duplicate Transaction ID detected: ${extractedTransactionId}. This bill has already been uploaded.` 
         });
      }
    }

    // Upload to Document model
    const doc = await Document.create({
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      data: req.file.buffer, // Using memory storage buffer
      uploadedBy: req.user._id
    });
    
    const billUrl = `/api/documents/${doc._id}`;

    // Update the item
    if (!item.expense) {
      item.expense = {};
    }
    item.expense.billUrl = billUrl;
    item.expense.amount = extractedAmount;
    item.expense.transactionId = extractedTransactionId || '';
    item.expense.paymentTimestamp = new Date(); // automatically use current time
    item.expense.uploadedAt = new Date();

    await checklist.save();

    res.json({
      success: true,
      message: 'Expense bill uploaded successfully',
      data: item.expense
    });

  } catch (error) {
    console.error('uploadExpenseBill Error:', error);
    res.status(500).json({ success: false, message: 'Failed to process expense bill' });
  }
};

const addFinancialLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentType, amount, transactionId, paymentTimestamp, isVerified } = req.body;

    const checklist = await Checklist.findById(id);
    if (!checklist) {
      return res.status(404).json({ success: false, message: 'Checklist not found' });
    }

    if (!checklist.financialLogs) {
      checklist.financialLogs = [];
    }

    checklist.financialLogs.push({
      paymentType: paymentType || 'installment',
      amount: Number(amount) || 0,
      transactionId: transactionId || '',
      paymentTimestamp: paymentTimestamp ? new Date(paymentTimestamp) : new Date(),
      isVerified: Boolean(isVerified)
    });

    if (paymentType && paymentType.toLowerCase().includes('advance')) {
      checklist.advanceAmountPaid = (checklist.advanceAmountPaid || 0) + Number(amount);
    } else {
      // By default add to advanceAmountPaid to reflect total paid, but maybe it's just 'amountPaid' conceptually.
      // We'll just add it to advanceAmountPaid so the UI shows total paid.
      checklist.advanceAmountPaid = (checklist.advanceAmountPaid || 0) + Number(amount);
    }

    await checklist.save();

    // Try to sync with ServiceOrder
    try {
      const ServiceOrder = require('../models/ServiceOrder');
      const order = await ServiceOrder.findOne({ 
        clientUid: checklist.client_id, 
        serviceType: checklist.service_name 
      }).sort({ createdAt: -1 });

      if (order) {
        if (!order.financialLogs) order.financialLogs = [];
        order.financialLogs.push({
          paymentType: paymentType || 'installment',
          amount: Number(amount) || 0,
          transactionId: transactionId || '',
          paymentTimestamp: paymentTimestamp ? new Date(paymentTimestamp) : new Date(),
          isVerified: Boolean(isVerified)
        });
        order.advanceAmountPaid = (order.advanceAmountPaid || 0) + Number(amount);
        await order.save();
      }
    } catch(e) {
      console.error('ServiceOrder sync error from checklist:', e);
    }

    const populated = await Checklist.findById(id)
      .populate('client_id', 'custom_client_id owner_name company_name email onboarding_documents')
      .populate('assigned_to', 'owner_name email role')
      .populate('assigned_team', 'name')
      .populate('created_by', 'owner_name email role')
      .populate('items.checkedBy', 'owner_name');

    res.status(201).json({ success: true, checklist: populated });
  } catch (error) {
    console.error('Error adding financial log to checklist:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createChecklist,
  getChecklists,
  getMyChecklists,
  toggleChecklistItem,
  addChecklistItem,
  updateChecklist,
  uploadRequestedDocuments,
  uploadFinalDocuments,
  deleteFinalDocument,
  reuploadFinalDocument,
  createSupportTicketForChecklist,
  addFinancialLog,
  uploadExpenseBill
};

// @desc    Get all expense claims for payment tracker
// @route   GET /api/checklists/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const compId = req.user.company_id._id || req.user.company_id;
    let query = { company_id: compId, 'items.expense.billUrl': { $type: 'string' } };
    
    // If filing staff, only show checklists assigned to them where they might have uploaded expenses
    // Ideally we should filter the specific items they uploaded, but for now filtering by checklist assignment is standard here.
    if (req.user.role === 'filling_staff') {
      query.assigned_to = req.user._id;
    }

    const checklists = await Checklist.find(query).populate('client_id', 'name custom_id');
    
    let expenses = [];
    
    checklists.forEach(cl => {
      cl.items.forEach(item => {
        if (item.expense && item.expense.billUrl) {
          expenses.push({
            checklistId: cl._id,
            itemId: item._id,
            custom_service_id: cl.custom_service_id,
            client_name: cl.client_id ? cl.client_id.name : 'Unknown',
            client_custom_id: cl.client_id ? cl.client_id.custom_id : 'Unknown',
            service_name: cl.service_name,
            item_title: item.title,
            amount: item.expense.amount,
            transactionId: item.expense.transactionId,
            billUrl: item.expense.billUrl,
            uploadedAt: item.expense.uploadedAt,
            reimbursementStatus: item.expense.reimbursementStatus || 'pending'
          });
        }
      });
    });
    
    // Sort by uploadedAt descending
    expenses.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    res.status(200).json({ success: true, expenses });
  } catch (error) {
    console.error('getExpenses Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
  }
};

// @desc    Mark an expense claim as paid
// @route   POST /api/checklists/:id/items/:itemId/reimburse
// @access  Private (Admin, Manager)
const markExpensePaid = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    
    const checklist = await Checklist.findById(id);
    if (!checklist) {
      return res.status(404).json({ success: false, message: 'Checklist not found' });
    }

    const item = checklist.items.id(itemId);
    if (!item || !item.expense) {
      return res.status(404).json({ success: false, message: 'Expense not found on this item' });
    }

    item.expense.reimbursementStatus = 'paid';
    await checklist.save();

    res.status(200).json({ success: true, message: 'Expense marked as paid' });
  } catch (error) {
    console.error('markExpensePaid Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update expense status' });
  }
};

module.exports.getExpenses = getExpenses;
module.exports.markExpensePaid = markExpensePaid;
