const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/we_crm';

mongoose.connect(mongoURI).then(async () => {
  const Checklist = require('./models/Checklist');
  const items = await Checklist.find({ action_required: true });
  console.log('Action required true:', items.map(i => ({ id: i._id, service: i.service_name, action_required: i.action_required, details: i.details })));
  
  const items2 = await Checklist.find({ 'details.clientFormSubmitted': true });
  console.log('clientFormSubmitted true:', items2.map(i => ({ id: i._id, service: i.service_name, action_required: i.action_required, details: i.details })));
  
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
