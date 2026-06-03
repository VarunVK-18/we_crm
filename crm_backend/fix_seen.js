const mongoose = require('mongoose');

async function fixSeen() {
  await mongoose.connect('mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/');
  
  await mongoose.connection.collection('messages').updateMany(
    { seen: { $exists: false } },
    { $set: { seen: false } }
  );
  
  console.log('Updated undefined seen to false');
  process.exit(0);
}

fixSeen().catch(console.error);
