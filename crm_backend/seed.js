const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const ServiceOrder = require('./models/ServiceOrder');
const DscOrder = require('./models/DscOrder');
const ComplianceReminder = require('./models/ComplianceReminder');

const seedUser = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error('❌ Error: MONGO_URI is not defined in your .env file!');
    process.exit(1);
  }

  try {
    console.log('====================================');
    console.log('⏳ Connecting to MongoDB to seed user, service orders, and DSC orders...');
    await mongoose.connect(mongoURI);
    console.log('🚀 Connected successfully!');
    console.log('====================================');

    const testEmail = 'test@wecrm.com';
    const adminEmail = 'admin@wecrm.com';

    // 1. Delete existing users to ensure clean seeding
    console.log(`🧹 Checking for existing test user: ${testEmail}...`);
    const existingUser = await User.findOne({ email: testEmail });
    if (existingUser) {
      // Clean up existing service orders and DSC orders for this user
      await ServiceOrder.deleteMany({ clientUid: existingUser._id.toString() });
      await DscOrder.deleteMany({ clientUid: existingUser._id.toString() });
      await ComplianceReminder.deleteMany({ clientUid: existingUser._id.toString() });
      await User.deleteOne({ email: testEmail });
      console.log('🗑️ Existing test user, service orders, DSC orders, and compliance reminders deleted.');
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

    // 4. Seed default Service Orders for the test customer
    console.log('📦 Seeding default service orders for the customer...');
    const userIdStr = newUser._id.toString();

    await ServiceOrder.create([
      {
        clientUid: userIdStr,
        entityName: 'Proprietorship',
        serviceType: 'GST Registration',
        companyName: 'Wealth Empires Tech',
        status: 'active',
        stage: 'workInProgress',
        steps: [
          {
            title: 'Requirement Gathering',
            description: 'Collecting all mandatory documents.',
            isCompleted: true,
            completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
          },
          {
            title: 'GST Portal Application',
            description: 'Submitting details to the GST portal.',
            isCompleted: false
          },
          {
            title: 'Certificate Issuance',
            description: 'Obtaining verified GSTIN document.',
            isCompleted: false
          }
        ],
        assignedExpert: 'Rajesh Kumar',
        expertPhone: '918072286963'
      },
      {
        clientUid: userIdStr,
        entityName: 'Company',
        serviceType: 'Trademark Registration',
        companyName: 'Acme Corp',
        status: 'notInitialized',
        stage: 'reqReceived',
        steps: [
          {
            title: 'Document Collection',
            description: 'Provide utility bill and digital signature.',
            isCompleted: false
          },
          {
            title: 'Search Report Creation',
            description: 'Analyze potential duplicate names.',
            isCompleted: false
          },
          {
            title: 'Form TM-A Filing',
            description: 'Officially file application with IP India.',
            isCompleted: false
          }
        ],
        assignedExpert: 'To be assigned',
        expertPhone: ''
      }
    ]);

    // 5. Seed default DSC Orders for the test customer
    console.log('📦 Seeding default DSC orders for the customer...');
    await DscOrder.create([
      {
        clientUid: userIdStr,
        name: 'KUMAR S',
        type: 'Class 3 (Signature + Encryption)',
        stage: 'Pending Verification',
        progress: 0.6,
        isCompleted: false
      },
      {
        clientUid: userIdStr,
        name: 'ANITA REDDY',
        type: 'Class 3 (Signature Only)',
        stage: 'Certificate Issued',
        progress: 1.0,
        isCompleted: true
      }
    ]);

    // 6. Seed default Compliance Reminders for the test customer
    console.log('📦 Seeding default Compliance Reminders for the customer...');
    await ComplianceReminder.create([
      {
        clientUid: userIdStr,
        serviceName: 'GST Monthly Filing',
        entityName: 'Wealth Empires Tech',
        daysLeft: 2,
        status: 'expiringSoon'
      },
      {
        clientUid: userIdStr,
        serviceName: 'MCA Annual Return',
        entityName: 'Wealth Empires Tech',
        daysLeft: 1,
        status: 'urgent'
      },
      {
        clientUid: userIdStr,
        serviceName: 'Trademark Protection',
        entityName: 'Wealth Empires Tech',
        daysLeft: 0,
        status: 'expired'
      },
      {
        clientUid: userIdStr,
        serviceName: 'Income Tax Audit',
        entityName: 'Acme Corp',
        daysLeft: 5,
        status: 'expiringSoon'
      },
      {
        clientUid: userIdStr,
        serviceName: 'LLP Form 8 Filing',
        entityName: 'Acme Corp',
        daysLeft: 1,
        status: 'urgent'
      },
      {
        clientUid: userIdStr,
        serviceName: 'Professional Tax',
        entityName: 'Acme Corp',
        daysLeft: 0,
        status: 'expired'
      }
    ]);

    console.log('====================================');
    console.log('🎉 Test Users, Service Orders, DSC Orders & Compliance Reminders seeded successfully!');
    console.log('------------------------------------');
    console.log(`📧 Customer Email   : ${newUser.email}`);
    console.log('🔑 Customer Password: 123456');
    console.log('------------------------------------');
    console.log(`📧 Admin Email      : ${newAdmin.email}`);
    console.log('🔑 Admin Password   : admin123456');
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
