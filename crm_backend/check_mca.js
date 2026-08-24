const mongoose = require('mongoose');
const Checklist = require('./models/Checklist');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm');
  const checklist = await Checklist.findOne({ service_name: { $regex: /mca/i } }).sort({ createdAt: -1 });
  if (checklist) {
    console.log('Turnover Category:', checklist.turnover_category);
    console.log('Details:', JSON.stringify(checklist.details, null, 2));
  } else {
    console.log('No MCA order found');
  }
  process.exit();
}
check();
