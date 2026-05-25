const FilingTask = require('../models/FilingTask');
const User = require('../models/User');
const { logActivity } = require('../middleware/rbac');

// @desc    Create a new filing task
// @route   POST /api/tasks
// @access  Private (Admin, Account Manager)
const createTask = async (req, res) => {
  try {
    const { client_id, assigned_to, title, description } = req.body;
    if (!client_id || !title) {
      return res.status(400).json({ success: false, message: 'Client ID and title are required' });
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
    if (status) task.status = status;
    if (assigned_to !== undefined) task.assigned_to = assigned_to || null;
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
    const fileUrl = `uploads/${file.filename}`;

    task.documents.push({
      name: document_name,
      fileUrl
    });

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
