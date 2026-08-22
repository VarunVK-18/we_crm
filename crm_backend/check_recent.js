const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/we_crm';

mongoose.connect(mongoURI).then(async () => {
  const Checklist = require('./models/Checklist');
  const items = await Checklist.find().sort({ updatedAt: -1 }).limit(5);
  items.forEach(i => {
    console.log(`ID: ${i._id}, Svc: ${i.service_name}, custom_id: ${i.custom_service_id}, act_req: ${i.action_required}, submitted: ${i.details?.clientFormSubmitted}, updated: ${i.updatedAt}`);
  });
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
