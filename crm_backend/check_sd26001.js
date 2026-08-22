const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/we_crm';

mongoose.connect(mongoURI).then(async () => {
  const Checklist = require('./models/Checklist');
  const items = await Checklist.find({ custom_service_id: 'SD26001' });
  console.log('Found:', items.map(i => i.service_name));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
