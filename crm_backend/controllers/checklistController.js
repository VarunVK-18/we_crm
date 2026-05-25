const Checklist = require('../models/Checklist');
const User = require('../models/User');
const { logActivity } = require('../middleware/rbac');

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
      parsedItems = raw.map(label => ({ label, isChecked: false }));
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
      .populate('client_id', 'owner_name company_name email')
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
      // See checklists they created
      filter.created_by = req.user._id;
    }
    // admin sees all (no extra filter)

    // Also allow filtering by client_id query param
    if (req.query.client_id) {
      filter.client_id = req.query.client_id;
    }

    const checklists = await Checklist.find(filter)
      .populate('client_id', 'owner_name company_name email')
      .populate('assigned_to', 'owner_name email role')
      .populate('created_by', 'owner_name email role')
      .populate('items.checkedBy', 'owner_name')
      .sort({ createdAt: -1 });

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
      .populate('client_id', 'owner_name company_name email')
      .populate('assigned_to', 'owner_name email role')
      .populate('created_by', 'owner_name email role')
      .populate('items.checkedBy', 'owner_name');

    await logActivity(
      req.user._id,
      'checklist_item_toggled',
      `${item.isChecked ? 'Checked' : 'Unchecked'} item '${item.label}' on checklist for service '${checklist.service_name}'`,
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
    const { label } = req.body;

    if (!label) {
      return res.status(400).json({ success: false, message: 'Item label is required' });
    }

    const checklist = await Checklist.findById(id);
    if (!checklist) {
      return res.status(404).json({ success: false, message: 'Checklist not found' });
    }

    checklist.items.push({ label, isChecked: false });
    await checklist.save();

    const populated = await Checklist.findById(id)
      .populate('client_id', 'owner_name company_name email')
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
    const { assigned_to, notes } = req.body;

    const checklist = await Checklist.findById(id);
    if (!checklist) {
      return res.status(404).json({ success: false, message: 'Checklist not found' });
    }

    if (assigned_to !== undefined) checklist.assigned_to = assigned_to || null;
    if (notes !== undefined) checklist.notes = notes;
    await checklist.save();

    const populated = await Checklist.findById(id)
      .populate('client_id', 'owner_name company_name email')
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
      .select('service_name status items notes assigned_to created_by createdAt updatedAt')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, checklists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload requested documents from customer app
// @route   POST /api/checklists/:id/upload-documents
// @access  Private (Customer)
const uploadRequestedDocuments = async (req, res) => {
  try {
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
      req.files.forEach(f => {
        // Try to match file fieldname with requested document name
        const docName = f.fieldname;
        const requestedDocIndex = checklist.requested_documents.findIndex(d => d.name === docName);
        
        if (requestedDocIndex !== -1) {
          checklist.requested_documents[requestedDocIndex].fileUrl = `uploads/${f.filename}`;
          checklist.requested_documents[requestedDocIndex].isUploaded = true;
          checklist.requested_documents[requestedDocIndex].uploadedAt = new Date();
        } else {
          // If customer uploads something not explicitly requested, add it anyway
          checklist.requested_documents.push({
            name: docName,
            fileUrl: `uploads/${f.filename}`,
            isUploaded: true,
            uploadedAt: new Date()
          });
        }
      });
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

module.exports = {
  createChecklist,
  getChecklists,
  getMyChecklists,
  updateChecklist,
  toggleChecklistItem,
  addChecklistItem,
  uploadRequestedDocuments
};
