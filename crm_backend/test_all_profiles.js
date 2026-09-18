require('dotenv').config();
const mongoose = require('mongoose');
const EntityProfile = require('./models/EntityProfile');

mongoose.connect(process.env.MONGO_URI, { dbName: 'test' })
  .then(async () => {
    const profiles = await EntityProfile.find({}).lean();
    console.log(JSON.stringify(profiles.map(p => p.entityName), null, 2));
    process.exit(0);
  });
