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
            _id: doc._id || doc.document_id, // Use document ID
            serviceName: checklist.service_name + (doc.name ? ` (${doc.name})` : ''),
            entityName: checklist.company_id ? checklist.company_id.company_name : 'Default Entity',
            daysLeft,
            status
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
    const manualReminders = await ComplianceReminder.find({ clientUid: userId });

    // 2. Fetch dynamic compliance reminders from completed checklists
    const completedChecklists = await Checklist.find({ client_id: userId, status: 'completed' })
      .populate('company_id', 'company_name');

    const dynamicReminders = getDynamicReminders(completedChecklists);

    // 3. Merge and sort
    const reminders = [...manualReminders, ...dynamicReminders].sort((a, b) => a.daysLeft - b.daysLeft);

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
    const clients = await User.find({ company_id: companyId, role: 'customer' }).select('_id');
    const clientIds = clients.map(client => client._id.toString());

    // 2. Fetch manual reminders for these clients
    const manualReminders = await ComplianceReminder.find({ clientUid: { $in: clientIds } });

    // 3. Fetch dynamic compliance reminders from completed checklists for this company
    const completedChecklists = await Checklist.find({ company_id: companyId, status: 'completed' })
      .populate('company_id', 'company_name');

    const dynamicReminders = getDynamicReminders(completedChecklists);

    // 4. Merge and sort
    const reminders = [...manualReminders, ...dynamicReminders].sort((a, b) => a.daysLeft - b.daysLeft);

    res.status(200).json({ reminders });
  } catch (error) {
    console.error('Error fetching company compliance reminders:', error);
    res.status(500).json({ message: 'Server error while fetching company compliance reminders.', error: error.message });
  }
};

