const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  
  const forms = await db.collection('formschemas').find({}).toArray();
  let updatedCount = 0;

  for (const form of forms) {
    if (!form.fields) continue;

    // 1. Remove declaration group
    form.fields = form.fields.filter(f => f.name !== 'declaration');
    
    // 2. Move documents to the end
    const docsIndex = form.fields.findIndex(f => f.name === 'documents');
    if (docsIndex !== -1) {
      const docsGroup = form.fields.splice(docsIndex, 1)[0];
      form.fields.push(docsGroup);
    }
    
    await db.collection('formschemas').updateOne({ _id: form._id }, { $set: { fields: form.fields } });
    updatedCount++;
  }
  
  console.log(`Successfully updated ${updatedCount} forms (Removed declaration, moved documents to end)`);
  mongoose.disconnect();
}
run();
