const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' }); // adjusted for running inside seed_forms directory

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedPfForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const pfSchema = {
      serviceName: 'PF Registration & Compliance',
      title: 'Complete Details',
      subtitle: 'PF / EPFO Registration Form',
      fields: [
        {
          name: 'businessDetails',
          label: 'Business Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'businessName', label: 'Business / Organization Name', type: 'text', required: true },
            { name: 'entityType', label: 'Entity Type', type: 'dropdown', required: true, options: ['Private Limited', 'LLP', 'OPC', 'Proprietorship', 'Partnership'] },
            { name: 'businessPanNumber', label: 'Business PAN Number', type: 'text', required: true, description: 'Enter a valid PAN' },
            { name: 'dateOfIncorporation', label: 'Date of Incorporation / Establishment', type: 'date', required: true },
            { name: 'businessAddress', label: 'Business Address', type: 'text', required: true },
            { name: 'state', label: 'State', type: 'text', required: true },
            { name: 'pinCode', label: 'PIN Code', type: 'number', required: true, description: 'Exactly 6 digits' }
          ]
        },
        {
          name: 'authorizedSignatoryDetails',
          label: 'Authorized Signatory Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'signatoryName', label: 'Full Name', type: 'text', required: true },
            { name: 'signatoryDesignation', label: 'Designation', type: 'text', required: true },
            { name: 'signatoryPanNumber', label: 'Signatory PAN Number', type: 'text', required: true, description: 'Enter a valid PAN' },
            { name: 'signatoryMobile', label: 'Mobile Number', type: 'phone', required: true, description: 'Exactly 10 digits' },
            { name: 'signatoryEmail', label: 'Email ID', type: 'email', required: true }
          ]
        },
        {
          name: 'employeeInformation',
          label: 'Employee Information',
          type: 'group',
          required: false,
          subFields: [
            { name: 'numberOfEmployees', label: 'Number of Employees', type: 'number', required: true, description: 'Positive integer only' },
            { name: 'employeeDetails', label: 'Employee Details (Optional)', type: 'text', required: false }
          ]
        },
        {
          name: 'documents',
          label: 'Document Uploads',
          type: 'group',
          required: false,
          subFields: [
            { name: 'panCard', label: 'PAN Card', type: 'file', required: true, description: 'Max 2 MB.' },
            { name: 'businessAddressProof', label: 'Business Address Proof', type: 'file', required: true, description: 'Max 2 MB.' },
            { name: 'cancelledCheque', label: 'Cancelled Cheque', type: 'file', required: true, description: 'Max 2 MB.' },
            { name: 'authSignatoryProof', label: 'Authorized Signatory ID Proof', type: 'file', required: true, description: 'Max 2 MB.' },
            { name: 'incorpCert', label: 'Certificate of Incorporation', type: 'file', required: true, visibilityConditionStr: '{"field": "entityType", "in": ["Private Limited", "LLP", "OPC"]}', description: 'Max 2 MB.' }
          ]
        }
      ],
      crossValidations: []
    };

    await FormSchema.findOneAndUpdate(
      { serviceName: 'PF Registration & Compliance' },
      pfSchema,
      { upsert: true, new: true }
    );

    console.log('Successfully seeded PF form schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedPfForm();
