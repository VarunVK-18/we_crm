const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/');
  const client = await User.findOne({ role: 'customer' });
  
  if (!client) {
    console.log("No client found");
    process.exit(1);
  }
  
  http.get(`http://localhost:5001/api/checklists/client/${client._id}`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const parsed = JSON.parse(data);
      console.log(`Found ${parsed.checklists?.length || 0} checklists`);
      if (parsed.checklists) {
        parsed.checklists.forEach(c => {
          console.log(`\nChecklist: ${c.service_name}`);
          console.log(`Assigned: ${!!c.assigned_to}`);
          console.log(`Action Required: ${c.action_required}`);
          if (c.items && c.items.length > 0) {
            console.log(`First item isActionStep: ${c.items[0].isActionStep}`);
          } else {
            console.log(`No items found`);
          }
        });
      }
      process.exit(0);
    });
  }).on('error', (e) => {
    console.error(e);
    process.exit(1);
  });
}
test();
