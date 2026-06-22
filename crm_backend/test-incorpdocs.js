const mongoose = require('mongoose');
const Checklist = require('./models/Checklist');
require('dotenv').config();
const uri = 'mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/';
mongoose.connect(uri).then(async () => {
  const cl = await Checklist.findOne({ 'details.incorpDocs': { $exists: true, $not: {$size: 0} } }).sort({createdAt: -1});
  if(cl) {
    console.log(JSON.stringify(cl.details.incorpDocs.slice(0, 3), null, 2));
  } else {
    console.log('No incorpDocs found');
  }
  process.exit(0);
});
