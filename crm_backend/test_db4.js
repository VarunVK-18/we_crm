require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);
const Checklist = mongoose.model('Checklist', new mongoose.Schema({}, { strict: false, collection: 'checklists' }));
Checklist.findOne({}).then(doc => {
  if (doc) console.log(doc.createdAt);
  process.exit(0);
});
