const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' }); // adjusted for running inside seed_forms directory

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedTdsForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const tdsSchema = {
      serviceName: 'TDS Return Filing', // using the name found in admin list
      title: 'Complete Details',
      subtitle: 'TDS Registration Form',
      fields: [
        {
          name: 'entityDetails',
          label: 'Applicant / Entity Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'entityType', label: 'Entity Type', type: 'dropdown', required: true, options: ['Proprietorship', 'Partnership Firm', 'LLP', 'Private Limited Company', 'Public Limited Company', 'HUF', 'Trust', 'Society', 'Other'] },
            { name: 'businessName', label: 'Business / Entity Name', type: 'text', required: true },
            { name: 'panNumber', label: 'PAN Number', type: 'text', required: true, description: 'Enter a valid PAN' },
            { name: 'mobileNumber', label: 'Mobile Number', type: 'phone', required: true, description: 'Exactly 10 digits' },
            { name: 'emailId', label: 'Email ID', type: 'email', required: true },
            { name: 'businessAddress', label: 'Business Address', type: 'text', required: true },
            { name: 'state', label: 'State', type: 'text', required: true },
            { name: 'pinCode', label: 'PIN Code', type: 'number', required: true, description: 'Exactly 6 digits' }
          ]
        },
        {
          name: 'tdsDetails',
          label: 'TDS Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'tanAvailable', label: 'TAN Available?', type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'tanNumber', label: 'TAN Number', type: 'text', required: true, visibilityConditionStr: '{"field": "tanAvailable", "equals": "Yes"}', description: 'Enter a valid TAN (e.g. ABCD12345E)' },
            { name: 'natureOfBusiness', label: 'Nature of Business / Profession', type: 'text', required: true },
            { name: 'natureOfPayments', label: 'Nature of Payments / TDS Applicable On', type: 'text', required: true },
            { name: 'employeeCount', label: 'Number of Employees / Deductees', type: 'number', required: false },
            { name: 'deductorType', label: 'TDS Deductor Type', type: 'dropdown', required: true, options: ['Company', 'Firm', 'Individual / Proprietor', 'HUF', 'Trust', 'Other'] }
          ]
        },
        {
          name: 'authorizedPersonDetails',
          label: 'Authorized Person Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'authorizedPersonName', label: 'Authorized Person Name', type: 'text', required: true },
            { name: 'designation', label: 'Designation', type: 'text', required: true },
            { name: 'authorizedMobile', label: 'Mobile Number', type: 'phone', required: true },
            { name: 'authorizedEmail', label: 'Email ID', type: 'email', required: true },
            { name: 'authorizedPan', label: 'PAN Number', type: 'text', required: true },
            { name: 'authorizedAddress', label: 'Address', type: 'text', required: true }
          ]
        },
        {
          name: 'documents',
          label: 'Document Uploads',
          type: 'group',
          required: false,
          subFields: [
            { name: 'panCard', label: 'PAN Card', type: 'file', required: true, description: 'PDF only. Max 2 MB.' },
            { name: 'addressProof', label: 'Address Proof', type: 'file', required: true, description: 'PDF only. Max 2 MB.' },
            { name: 'businessAddressProof', label: 'Business Address Proof', type: 'file', required: true, description: 'PDF only. Max 2 MB.' },
            { name: 'incorpCert', label: 'Certificate of Incorporation', type: 'file', required: false, description: 'Required for Company/LLP. PDF only. Max 2 MB.' },
            { name: 'tanCertificate', label: 'TAN Certificate', type: 'file', required: true, visibilityConditionStr: '{"field": "tanAvailable", "equals": "Yes"}', description: 'PDF only. Max 2 MB.' },
            { name: 'authorizationLetter', label: 'Authorization Letter / Board Resolution', type: 'file', required: false, description: 'PDF only. Max 2 MB.' }
          ]
        }
      ],
      crossValidations: []
    };

    await FormSchema.findOneAndUpdate(
      { serviceName: 'TDS Return Filing' },
      tdsSchema,
      { upsert: true, new: true }
    );

    console.log('Successfully seeded TDS form schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedTdsForm();
