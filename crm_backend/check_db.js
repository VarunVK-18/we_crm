const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm').then(async () => {
  const Checklist = require('./models/Checklist');
  const checklists = await Checklist.find({});
  let uploaded = false;
  for (const c of checklists) {
    if (c.requested_documents) {
      for (const d of c.requested_documents) {
        if (d.isUploaded) {
          console.log(`Uploaded document found in checklist ${c._id}: ${d.name}`);
          uploaded = true;
        }
      }
    }
  }
  if (!uploaded) console.log("No uploaded documents found.");
  process.exit(0);
});
