const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Find a checklist to test with
  const checklist = await mongoose.connection.db.collection('checklists').findOne({ "status": { $ne: 'completed' } });
  if (!checklist) {
    console.log("No active checklists found");
    process.exit(0);
  }
  console.log(`Testing with checklist: ${checklist._id}, user: ${checklist.client_id}`);

  // Create a dummy file
  const testFilePath = path.join(__dirname, 'test_doc.txt');
  fs.writeFileSync(testFilePath, 'Hello World');

  // Make request
  const form = new FormData();
  form.append('Aadhaar Card', fs.createReadStream(testFilePath)); // Use a likely requested doc name

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`http://localhost:5001/api/checklists/${checklist._id}/upload-documents`, {
      method: 'POST',
      body: form,
      headers: {
        'x-user-id': checklist.client_id.toString(),
        ...form.getHeaders()
      }
    });

    const body = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Body: ${body}`);
  } catch (err) {
    console.error(err);
  } finally {
    fs.unlinkSync(testFilePath);
    process.exit(0);
  }
}
run();
