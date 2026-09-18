const mongoose = require('mongoose');
const EntityProfile = require('./models/EntityProfile');

mongoose.connect('mongodb://127.0.0.1:27017/we_crm')
  .then(async () => {
    const profiles = await EntityProfile.find({});
    console.log(JSON.stringify(profiles, null, 2));
    process.exit(0);
  });
