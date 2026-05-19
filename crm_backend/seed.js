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
    const adminEmail = 'admin@wecrm.com';

    // 1. Delete existing users to ensure clean seeding
    console.log(`🧹 Checking for existing test user: ${testEmail}...`);
    const existingUser = await User.findOne({ email: testEmail });
    if (existingUser) {
      await User.deleteOne({ email: testEmail });
      console.log('🗑️ Existing test user deleted successfully.');
    }

    console.log(`🧹 Checking for existing admin user: ${adminEmail}...`);
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      await User.deleteOne({ email: adminEmail });
      console.log('🗑️ Existing admin user deleted successfully.');
    }

    // 2. Create the fresh test customer user
    console.log('👤 Creating fresh test customer user account...');
    const newUser = await User.create({
      owner_name: 'Test CRM User',
      email: testEmail,
      password: '123456',
      phone: '1234567890',
      role: 'customer',
      company_name: 'WE CRM Inc.',
      services: ['CRM Setup', 'Lead Tracking']
    });

    // 3. Create the fresh admin user
    console.log('👤 Creating fresh admin user account...');
    const newAdmin = await User.create({
      owner_name: 'WeCRM Administrator',
      email: adminEmail,
      password: 'admin123456',
      phone: '0987654321',
      role: 'admin',
      company_name: 'WE CRM Inc.',
      services: ['All Portal Access', 'System Administration']
    });

    console.log('====================================');
    console.log('🎉 Test Users seeded successfully!');
    console.log('------------------------------------');
    console.log(`📧 Customer Email   : ${newUser.email}`);
    console.log('🔑 Customer Password: 123');
    console.log('------------------------------------');
    console.log(`📧 Admin Email      : ${newAdmin.email}`);
    console.log('🔑 Admin Password   : admin');
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
