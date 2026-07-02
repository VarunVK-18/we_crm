require('dotenv').config();
const mongoose = require('mongoose');
const Certificate = require('./models/Certificate');

async function fixCertificates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/');
    console.log('Connected to MongoDB');

    const result = await Certificate.updateMany(
      { renewalStatus: 'Renewal Processing' },
      { $set: { renewalStatus: 'Active', latestRenewalChecklistId: undefined } }
    );

    console.log(`Successfully fixed ${result.modifiedCount} stuck certificates!`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

fixCertificates();
