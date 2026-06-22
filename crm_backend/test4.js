const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/')
  .then(async () => {
    const ComplianceTask = require('./models/ComplianceTask');
    const Checklist = require('./models/Checklist');
    const User = require('./models/User');

    const reqUser = {
      _id: '6a30eeb7d7c1c1cd9c70fe67', // manager
      role: 'client_manager',
      company_id: '6a30ee12d7c1c1cd9c70fe65'
    };

    let taskFilter = {};
    let checklistFilter = { 'final_documents.0': { $exists: true } };

    if (reqUser.company_id) {
        taskFilter.companyId = reqUser.company_id;
        checklistFilter.company_id = reqUser.company_id;
    }

    let clientFilter = { role: 'customer' };
    clientFilter.$or = [
      { assigned_to: reqUser._id },
      { created_by: reqUser._id, assigned_to: null }
    ];

    const authorizedClients = await User.find(clientFilter).select('_id');
    const authorizedClientIds = authorizedClients.map(c => c._id);

    const authorizedChecklists = await Checklist.find({
        $or: [
            { assigned_to: reqUser._id },
            { client_id: { $in: authorizedClientIds }, assigned_to: null }
        ]
    }).select('_id');
    const authorizedChecklistIds = authorizedChecklists.map(c => c._id);

    taskFilter.$or = [
        { checklistId: { $in: authorizedChecklistIds } },
        { clientUid: { $in: authorizedClientIds }, checklistId: { $exists: false } },
        { clientUid: { $in: authorizedClientIds }, checklistId: null }
    ];

    const tasks = await ComplianceTask.find(taskFilter).lean();
    console.log('tasks found:', tasks.length);

    process.exit(0);
  }).catch(console.error);
