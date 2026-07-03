const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.");
  const User = require('./models/User');
  const ServiceOrder = require('./models/ServiceOrder');

  const clients = await User.find({ role: 'customer' }).limit(5);
  for (const client of clients) {
    console.log("Client:", client.company_name || client.name, client._id);
    const orders = await ServiceOrder.find({ clientUid: client._id.toString() });
    console.log("  Orders:", orders.map(o => ({ type: o.serviceType, status: o.status, stage: o.stage })));
  }
  process.exit(0);
}
check();
