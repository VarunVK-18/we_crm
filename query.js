const mongoose = require('mongoose');
const User = require('./crm_backend/models/User');
const Team = require('./crm_backend/models/Team');

mongoose.connect('mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/').then(async () => {
  const teams = await Team.find({}).populate('manager_id');
  console.log(teams.map(t => t.name + ' - ' + (t.manager_id ? t.manager_id.owner_name : 'No Manager')));
  process.exit(0);
});
