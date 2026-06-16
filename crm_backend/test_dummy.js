const mongoose = require('mongoose');
const User = require('./models/User');
const ComplianceTask = require('./models/ComplianceTask');
const Checklist = require('./models/Checklist');
require('dotenv').config();

async function testQuery() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const dummyUser = await User.findOne({ email: 'dummy@gmail.com' });
  console.log("Dummy role:", dummyUser.role);
  
  const authorizedClients = await User.find({
    $or: [
        { assigned_to: dummyUser._id },
        { created_by: dummyUser._id, assigned_to: null }
    ]
  }).select('_id');
  const authorizedClientIds = authorizedClients.map(c => c._id);
  console.log("Dummy authorized clients:", authorizedClientIds);

  const authorizedChecklists = await Checklist.find({
    $or: [
        { assigned_to: dummyUser._id },
        { client_id: { $in: authorizedClientIds }, assigned_to: null }
    ]
  }).select('_id');
  const authorizedChecklistIds = authorizedChecklists.map(c => c._id);
  console.log("Dummy authorized checklists:", authorizedChecklistIds);

  let taskFilter = {};
  if (dummyUser.company_id) {
    taskFilter.companyId = dummyUser.company_id;
  }
  taskFilter.$or = [
      { checklistId: { $in: authorizedChecklistIds } },
      { clientUid: { $in: authorizedClientIds }, checklistId: { $exists: false } },
      { clientUid: { $in: authorizedClientIds }, checklistId: null }
  ];

  const tasks = await ComplianceTask.find(taskFilter).lean();
  console.log("Tasks found for dummy:", tasks.length);
  
  console.log("Task Filter was:", JSON.stringify(taskFilter));

  process.exit(0);
}

testQuery();
