const mongoose = require('mongoose');
require('dotenv').config();
const ServiceOrder = require('./models/ServiceOrder');
const User = require('./models/User');

async function seedData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    // Find a client to associate orders with
    const client = await User.findOne({ role: 'customer' });
    if (!client) {
      console.log('No client found to associate orders with.');
      process.exit(1);
    }

    console.log(`Using client ID: ${client._id} and company ID: ${client.company_id}`);

    const baseSteps = [
      { title: "Client Form Filling", description: "Ensure the client has submitted all necessary initial forms and details.", isCompleted: false },
      { title: "Prepare NOC", description: "Prepare No Objection Certificate.", isCompleted: false },
      { title: "Get Signed NOC", description: "Collect signed NOC from client.", isCompleted: false },
      { title: "Upload NOC to MCA", description: "Upload signed NOC in MCA portal.", isCompleted: false },
      { title: "Prepare DSC Forms", description: "Prepare DSC application.", isCompleted: false },
      { title: "Get Signed MCA Forms", description: "Obtain signatures for incorporation forms.", isCompleted: false },
      { title: "Prepare Incorporation Forms", description: "Prepare all MCA incorporation forms.", isCompleted: false },
      { title: "Reserved Name", description: "What was the Name of the Company is Reserving For", isCompleted: false },
      { title: "OTP Verification", description: "OTP Verification", isCompleted: false },
      { title: "Upload Signed MCA Forms", description: "Upload signed incorporation forms.", isCompleted: false },
      { title: "Upload PAN & TAN in CRM", description: "Upload PAN and TAN documents into CRM.", isCompleted: false },
      { title: "Collect Final MCA Documents", description: "Download Certificate of Incorporation and other approvals.", isCompleted: false },
      { title: "Upload MCA Documents in CRM", description: "Upload all approved MCA documents into CRM.", isCompleted: false },
      { title: "Prepare ADT-1", description: "Prepare ADT-1 filing.", isCompleted: false },
      { title: "Get Signed ADT-1", description: "Obtain signed ADT-1.", isCompleted: false },
      { title: "Upload ADT-1", description: "Upload ADT-1 to MCA.", isCompleted: false },
      { title: "Prepare INC-20A", description: "Prepare INC-20A filing.", isCompleted: false },
      { title: "Office Board Photograph", description: "Collect office board photographs (inside & outside).", isCompleted: false },
      { title: "Share Capital Bank Statement", description: "Collect bank statement showing capital contribution.", isCompleted: false },
      { title: "Get Signed INC-20A", description: "Collect signed INC-20A.", isCompleted: false },
      { title: "Upload INC-20A", description: "Upload signed INC-20A to MCA.", isCompleted: false },
      { title: "Post Incorporation Documents", description: "Upload all post-incorporation documents to CRM.", isCompleted: false },
      { title: "Initiate Bank Account Opening", description: "Start bank account opening process.", isCompleted: false },
      { title: "Upload Bank Account Details", description: "Record account number, IFSC, branch, etc.", isCompleted: false },
      { title: "Mark Incorporation Complete", description: "Close workflow after verification.", isCompleted: false }
    ];

    const newOrders = [];
    for (let i = 1; i <= 35; i++) {
      newOrders.push({
        clientUid: client._id.toString(),
        companyId: client.company_id,
        entityName: `Test Entity ${i}`,
        serviceType: `OPC`,
        companyName: ``,
        status: `active`,
        stage: `reqReceived`,
        steps: baseSteps,
        assignedExpert: `vijay`,
        expertPhone: `1111111111`,
        dealClosedAmount: 0,
        advanceAmountPaid: 0,
        details: {
          "Applicant Name": `KANNAPPAN ${i}`,
          "Applicant Email": `test${i}@gmail.com`,
          "Applicant Phone": `8248447592`,
          "Status": "Pending Client Form Submission",
          "Next Step": "Assign expert to unlock form for client",
          "Requirements": "",
          "entityName": `Test Entity ${i}`,
          "recommended_plan": "",
          "service_fee": 0
        },
        documents: [],
        turnover_category: "",
        recommended_plan: "",
        service_fee: 0,
        need_temporary: false,
        financialLogs: []
      });
    }

    await ServiceOrder.insertMany(newOrders);
    console.log('Successfully inserted 35 dummy Service Orders based on reference.');

  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

seedData();
