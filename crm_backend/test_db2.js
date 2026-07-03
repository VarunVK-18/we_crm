const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/we_crm');
const Checklist = mongoose.model('Checklist', new mongoose.Schema({}, { strict: false, collection: 'checklists' }));
Checklist.findOne({}).then(doc => {
  console.log(Object.keys(doc.toObject()));
  process.exit(0);
});
