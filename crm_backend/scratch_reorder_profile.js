const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const form = await db.collection('formschemas').findOne({ serviceName: 'Company Profile' });
  
  if (form && form.fields) {
    // 1. Remove declaration
    form.fields = form.fields.filter(f => f.name !== 'declaration');
    
    // 2. Move documents to the end
    const docsIndex = form.fields.findIndex(f => f.name === 'documents');
    if (docsIndex !== -1) {
      const docsGroup = form.fields.splice(docsIndex, 1)[0];
      form.fields.push(docsGroup);
    }
    
    await db.collection('formschemas').updateOne({ _id: form._id }, { $set: { fields: form.fields } });
    console.log('Successfully updated Company Profile form (Removed declaration, moved documents to end)');
  }
  
  mongoose.disconnect();
}
run();
