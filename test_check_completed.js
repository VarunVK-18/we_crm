const mongoose = require('mongoose');
require('dotenv').config({ path: './crm_backend/.env' });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.");
  const User = require('./crm_backend/models/User');
  const Checklist = require('./crm_backend/models/Checklist');
  const ServiceOrder = require('./crm_backend/models/ServiceOrder');

  const clients = await User.find({ role: 'customer' }).limit(5);
  for (const client of clients) {
    console.log("Client:", client.company_name || client.name, client._id);
    const orders = await ServiceOrder.find({ clientUid: client._id.toString() });
    console.log("  Orders:", orders.length);
    const checklists = await Checklist.find({ client_id: client._id });
    console.log("  Checklists:", checklists.map(c => ({ name: c.service_name, status: c.status })));
  }
  process.exit(0);
}
check();
