require('dotenv').config();
const mongoose = require('mongoose');
const Checklist = require('./models/Checklist');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const cl = await Checklist.findOne({ 'final_documents.0': { $exists: true } });
  if (cl) {
    const doc = cl.final_documents[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15); // 15 days in the future
    doc.expiry_date = futureDate;
    
    await cl.save();
    console.log("Updated expiry date to:", futureDate);
  }

  process.exit(0);
}

test();
