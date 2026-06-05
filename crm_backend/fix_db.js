const mongoose = require('mongoose');
const Checklist = require('./models/Checklist');

mongoose.connect('mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/').then(async () => {
  const res = await Checklist.updateMany(
    { service_name: /DPIIT/i, assigned_to: { $ne: null } },
    { action_required: true }
  );
  console.log('Fixed:', res);
  process.exit(0);
});
