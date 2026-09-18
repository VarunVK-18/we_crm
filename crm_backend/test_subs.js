const mongoose = require('mongoose');
const Subscription = require('./models/Subscription');

mongoose.connect('mongodb://127.0.0.1:27017/we_crm')
  .then(async () => {
    const subs = await Subscription.find({});
    console.log(JSON.stringify(subs, null, 2));
    process.exit(0);
  });
