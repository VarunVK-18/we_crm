const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/we_crm';

mongoose.connect(mongoURI).then(async () => {
  const Checklist = require('./models/Checklist');
  const items = await Checklist.find({ status: 'pending', form_submitted: false });
  for (const item of items) {
    if (item.details && item.details.clientFormSubmitted) {
      item.details.clientFormSubmitted = false;
      item.action_required = true;
      item.markModified('details');
      await item.save();
      console.log(`Reverted: ${item.service_name}`);
    }
  }
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
