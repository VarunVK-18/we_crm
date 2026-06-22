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

    let checklistFilter = { 
      company_id: companyId, 
      'final_documents.0': { $exists: true } 
    };

    const authorizedChecklists = await Checklist.find({
        $or: [
            { assigned_to: reqUser._id },
            { client_id: { $in: clientIds } } // FIXED HERE
        ]
    }).select('_id');
    console.log('authorized checklists found:', authorizedChecklists.length);
    checklistFilter._id = { $in: authorizedChecklists.map(c => c._id) };

    const completedChecklists = await Checklist.find(checklistFilter)
      .populate('company_id', 'company_name')
      .populate('client_id', 'owner_name company_name');
    
    console.log('completedChecklists found:', completedChecklists.length);
    
    process.exit(0);
  }).catch(console.error);
