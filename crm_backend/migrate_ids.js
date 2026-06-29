const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Checklist = require('./models/Checklist');
const { getNextClientId, getNextServiceId } = require('./utils/counterHelper');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected for Migration');

    // 1. Migrate Users (Clients)
    const clients = await User.find({ role: 'customer', custom_client_id: { $in: [null, ''] } });
    console.log(`Found ${clients.length} clients needing custom_client_id`);
    for (const client of clients) {
      if (client.company_id) {
        try {
          const custom_client_id = await getNextClientId(client.company_id);
          client.custom_client_id = custom_client_id;
          await client.save();
          console.log(`Updated client ${client.email} with ${custom_client_id}`);
        } catch (e) {
          console.error(`Failed for client ${client.email}:`, e.message);
        }
      }
    }

    // 2. Migrate Services (Checklists)
    const checklists = await Checklist.find({ custom_service_id: { $in: [null, ''] } });
    console.log(`Found ${checklists.length} checklists needing custom_service_id`);
    for (const checklist of checklists) {
      if (checklist.company_id) {
        try {
          const custom_service_id = await getNextServiceId(checklist.company_id);
          checklist.custom_service_id = custom_service_id;
          await checklist.save();
          console.log(`Updated checklist ${checklist._id} with ${custom_service_id}`);
        } catch (e) {
          console.error(`Failed for checklist ${checklist._id}:`, e.message);
        }
      }
    }

    console.log('Migration completed.');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
