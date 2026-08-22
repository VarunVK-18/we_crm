const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/we_crm';

mongoose.connect(mongoURI).then(async () => {
  const Checklist = require('./models/Checklist');
  const items = await Checklist.find({ form_submitted: true });
  for (const item of items) {
    if (!item.details) item.details = {};
    item.details.clientFormSubmitted = true;
    item.action_required = false;
    item.markModified('details');
    await item.save();
  }
  
  // also fix seeded items that are 'workInProgress'
  const inProgress = await Checklist.find({ status: 'in_progress' });
  for (const item of inProgress) {
    if (!item.details) item.details = {};
    item.details.clientFormSubmitted = true;
    item.action_required = false;
    item.markModified('details');
    await item.save();
  }
  
  console.log('Fixed backward compatibility for action required');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
