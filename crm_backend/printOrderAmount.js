const mongoose = require('mongoose');
require('dotenv').config();
const ServiceOrder = require('./models/ServiceOrder');

async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/');
  const o = await ServiceOrder.findOne({ serviceType: { $regex: /PF/i } }).lean();
  console.log(`PF Order: Deal Amount: ${o.dealClosedAmount}, Advance Paid: ${o.advanceAmountPaid}`);
  process.exit(0);
}
test();
