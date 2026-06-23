const mongoose = require('mongoose');
const User = require('./crm_backend/models/User');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/we_crm');
  const user = await User.findOne({ role: 'customer' });
  if (user && user.client_entities && user.client_entities.length > 0) {
    console.log(JSON.stringify(user.client_entities, null, 2));
  } else {
    console.log("No customer with client_entities found.");
  }
  mongoose.disconnect();
}

test().catch(console.error);
