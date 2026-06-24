const mongoose = require('mongoose');
const ComplianceTask = require('./models/ComplianceTask');

mongoose.connect('mongodb://127.0.0.1:27017/we_crm')
  .then(async () => {
    const tasks = await ComplianceTask.find().populate('clientUid');
    console.log(`Total tasks: ${tasks.length}`);
    if (tasks.length > 0) {
      console.log(`First task entity: ${tasks[0].entityName}, client: ${tasks[0].clientUid ? tasks[0].clientUid.owner_name : 'null'}, radar: ${tasks[0].clientUid ? tasks[0].clientUid.in_compliance_radar : 'N/A'}`);
    }
    process.exit(0);
  });
