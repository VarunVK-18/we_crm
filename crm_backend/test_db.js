const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/we_crm');
const Checklist = mongoose.model('Checklist', new mongoose.Schema({}, { strict: false }));
Checklist.findOne({}).then(doc => {
  console.log(JSON.stringify(doc, null, 2));
  process.exit(0);
});
