const mongoose = require('mongoose');
require('dotenv').config();
const Checklist = require('./models/Checklist');
const User = require('./models/User');

const SERVICES_WITH_FORMS = [
  'DPIIT', 'Private Limited', 'Trade mark', 'Trademark', 'LLP', 'MSME',
  'MSME Certification', 'GST', 'GST Registration', 'GST Compliance', 'GST Filing',
  'GST Cancellation', 'ISO', 'ISO Registration', 'ISO Certification', 'FSSAI',
  'FSSAI Registration', 'FSSAI Food License', 'One Person Company', 'LIE Registration',
  'LIE', 'BIS Registration', 'BIS', 'MCA Compliance', 'DSC', 'IEC Registration',
  'IEC', 'Proprietorship', 'TDS', 'PAN, TAN', 'PF Registration', 'PF',
  'Patent Registration', 'Patent'
];

async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/');
  
  const checklists = await Checklist.find()
    .populate('assigned_to', 'owner_name email role phone')
    .lean();
    
  console.log(`Found ${checklists.length} checklists`);
  
  for (let c of checklists) {
    const serviceNameLower = c.service_name ? c.service_name.toLowerCase() : '';
    const requiresForm = SERVICES_WITH_FORMS.some(s => serviceNameLower.includes(s.toLowerCase()));
    
    console.log(`Checklist [${c.service_name}] - Assigned: ${c.assigned_to ? 'YES' : 'NO'} - RequiresForm: ${requiresForm}`);
    
    if (requiresForm && c.assigned_to) {
      console.log(`--> isActionStep would be injected for ${c.service_name}!`);
    }
  }
  
  process.exit(0);
}
test();
