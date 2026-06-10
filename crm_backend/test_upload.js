const mongoose = require('mongoose');
const User = require('./models/User');
const Document = require('./models/Document');
require('dotenv').config();

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');
  const user = await User.findOne();
  if (!user) {
    console.log('No user found');
    process.exit(1);
  }
  console.log('Testing with user:', user._id);
  
  try {
    const doc = await Document.create({
      filename: 'test.png',
      contentType: 'image/png',
      data: Buffer.from('test data'),
      uploadedBy: user._id
    });
    console.log('Doc created:', doc._id);
    user.profile_image = `api/documents/${doc._id}`;
    await user.save();
    console.log('User saved');

    user.profile_image = '';
    await user.save();
    console.log('User profile image removed');
  } catch (e) {
    console.error('Error:', e);
  }
  process.exit(0);
}
test();
