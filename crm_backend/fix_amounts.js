const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const ServiceOrder = require('./models/ServiceOrder');
const Checklist = require('./models/Checklist');

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const checklists = await Checklist.find({ financialLogs: { $exists: true, $not: {$size: 0} } });
  let fixedC = 0;
  for (let c of checklists) {
    const sum = c.financialLogs.reduce((acc, log) => acc + (log.amount || 0), 0);
    if (c.advanceAmountPaid !== sum) {
      console.log(`Fixing checklist ${c._id} advanceAmountPaid from ${c.advanceAmountPaid} to ${sum}`);
      c.advanceAmountPaid = sum;
      await c.save();
      fixedC++;
    }
  }

  const orders = await ServiceOrder.find({ financialLogs: { $exists: true, $not: {$size: 0} } });
  let fixedO = 0;
  for (let o of orders) {
    const sum = o.financialLogs.reduce((acc, log) => acc + (log.amount || 0), 0);
    if (o.advanceAmountPaid !== sum) {
      console.log(`Fixing order ${o._id} advanceAmountPaid from ${o.advanceAmountPaid} to ${sum}`);
      o.advanceAmountPaid = sum;
      await o.save();
      fixedO++;
    }
  }

  console.log(`Fixed ${fixedC} checklists and ${fixedO} orders.`);
  mongoose.disconnect();
}

fix();
