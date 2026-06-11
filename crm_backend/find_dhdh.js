const mongoose = require('mongoose');

async function findDhdh() {
  await mongoose.connect('mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/');
  const db = mongoose.connection.db;
  
  const collections = await db.listCollections().toArray();
  for (const collection of collections) {
    const collName = collection.name;
    const items = await db.collection(collName).find({}).toArray();
    for (const item of items) {
      const str = JSON.stringify(item).toLowerCase();
      if (str.includes('dhdh')) {
        console.log(`\nFound 'dhdh' in collection '${collName}' with _id: ${item._id}`);
        console.log(JSON.stringify(item, null, 2));
      }
    }
  }
  
  await mongoose.disconnect();
}

findDhdh().catch(console.error);
