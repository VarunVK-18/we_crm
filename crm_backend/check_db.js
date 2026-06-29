const mongoose = require('mongoose');
require('dotenv').config();
const BucketRequest = require('./models/BucketRequest');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected');
    const buckets = await BucketRequest.find().sort({createdAt: -1}).limit(5);
    console.log('Buckets:', buckets);
    
    const admin = await User.findOne({role: 'admin'});
    console.log('Admin company_id:', admin.company_id);
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
