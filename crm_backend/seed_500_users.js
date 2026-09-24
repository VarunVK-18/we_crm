require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'test' });
    console.log('Connected to MongoDB');

    const usersToInsert = [];
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123', salt);

    for (let i = 1; i <= 500; i++) {
      usersToInsert.push({
        name: `User ${i}`,
        email: `user${i}@gmail.com`,
        password: hashedPassword,
        role: 'customer',
        owner_name: `User ${i}`,
        phone: `9999900${i.toString().padStart(3, '0')}`,
        status: 'active'
      });
    }

    for (let i = 0; i < usersToInsert.length; i += 100) {
      const batch = usersToInsert.slice(i, i + 100);
      try {
        await User.insertMany(batch, { ordered: false });
        console.log(`Inserted batch ${i / 100 + 1}`);
      } catch (err) {
        console.log(`Some duplicates ignored in batch ${i / 100 + 1}`);
      }
    }

    console.log('Successfully seeded 500 users!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
