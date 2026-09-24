require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'test' });
    const dummyBatch = [{
        name: 'User 1',
        email: 'user1@gmail.com',
        password: 'Password123',
        role: 'customer',
        owner_name: 'User 1',
        phone: '9999900001',
        status: 'Active'
    }];
    await User.insertMany(dummyBatch);
    console.log('Success');
    process.exit(0);
  } catch (err) {
    console.error('Validation error:', err.message);
    process.exit(1);
  }
};
check();
