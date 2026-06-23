const mongoose = require('mongoose');
const User = require('./models/User');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/we_crm');
  const users = await User.find({}).select('email role owner_name');
  console.log(users);
  mongoose.disconnect();
}

test().catch(console.error);
