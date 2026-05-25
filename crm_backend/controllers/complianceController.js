const ComplianceReminder = require('../models/ComplianceReminder');
const User = require('../models/User');

// Get all compliance reminders for a user
exports.getUserComplianceReminders = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }
    const reminders = await ComplianceReminder.find({ clientUid: userId }).sort({ daysLeft: 1 });
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
    const clients = await User.find({ company_id: companyId, role: 'customer' }).select('_id');
    const clientIds = clients.map(client => client._id.toString());
    const reminders = await ComplianceReminder.find({ clientUid: { $in: clientIds } }).sort({ daysLeft: 1 });
    res.status(200).json({ reminders });
  } catch (error) {
    console.error('Error fetching company compliance reminders:', error);
    res.status(500).json({ message: 'Server error while fetching company compliance reminders.', error: error.message });
  }
};

