const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

const seedUser = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error('❌ Error: MONGO_URI is not defined in your .env file!');
    process.exit(1);
  }

  try {
    console.log('====================================');
    console.log('⏳ Connecting to MongoDB to seed user...');
    await mongoose.connect(mongoURI);
    console.log('🚀 Connected successfully!');
    console.log('====================================');

    const testEmail = 'test@wecrm.com';

    // 1. Delete the user if they already exist to ensure a fresh, clean credentials seed
    console.log(`🧹 Checking for existing test user: ${testEmail}...`);
    const existingUser = await User.findOne({ email: testEmail });
    if (existingUser) {
      await User.deleteOne({ email: testEmail });
      console.log('🗑️ Existing test user deleted successfully.');
    }

    // 2. Create the new test user (Password '123' will be automatically hashed by our User schema pre-save hook)
    console.log('👤 Creating fresh test user account...');
    const newUser = await User.create({
      owner_name: 'Test CRM User',
      email: testEmail,
      password: '123',
      phone: '1234567890',
      role: 'customer',
      company_name: 'WE CRM Inc.',
      services: ['CRM Setup', 'Lead Tracking']
    });

    console.log('====================================');
    console.log('🎉 Test User seeded successfully!');
    console.log('------------------------------------');
    console.log(`📧 Email   : ${newUser.email}`);
    console.log('🔑 Password: 123 (Encrypted safely in DB)');
    console.log(`🆔 ID      : ${newUser._id}`);
    console.log('====================================');

  } catch (error) {
    console.error('====================================');
    console.error('❌ Seeding Error:', error.message);
    console.error('====================================');
  } finally {
    // 3. Always disconnect clean from MongoDB
    await mongoose.disconnect();
    console.log('🔌 Disconnected clean from MongoDB.');
    process.exit(0);
  }
};

seedUser();
