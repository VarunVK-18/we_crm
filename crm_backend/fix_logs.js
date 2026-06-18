const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const ServiceOrder = require('./models/ServiceOrder');
const Checklist = require('./models/Checklist');

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const orders = await ServiceOrder.find({ financialLogs: { $exists: true, $not: {$size: 0} } });
  let fixed = 0;
  for (let order of orders) {
    const checklists = await Checklist.find({
      cleint_id: order.cleintUid,
      service_name: order.serviceType
    });
    for (let c of checklists) {
      if (!c.financialLogs || c.financialLogs.length === 0) {
        c.financialLogs = order.financialLogs;
        await c.save();
        fixed++;
      }
    }
  }
  console.log('Fixed', fixed, 'checklists');
  mongoose.disconnect();
}

fix();
