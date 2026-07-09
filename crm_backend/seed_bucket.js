const mongoose = require('mongoose');
require('dotenv').config();
const BucketRequest = require('./models/BucketRequest');

async function seedData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    // Find one existing request to copy valid company_id and client_id
    const existingReq = await BucketRequest.findOne();
    if (!existingReq) {
      console.log('No existing BucketRequest found to use as a template. Cannot seed.');
      process.exit(1);
    }

    console.log(`Using company_id: ${existingReq.company_id} and client_id: ${existingReq.client_id}`);

    const newRequests = [];
    for (let i = 1; i <= 60; i++) {
      newRequests.push({
        company_id: existingReq.company_id,
        client_id: existingReq.client_id,
        service_name: `Test Service ${i}`,
        status: 'open',
        source: 'dealvoice',
        client_name: `Dummy Client ${i}`,
        client_phone: `123456789${(i%10)}`,
        client_email: `dummy${i}@example.com`,
        client_company_name: `Dummy Corp ${i}`,
        dealvoice_client_id: `DUMMY-${1000 + i}`,
      });
    }

    await BucketRequest.insertMany(newRequests);
    console.log('Successfully inserted 60 dummy Bucket Requests.');

  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

seedData();
