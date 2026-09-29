const mongoose = require('mongoose');
const EntityProfile = require('./models/EntityProfile');
mongoose.connect('mongodb://193.203.161.48:27018/').then(async () => {
  const p = await EntityProfile.findOne({ incorpCertDocId: { $exists: true } });
  console.log(JSON.stringify(p, null, 2));
  process.exit(0);
});
