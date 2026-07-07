const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Checklist = require('./models/Checklist');
const { getNextServiceId } = require('./utils/counterHelper');

const mongoUri = process.env.MONGO_URI || "mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/";

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('Connected to MongoDB. Starting backfill...');

    const checklists = await Checklist.find({
      $or: [
        { custom_service_id: null },
        { custom_service_id: { $exists: false } },
        { custom_service_id: '' }
      ]
    });

    console.log(`Found ${checklists.length} checklists without custom_service_id.`);

    for (const checklist of checklists) {
      if (!checklist.company_id) {
        console.log(`Checklist ${checklist._id} has no company_id, skipping.`);
        continue;
      }
      try {
        const newServiceId = await getNextServiceId(checklist.company_id);
        checklist.custom_service_id = newServiceId;
        await checklist.save();
        console.log(`Updated checklist ${checklist._id} with custom_service_id: ${newServiceId}`);
      } catch (err) {
        console.error(`Failed to update checklist ${checklist._id}:`, err.message);
      }
    }

    console.log('Backfill completed successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
