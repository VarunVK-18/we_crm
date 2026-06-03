const mongoose = require('mongoose');

async function fixDB() {
  await mongoose.connect('mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/');
  
  const orders = await mongoose.connection.collection('serviceorders').find({'serviceType': /png/}).toArray();
  for (let o of orders) {
    const newName = o.serviceType.replace(/ \([^)]+\.png\)/g, '');
    await mongoose.connection.collection('serviceorders').updateOne({_id: o._id}, {$set: {serviceType: newName}});
    console.log('Updated order', o._id, newName);
  }
  
  const checklists = await mongoose.connection.collection('checklists').find({'service_name': /png/}).toArray();
  for (let c of checklists) {
    const newName = c.service_name.replace(/ \([^)]+\.png\)/g, '');
    await mongoose.connection.collection('checklists').updateOne({_id: c._id}, {$set: {service_name: newName}});
    console.log('Updated checklist', c._id, newName);
  }
  
  process.exit(0);
}

fixDB().catch(console.error);
