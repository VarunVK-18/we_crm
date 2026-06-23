const mongoose = require('mongoose');
const User = require('./models/User');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/we_crm');
  const user = await User.findOne({ role: 'customer' });
  if (user) {
    user.client_entities = [{
      entityName: 'Test Company Pvt Ltd',
      entityType: 'Private Limited',
      cin: 'U12345MH2023PTC123456',
      pan: 'ABCDE1234F',
      trademarkApplicationNumber: 'TM-987654321',
      trademarkStatus: 'Examination Report Issued',
      trademarkCertificate: 'Pending',
      patentApplicationNumber: 'PAT-111',
      patentStatus: 'Filed'
    }];
    await user.save();
    console.log("Successfully added dummy client_entity to user:", user.email);
  } else {
    console.log("No customer found.");
  }
  mongoose.disconnect();
}

test().catch(console.error);
