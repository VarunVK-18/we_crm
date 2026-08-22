const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/we_crm';

mongoose.connect(mongoURI).then(async () => {
  const Checklist = require('./models/Checklist');
  const items = await Checklist.find({ service_name: 'Copyright Registration' }).sort({ updatedAt: -1 }).limit(5);
  for (const item of items) {
    console.log(`ID: ${item._id}, status: ${item.status}, form_submitted: ${item.form_submitted}, clientFormSubmitted: ${item.details?.clientFormSubmitted}, action_required: ${item.action_required}`);
  }
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
