const mongoose = require('mongoose');
const BucketRequest = require('./models/BucketRequest');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/we-crm').then(async () => {
  const reqs = await BucketRequest.find({}).sort({createdAt: -1}).limit(5).lean();
  console.log(JSON.stringify(reqs, null, 2));
  process.exit();
}).catch(console.error);
