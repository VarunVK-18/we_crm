const mongoose = require('mongoose');
require('dotenv').config();
const BucketRequest = require('./models/BucketRequest');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected');
    
    const admin = await User.findOne({role: 'admin'});
    const correctCompanyId = admin.company_id;
    console.log('Correct company_id:', correctCompanyId);
    
    // Update Users created via intake
    const updatedUsers = await User.updateMany(
      { company_id: '6a30ee12d7c1c1cd9c70fe65' },
      { $set: { company_id: correctCompanyId } }
    );
    console.log('Users updated:', updatedUsers.modifiedCount);

    // Update BucketRequests
    const updatedBuckets = await BucketRequest.updateMany(
      { company_id: '6a30ee12d7c1c1cd9c70fe65' },
      { $set: { company_id: correctCompanyId } }
    );
    console.log('BucketRequests updated:', updatedBuckets.modifiedCount);
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
