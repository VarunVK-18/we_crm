require('dotenv').config();
const mongoose = require('mongoose');
const Checklist = require('./models/Checklist');
const User = require('./models/User');
const Company = require('./models/Company');
const Document = require('./models/Document');
const ComplianceReminder = require('./models/ComplianceReminder');
const complianceController = require('./controllers/complianceController');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const req = {
    params: { userId: '6a14d54836696dbf53f938d8' } // I need the actual user ID
  };
  
  // Let's just find the user ID from the Checklist
  const cl = await Checklist.findOne({ 'final_documents.0': { $exists: true } });
  if (cl) {
    req.params.userId = cl.client_id;
    console.log("Found client_id:", cl.client_id);
    
    let responseData = null;
    const res = {
      status: (code) => ({
        json: (data) => {
          console.log(`Response ${code}:`, JSON.stringify(data, null, 2));
          responseData = data;
        }
      })
    };

    await complianceController.getUserComplianceReminders(req, res);
  } else {
    console.log("No checklists with final docs.");
  }

  process.exit(0);
}

test();
