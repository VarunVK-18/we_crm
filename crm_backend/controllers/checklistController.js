const Checklist = require('../models/Checklist');
const User = require('../models/User');
const { logActivity } = require('../middleware/rbac');
const Document = require('../models/Document');

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

    const checklist = await Checklist.create({
      company_id: req.user.company_id,
      client_id,
      service_name,
      assigned_to: assigned_to || null,
      created_by: req.user._id,
      items: parsedItems,
      notes: notes || ''
    });

    await logActivity(
      req.user._id,
      'checklist_created',
      `Created checklist for service '${service_name}' for client '${client.owner_name}'`,
      req.user.company_id
    );

    const populated = await Checklist.findById(checklist._id)
      .populate('client_id', 'owner_name company_name email onboarding_documents')
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
      // See only checklists assigned to them
      filter.assigned_to = req.user._id;
    } else if (role === 'client_manager') {
      // See checklists for clients they created OR that are assigned to them
      // (auto-generated checklists have created_by = client._id, not the manager's)
      const myClients = await User.find({ created_by: req.user._id, role: 'customer' }).select('_id');
      const myClientIds = myClients.map(c => c._id);
      filter.$or = [
        { created_by: req.user._id },
        { assigned_to: req.user._id },
        { client_id: { $in: myClientIds } }
      ];
    }
    // admin sees all (no extra filter)

    // Also allow filtering by client_id query param
    if (req.query.client_id) {
      filter.client_id = req.query.client_id;
    }

    const checklists = await Checklist.find(filter)
      .populate('client_id', 'owner_name company_name email onboarding_documents')
      .populate('assigned_to', 'owner_name email role')
      .populate('created_by', 'owner_name email role')
      .populate('items.checkedBy', 'owner_name')
      .sort({ createdAt: -1 });

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
          console.log(`[DEBUG] Dynamically populated ${cl.items.length} items from template for checklist ID ${cl._id} (${cl.service_name})`);
        }
      }
    }

    res.status(200).json({ success: true, checklists });
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

    await checklist.save();

    const populated = await Checklist.findById(id)
      .populate('client_id', 'owner_name company_name email onboarding_documents')
      .populate('assigned_to', 'owner_name email role')
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
      .populate('client_id', 'owner_name company_name email onboarding_documents')
      .populate('assigned_to', 'owner_name email role')
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
    const { assigned_to, notes, stage, items, requested_documents, status, details } = req.body;

    const checklist = await Checklist.findById(id);
    if (!checklist) {
      return res.status(404).json({ success: false, message: 'Checklist not found' });
    }

    if (req.user.role === 'customer') {
      if (checklist.client_id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this checklist' });
      }
      if (details !== undefined) checklist.details = details;
    } else {
      if (assigned_to !== undefined) {
        checklist.assigned_to = assigned_to || null;
        if (assigned_to && checklist.service_name.includes('DPIIT')) {
          checklist.action_required = true;
        }
      }
      if (notes !== undefined) checklist.notes = notes;
      if (stage !== undefined) checklist.stage = stage;
      if (status !== undefined) checklist.status = status;
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
    }

    if (details !== undefined) {
      checklist.markModified('details');
    }

    await checklist.save();

    const populated = await Checklist.findById(id)
      .populate('client_id', 'owner_name company_name email onboarding_documents')
      .populate('assigned_to', 'owner_name email role')
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
      .select('service_name company_id status stage items requested_documents final_documents notes assigned_to created_by createdAt updatedAt dealClosedAmount advanceAmountPaid details action_required')
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
    
    const enrichedChecklists = checklistsPlain.map(c => {
      const order = serviceOrders.find(o => o.serviceType === c.service_name);
      const isDpiit = c.service_name && c.service_name.includes('DPIIT');
      
      let modifiedItems = c.items || [];
      if (isDpiit && c.assigned_to) {
        // Inject dynamic Step 1 for Action Required
        modifiedItems = [
          {
            title: "Provide Additional Details",
            description: "Please fill out the required form to begin the process.",
            isChecked: !c.action_required, // Checked if action is completed
            isActionStep: true
          },
          ...modifiedItems
        ];
      }

      return {
        ...c,
        items: modifiedItems,
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
        const requestedDocIndex = checklist.requested_documents.findIndex(d => d.name === docName);
        
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

// @desc    Upload final documents with expiry dates
// @route   POST /api/checklists/:id/final-documents
// @access  Private (Admin, Client Manager, Staff)
const uploadFinalDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    let { expiry_dates } = req.body;
    
    // Parse expiry_dates if it's sent as a JSON string
    if (typeof expiry_dates === 'string') {
      expiry_dates = JSON.parse(expiry_dates);
    }

    const checklist = await Checklist.findById(id);
    if (!checklist) {
      return res.status(404).json({ success: false, message: 'Checklist not found' });
    }

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const expiryDate = expiry_dates && expiry_dates[i] ? new Date(expiry_dates[i]) : new Date();
        
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
          expiry_date: expiryDate,
          uploadedAt: new Date()
        });
      }
      
      await checklist.save();
    }

    const populated = await Checklist.findById(id)
      .populate('client_id', 'owner_name company_name email onboarding_documents')
      .populate('assigned_to', 'owner_name email role')
      .populate('created_by', 'owner_name email role')
      .populate('items.checkedBy', 'owner_name');

    res.status(200).json({ success: true, checklist: populated });
  } catch (error) {
    console.error('Final Documents Upload Error:', error);
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
  uploadFinalDocuments
};
