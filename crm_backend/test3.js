const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/')
  .then(async () => {
    const ComplianceReminder = require('./models/ComplianceReminder');
    const Checklist = require('./models/Checklist');
    const User = require('./models/User');

    const reqUser = {
      _id: '...', // admin
      role: 'admin'
    };
    const companyId = '6a30ee12d7c1c1cd9c70fe65';

    let clientFilter = { company_id: companyId, role: 'customer' };

    const clients = await User.find(clientFilter).select('_id owner_name company_name').lean();
    console.log('admin clients found:', clients.length);
    const clientIds = clients.map(c => c._id.toString());

    let checklistFilter = { 
      company_id: companyId, 
      'final_documents.0': { $exists: true } 
    };
    checklistFilter.client_id = { $in: clientIds };

    const completedChecklists = await Checklist.find(checklistFilter)
      .populate('company_id', 'company_name')
      .populate('client_id', 'owner_name company_name');
    
    console.log('admin completedChecklists found:', completedChecklists.length);
    
    process.exit(0);
  }).catch(console.error);
