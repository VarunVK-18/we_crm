const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = 'mongodb://193.203.161.48:27018/';

async function run() {
  await mongoose.connect(MONGO_URI);
  
  const User = require('./models/User');
  
  const companyName = 'Two Star Lifts And Escalator Private Limited';
  
  const user = await User.findOne({ company_name: new RegExp(companyName, 'i') });
  
  if (user) {
    user.email = 'nisrajesh23@gmail.com';
    await user.save();
    console.log(`Updated email back to: ${user.email}`);
  } else {
    console.log('User not found.');
  }
  
  process.exit(0);
}

run().catch(console.error);
