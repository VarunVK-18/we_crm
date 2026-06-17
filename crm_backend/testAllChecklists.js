const mongoose = require('mongoose');
require('dotenv').config();
const Checklist = require('./models/Checklist');

async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/');
  
  const checklists = await Checklist.find()
    .populate('assigned_to', 'owner_name email role phone')
    .lean();
    
  for (let c of checklists) {
    if (c.assigned_to) {
      console.log(`Checklist: [${c.service_name}], Assigned to: ${c.assigned_to.owner_name}, Role: ${c.assigned_to.role}`);
    } else {
      console.log(`Checklist: [${c.service_name}], Unassigned`);
    }
  }
  
  process.exit(0);
}
test();
