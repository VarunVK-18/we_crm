const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = 'mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/';

async function test() {
  await mongoose.connect(MONGO_URI);
  const users = await User.find({ "client_entities.0": { $exists: true } });
  if (users.length > 0) {
    console.log(`Found ${users.length} users with client_entities.`);
    for (const u of users) {
      console.log(`User: ${u.email}`);
      console.log(JSON.stringify(u.client_entities, null, 2));
    }
  } else {
    console.log("No users with client_entities found.");
  }
  mongoose.disconnect();
}

test().catch(console.error);
