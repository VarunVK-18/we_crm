require('dotenv').config();
const mongoose = require('mongoose');
const Subscription = require('./models/Subscription');
const Checklist = require('./models/Checklist');

mongoose.connect(process.env.MONGO_URI, { dbName: 'test' })
  .then(async () => {
    const subs = await Subscription.find({}).populate('checklist_id').lean();
    console.log(JSON.stringify(subs, null, 2));
    process.exit(0);
  }).catch(e => {
    console.error(e);
    process.exit(1);
  });
