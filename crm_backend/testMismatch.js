const mongoose = require('mongoose');
require('dotenv').config();
const Checklist = require('./models/Checklist');
const ServiceOrder = require('./models/ServiceOrder');
const User = require('./models/User');

async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/');
  
  const orders = await ServiceOrder.find({ stage: { $ne: 'completed' } }).lean();
  let mismatchCount = 0;
  
  for (const order of orders) {
    if (order.assignedExpert && order.assignedExpert !== 'To be assigned') {
      const expert = await User.findOne({ owner_name: order.assignedExpert }).lean();
      
      const checklist = await Checklist.findOne({
        client_id: order.clientUid,
        service_name: order.serviceType
      }).populate('assigned_to').lean();
      
      if (!checklist) {
        console.log(`MISMATCH: No Checklist for Order '${order.serviceType}'`);
        mismatchCount++;
      } else {
        if (!checklist.assigned_to) {
          console.log(`MISMATCH: Checklist '${order.serviceType}' is unassigned, but Order is assigned to ${order.assignedExpert}`);
          mismatchCount++;
        } else if (expert && checklist.assigned_to._id.toString() !== expert._id.toString()) {
          console.log(`MISMATCH: Checklist '${order.serviceType}' assigned to ${checklist.assigned_to.owner_name} (${checklist.assigned_to.role}), but Order assigned to ${expert.owner_name} (${expert.role})`);
          mismatchCount++;
        }
      }
    }
  }
  
  console.log(`Total mismatches: ${mismatchCount}`);
  process.exit(0);
}
test();
