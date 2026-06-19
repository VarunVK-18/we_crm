const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/')
  .then(async () => {
    const ComplianceReminder = require('./models/ComplianceReminder');
    const Checklist = require('./models/Checklist');
    const User = require('./models/User');

    const reqUser = {
      _id: '6a30eeb7d7c1c1cd9c70fe67', // manager
      role: 'client_manager'
    };
    const companyId = '6a30ee12d7c1c1cd9c70fe65';

    let clientFilter = { company_id: companyId, role: 'customer' };
    clientFilter.$or = [
      { assigned_to: reqUser._id },
      { created_by: reqUser._id, assigned_to: null }
    ];

    const clients = await User.find(clientFilter).select('_id owner_name company_name').lean();
    console.log('clients found:', clients.length);
    const clientIds = clients.map(c => c._id.toString());

    const manualReminders = await ComplianceReminder.find({ clientUid: { $in: clientIds } }).lean();
    console.log('manualReminders found:', manualReminders.length);
    
    process.exit(0);
  }).catch(console.error);
