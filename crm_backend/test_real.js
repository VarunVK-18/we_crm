require('dotenv').config();
const mongoose = require('mongoose');
const Subscription = require('./models/Subscription');

mongoose.connect(process.env.MONGO_URI, { dbName: 'we_crm_db' || process.env.DB_NAME })
  .then(async () => {
    const subs = await Subscription.find({}).populate('checklist_id').lean();
    console.log(JSON.stringify(subs, null, 2));
    process.exit(0);
  }).catch(e => {
    console.error(e);
    process.exit(1);
  });
