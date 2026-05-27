const ComplianceReminder = require('../models/ComplianceReminder');
const User = require('../models/User');
const Checklist = require('../models/Checklist');

// Helper function to extract dynamic reminders from completed checklists
const getDynamicReminders = (checklists) => {
  const dynamicReminders = [];

  for (const checklist of checklists) {
    if (checklist.final_documents && checklist.final_documents.length > 0) {
      for (const doc of checklist.final_documents) {
        if (doc.expiry_date) {
          const daysLeft = Math.ceil((new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
          let status = 'expiringSoon';
          if (daysLeft < 0) status = 'expired';
          else if (daysLeft <= 7) status = 'urgent';

          dynamicReminders.push({
            _id: doc._id || doc.document_id,
            title: checklist.service_name + (doc.name ? ` (${doc.name})` : ''),
            dueDate: doc.expiry_date,
            daysLeft,
            status,
            entityName: checklist.company_id ? checklist.company_id.company_name : (checklist.client_id ? checklist.client_id.company_name : 'Individual'),
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
    const manualRemindersMapped = manualReminders.map(rem => ({
      _id: rem._id,
      title: rem.serviceName,
      dueDate: new Date(Date.now() + rem.daysLeft * 24 * 60 * 60 * 1000),
      daysLeft: rem.daysLeft,
      status: rem.status,
      client_id: {
        owner_name: client ? client.owner_name : 'Client',
        company_name: client ? client.company_name : 'Individual'
      }
    }));

    // 2. Fetch dynamic compliance reminders from checklists with final documents
    const completedChecklists = await Checklist.find({ client_id: userId, 'final_documents.0': { $exists: true } })
      .populate('company_id', 'company_name')
      .populate('client_id', 'owner_name company_name');

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
    const clients = await User.find({ company_id: companyId, role: 'customer' }).select('_id owner_name company_name').lean();
    const clientIds = clients.map(client => client._id.toString());

    const clientMap = {};
    clients.forEach(c => {
      clientMap[c._id.toString()] = c;
    });

    // 2. Fetch manual reminders for these clients
    const manualReminders = await ComplianceReminder.find({ clientUid: { $in: clientIds } }).lean();
    const manualRemindersMapped = manualReminders.map(rem => {
      const client = clientMap[rem.clientUid] || { owner_name: 'Client', company_name: 'Individual' };
      return {
        _id: rem._id,
        title: rem.serviceName,
        dueDate: new Date(Date.now() + rem.daysLeft * 24 * 60 * 60 * 1000),
        daysLeft: rem.daysLeft,
        status: rem.status,
        client_id: {
          owner_name: client.owner_name,
          company_name: client.company_name
        }
      };
    });

    // 3. Fetch dynamic compliance reminders from checklists with final documents for this company
    const completedChecklists = await Checklist.find({ company_id: companyId, 'final_documents.0': { $exists: true } })
      .populate('company_id', 'company_name')
      .populate('client_id', 'owner_name company_name');

    const dynamicReminders = getDynamicReminders(completedChecklists);

    // 4. Merge and sort
    const reminders = [...manualRemindersMapped, ...dynamicReminders].sort((a, b) => a.daysLeft - b.daysLeft);

    res.status(200).json({ reminders });
  } catch (error) {
    console.error('Error fetching company compliance reminders:', error);
    res.status(500).json({ message: 'Server error while fetching company compliance reminders.', error: error.message });
  }
};

