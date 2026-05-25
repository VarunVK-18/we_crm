const mongoose = require('mongoose');
const mongoURI = 'mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/we_crm';

async function run() {
  await mongoose.connect(mongoURI);
  console.log('Connected!');
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (let col of collections) {
    const count = await mongoose.connection.db.collection(col.name).countDocuments();
    console.log(`${col.name}: ${count}`);
    if (count > 0) {
      const sample = await mongoose.connection.db.collection(col.name).findOne();
      console.log('Sample:', JSON.stringify(sample, null, 2));
    }
    console.log('-------------------');
  }
  process.exit(0);
}

run().catch(console.error);
