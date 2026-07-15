const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('./models/User');
  const result = await User.updateMany(
    { mca_profile_completed: true, coi_file: "" },
    { $set: { mca_profile_completed: false } }
  );
  console.log('Modified count:', result.modifiedCount);
  process.exit(0);
}
run();
