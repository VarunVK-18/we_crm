const mongoose = require('mongoose');
const Document = require('./models/Document');
require('dotenv').config();
const uri = 'mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/';
mongoose.connect(uri).then(async () => {
  const doc = await Document.findOne();
  if(doc) {
    console.log('Filename:', doc.filename);
    console.log('Content-Type:', doc.contentType);
    console.log('Buffer length:', doc.data.length);
    console.log('First 20 bytes:', doc.data.slice(0, 20).toString('hex'));
    console.log('First 20 bytes ascii:', doc.data.slice(0, 20).toString('ascii'));
  } else {
    console.log('No documents found.');
  }
  process.exit(0);
});
