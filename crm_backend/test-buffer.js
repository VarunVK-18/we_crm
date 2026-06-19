const mongoose = require('mongoose');
const Document = require('./models/Document');
require('dotenv').config();
const uri = 'mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/';
mongoose.connect(uri).then(async () => {
  const doc = await Document.findOne();
  if(doc) {
    console.log(Buffer.isBuffer(doc.data)); // true or false?
    console.log(doc.data.constructor.name);
  }
  process.exit(0);
});
