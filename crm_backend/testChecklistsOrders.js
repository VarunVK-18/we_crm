const mongoose = require('mongoose');
require('dotenv').config();
const Checklist = require('./models/Checklist');
const ServiceOrder = require('./models/ServiceOrder');

async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/');
  
  const checklists = await Checklist.find({ service_name: { $regex: /PF/i } }).lean();
  console.log("CHECKLISTS FOR PF:");
  checklists.forEach(c => console.log(`- ID: ${c._id}, Client: ${c.client_id}, Status: ${c.status}, Assigned: ${c.assigned_to}`));

  const orders = await ServiceOrder.find({ serviceType: { $regex: /PF/i } }).lean();
  console.log("\nORDERS FOR PF:");
  orders.forEach(o => console.log(`- ID: ${o._id}, Client: ${o.clientUid}, Status: ${o.status}, Stage: ${o.stage}, Expert: ${o.assignedExpert}`));
  
  process.exit(0);
}
test();
