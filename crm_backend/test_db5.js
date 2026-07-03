require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);
const Checklist = mongoose.model('Checklist', new mongoose.Schema({}, { strict: false, collection: 'checklists' }));
Checklist.find({}).sort({createdAt: -1}).limit(5).then(docs => {
  docs.forEach(doc => {
    console.log('ID:', doc._id);
    console.log('custom_service_id:', doc.custom_service_id);
    console.log('createdAt:', doc.createdAt);
  });
  process.exit(0);
});
