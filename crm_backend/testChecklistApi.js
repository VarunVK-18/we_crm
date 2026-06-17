const mongoose = require('mongoose');
require('dotenv').config();
const Checklist = require('./models/Checklist');

async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/');
  
  // Create a mock express app to test the controller logic locally
  const { getMyChecklists } = require('./controllers/checklistController');
  const req = { headers: { 'x-user-id': '6a30efe2d7c1c1cd9c70fe6b' } };
  const res = {
    status: (code) => ({
      json: (data) => {
        if (!data.checklists) {
          console.log("Error from API:", data);
          process.exit(1);
        }
        const pf = data.checklists.find(c => c.service_name && c.service_name.includes('PF'));
        if (pf) {
          console.log("Found PF Checklist!");
          console.log("Assigned to:", pf.assigned_to ? pf.assigned_to.role : "null");
          console.log("Action required:", pf.action_required);
          console.log("Items:");
          pf.items.forEach(i => console.log(`- ${i.title} (ActionStep: ${i.isActionStep})`));
        } else {
          console.log("PF Checklist not found in API response!");
        }
        process.exit(0);
      }
    })
  };
  
  await getMyChecklists(req, res);
}
test();
