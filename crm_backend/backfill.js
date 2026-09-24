const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config(); 

async function runBackfill() {
  const uri = process.env.MONGO_URI || 'mongodb://193.203.161.48:27018/';
  console.log('Connecting to:', uri);
  await mongoose.connect(uri);
  
  const Checklist = require('./models/Checklist');
  require('./models/User');
  require('./models/EntityProfile');
  require('./models/Company');
  require('./models/Team');
  require('./models/DocumentTemplate');

  const { _syncProfileData } = require('./controllers/orderController');

  console.log('Finding submitted checklists...');
  // Find all checklists that have been submitted
  const checklists = await Checklist.find({ 
    $or: [
      { form_submitted: true },
      { 'details.clientFormSubmitted': true }
    ]
  });

  console.log(`Found ${checklists.length} submitted checklists.`);

  let successCount = 0;
  for (const order of checklists) {
    try {
      const details = order.details || {};
      
      let uploadedDocs = details.dynamicDocs || [];
      if (!uploadedDocs.length) {
         for (const [k, v] of Object.entries(details)) {
           if (k.toLowerCase().includes('doc') && Array.isArray(v)) {
              uploadedDocs = uploadedDocs.concat(v);
           }
         }
      }

      await _syncProfileData(order, details, uploadedDocs);
      successCount++;
    } catch (e) {
      console.error(`Error processing checklist ${order._id}:`, e.message);
    }
  }

  console.log(`Successfully processed ${successCount} out of ${checklists.length} checklists.`);
  process.exit(0);
}

runBackfill();
