require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const checkDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'test' });
    
    const count = await User.countDocuments({
      email: { $regex: '^user\\d+@gmail\\.com$' }
    });
    
    console.log(`Found ${count} dummy users in the database.`);
    
    const firstUser = await User.findOne({ email: 'user1@gmail.com' }).select('name email role password');
    console.log('Sample User 1:', firstUser);
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
checkDb();
