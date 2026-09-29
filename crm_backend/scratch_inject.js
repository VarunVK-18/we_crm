const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = 'mongodb://193.203.161.48:27018/';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');
  
  // The User model might be in crm_backend/models/User.js
  const User = require('./models/User');
  
  const companyName = 'Two Star Lifts And Escalator Private Limited';
  
  const user = await User.findOne({ company_name: new RegExp(companyName, 'i') });
  
  if (!user) {
    console.log('User not found for company:', companyName);
    process.exit(1);
  }
  
  console.log('Found user:', user.owner_name, user.company_name);
  
  // Inject some data to test
  user.pan = 'ABCDE1234F';
  user.gstin = '22AAAAA0000A1Z5';
  user.address = '123 Test Address, Test City, 123456';
  user.phone = '9876543210';
  user.email = 'test@twostar.com';
  
  // Inject documents
  user.onboarding_documents = [
    { name: 'PAN', fileUrl: 'https://example.com/pan.pdf', uploadedAt: new Date() },
    { name: 'GST Certificate', fileUrl: 'https://example.com/gst.pdf', uploadedAt: new Date() },
    { name: 'Address Proof', fileUrl: 'https://example.com/address.pdf', uploadedAt: new Date() },
    { name: 'Incorporation', fileUrl: 'https://example.com/incorp.pdf', uploadedAt: new Date() },
    { name: 'Two Star Lifts And Escalator Private Limited - cancelled cheque', fileUrl: 'https://example.com/cheque.jpg', uploadedAt: new Date() }
  ];
  
  await user.save();
  console.log('User updated successfully!');
  
  process.exit(0);
}

run().catch(console.error);
