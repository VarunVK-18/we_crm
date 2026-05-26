require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const c of collections) {
    const doc = await mongoose.connection.db.collection(c.name).findOne({});
    if (doc) {
      console.log(`Collection ${c.name} fields:`, Object.keys(doc));
    }
  }
  process.exit(0);
}
run();
