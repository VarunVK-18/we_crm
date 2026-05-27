require('dotenv').config();
const mongoose = require('mongoose');
const Checklist = require('./models/Checklist');
const User = require('./models/User');
const Company = require('./models/Company');
const Document = require('./models/Document');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  // Get first checklist with final documents
  const cl = await Checklist.findOne({ 'final_documents.0': { $exists: true } }).populate('company_id').populate('client_id');
  console.log("Checklist with final_docs:", cl ? {
    id: cl._id,
    service: cl.service_name,
    status: cl.status,
    company: cl.company_id ? cl.company_id.company_name : 'No company',
    client: cl.client_id ? cl.client_id.owner_name : 'No client',
    final_docs: cl.final_documents
  } : "None found");

  // Get all checklists to see if there are any
  const allCl = await Checklist.find({});
  console.log("Total checklists:", allCl.length);
  for(let c of allCl) {
    if(c.final_documents && c.final_documents.length > 0) {
      console.log(`- ${c.service_name} (status: ${c.status}) has ${c.final_documents.length} final documents`);
    } else {
      console.log(`- ${c.service_name} (status: ${c.status}) has 0 final documents`);
    }
  }

  process.exit(0);
}

test();
