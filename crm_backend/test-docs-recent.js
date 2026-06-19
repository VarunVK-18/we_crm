const mongoose = require('mongoose');
const Document = require('./models/Document');
require('dotenv').config();
const uri = 'mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/';
mongoose.connect(uri).then(async () => {
  const docs = await Document.find().sort({createdAt: -1}).limit(5);
  for(let doc of docs) {
    console.log('Filename:', doc.filename);
    console.log('Content-Type:', doc.contentType);
    console.log('Buffer length:', doc.data.length);
    console.log('First 50 bytes ascii:', doc.data.slice(0, 50).toString('ascii'));
    console.log('First 20 bytes hex:', doc.data.slice(0, 20).toString('hex'));
    console.log('---');
  }
  process.exit(0);
});
