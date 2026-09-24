const mongoose = require('mongoose');
require('dotenv').config();

async function runTests() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB.");

  const User = require('./models/User');
  const EntityProfile = require('./models/EntityProfile');
  const authController = require('./controllers/authController');

  // Create a mock user
  const mockUser = new User({
    name: 'Test User',
    owner_name: 'Owner',
    mobile: '1234567890',
    email: 'test_mca_profile@example.com',
    password: 'password123',
    client_entities: [
      {
        entityName: 'Test Company LLC',
        entityType: 'Company'
      }
    ]
  });
  await mockUser.save();
  console.log("Created mock user:", mockUser._id);

  let results = [];

  // Helper for mock res
  const createMockRes = (resolve) => {
    return {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        resolve({ code: this.statusCode, data });
      }
    };
  };

  try {
    // TEST CASE 1: Submit new dynamic fields
    const req1 = {
      user: { _id: mockUser._id },
      body: {
        entityName: 'Test Company LLC',
        bankName: 'HDFC Bank',
        accountNumber: '123456789012',
        ifscCode: 'HDFC0001234',
        accountType: 'Current',
        authorizedCapital: 1000000,
        paidUpCapital: 500000,
        constitutionType: 'Private Limited',
        natureOfBusiness: 'Software Development',
        employeeCount: 50
      },
      files: []
    };

    let res1Data = await new Promise(resolve => {
      authController.updateMcaProfile(req1, createMockRes(resolve));
    });

    // Check DB
    const updatedUser = await User.findById(mockUser._id);
    const profile = await EntityProfile.findOne({ uid: mockUser._id, entityName: 'Test Company LLC' });

    const tc1 = {
      testCase: "TC1: Map Dynamic Fields to client_entities",
      status: "PASS",
      details: ""
    };

    const entity = updatedUser.client_entities[0];
    if (entity.bank_details?.bankName !== 'HDFC Bank') { tc1.status = 'FAIL'; tc1.details += 'bankName mismatch. '; }
    if (Number(entity.authorised_capital) !== 1000000) { tc1.status = 'FAIL'; tc1.details += 'authorisedCapital mismatch. '; }
    if (entity.company_type !== 'Private Limited') { tc1.status = 'FAIL'; tc1.details += 'constitutionType mismatch. '; }

    if (tc1.status === "PASS") tc1.details = "Fields successfully mapped to user.client_entities";
    results.push(tc1);

    // TEST CASE 2: Dynamic fields are in dynamicProfileData
    const tc2 = {
      testCase: "TC2: Store dynamic fields in EntityProfile.dynamicProfileData",
      status: "PASS",
      details: ""
    };
    if (profile.dynamicProfileData.employeeCount !== 50) { tc2.status = 'FAIL'; tc2.details += 'employeeCount missing. '; }
    if (profile.dynamicProfileData.bankName !== 'HDFC Bank') { tc2.status = 'FAIL'; tc2.details += 'bankName missing. '; }
    if (tc2.status === "PASS") tc2.details = "All dynamic fields successfully populated in EntityProfile.";
    results.push(tc2);

    // TEST CASE 3: Compliance Score remains constrained
    const tc3 = {
      testCase: "TC3: Compliance Score rules (Max 50)",
      status: "PASS",
      details: ""
    };
    if (profile.complianceScore > 50) { tc3.status = 'FAIL'; tc3.details += `Score is ${profile.complianceScore}. `; }
    if (tc3.status === "PASS") tc3.details = `Score correctly calculated as ${profile.complianceScore} based on core rules.`;
    results.push(tc3);

    // TEST CASE 4: Profile Completion Percentage dynamically recalculates
    const tc4 = {
      testCase: "TC4: Circular Progress Bar (Completion Percentage)",
      status: "PASS",
      details: ""
    };
    if (profile.profileCompletionPercentage === 0) { tc4.status = 'FAIL'; tc4.details += 'Percentage is 0. '; }
    if (tc4.status === "PASS") tc4.details = `Progress bar recalculated to ${profile.profileCompletionPercentage}% with new fields.`;
    results.push(tc4);

  } catch (err) {
    console.error(err);
  } finally {
    // Cleanup
    await User.findByIdAndDelete(mockUser._id);
    await EntityProfile.findOneAndDelete({ uid: mockUser._id });
    await mongoose.disconnect();

    console.log(JSON.stringify(results, null, 2));
  }
}

runTests();
