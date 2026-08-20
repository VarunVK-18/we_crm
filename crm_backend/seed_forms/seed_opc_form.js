const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedOpcForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const opcSchema = {
      serviceName: 'OPC Incorporation',
      title: 'Complete Details',
      subtitle: 'OPC Application Form',
      fields: [
        {
          name: 'companyDetails',
          label: 'Step 1: Company Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'companyName', label: 'Proposed Company Name', type: 'text', required: true, description: 'Enter your preferred company name. Example: Wealth Empires Private Limited' },
            { name: 'businessActivity', label: 'Business Activity', type: 'text', required: true, description: 'Describe the main business activities your company will undertake.' },
            { name: 'officePreference', label: 'Registered Office Preference', type: 'dropdown', required: true, options: ['Already have address', 'Need virtual office'] },
            { name: 'officeProofPath', label: 'Registered Office Proof', type: 'file', required: true, visibilityConditionStr: '{"field": "officePreference", "equals": "Already have address"}', description: 'Upload EB bill or Wifi bill not less than 2 months old (PDF only. Max 2MB)' },
            { name: 'ownerName', label: 'Name of Owner in Utility Bill', type: 'text', required: true, visibilityConditionStr: '{"field": "officePreference", "equals": "Already have address"}' },
            { name: 'companyEmail', label: 'Company Mail', type: 'email', required: true, description: 'Should not be same as director email.' },
            { name: 'companyPhone', label: 'Company Phone Number', type: 'phone', required: true, description: 'Should not be same as director phone number.' },
            { name: 'paidUpCapital', label: 'Paid-up Share Capital', type: 'number', required: true, description: 'Minimum paid-up capital is ₹10,000.' },
            { name: 'valuePerShare', label: 'Value Per Share', type: 'number', required: true },
            { name: 'numberOfShares', label: 'Number of Shares', type: 'number', required: true }
          ]
        },
        {
          name: 'director',
          label: 'Step 2: Director Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'alreadyDirector', label: 'Already a Director in another company?', type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'fullName', label: 'Full Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'phone', label: 'Phone Number', type: 'phone', required: true },
            { name: 'fatherName', label: "Father's Name", type: 'text', required: true, visibilityConditionStr: '{"field": "alreadyDirector", "equals": "No"}' },
            { name: 'dob', label: 'Date of Birth', type: 'date', required: true, visibilityConditionStr: '{"field": "alreadyDirector", "equals": "No"}' },
            { name: 'placeOfBirth', label: 'Place of Birth', type: 'text', required: true, visibilityConditionStr: '{"field": "alreadyDirector", "equals": "No"}' },
            { name: 'nationality', label: 'Nationality', type: 'dropdown', required: true, options: ['Indian', 'Others'], visibilityConditionStr: '{"field": "alreadyDirector", "equals": "No"}' },
            { name: 'occupation', label: 'Occupation', type: 'dropdown', required: true, options: ['Business', 'Employment', 'House wife', 'Student'], visibilityConditionStr: '{"field": "alreadyDirector", "equals": "No"}' },
            { name: 'education', label: 'Education', type: 'text', required: true, visibilityConditionStr: '{"field": "alreadyDirector", "equals": "No"}' },
            { name: 'address', label: 'Residential Address', type: 'text', required: true, visibilityConditionStr: '{"field": "alreadyDirector", "equals": "No"}' },
            { name: 'pan', label: 'PAN', type: 'text', required: true, visibilityConditionStr: '{"field": "alreadyDirector", "equals": "No"}' },
            { name: 'aadhaar', label: 'Aadhaar Number', type: 'text', required: true, visibilityConditionStr: '{"field": "alreadyDirector", "equals": "No"}' },
            { name: 'din', label: 'DIN Number', type: 'text', required: true, visibilityConditionStr: '{"field": "alreadyDirector", "equals": "Yes"}' },
            { name: 'needDsc', label: 'I need DSC', type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'role', label: 'Select your role', type: 'dropdown', required: true, options: ['Director', 'Shareholder', 'Director & Shareholder'] },
            { name: 'shareholding', label: 'Shareholding Percentage', type: 'number', required: true, description: 'Must be exactly 100%' },
            { name: 'isAuthorized', label: "I'm Authorized Signatory", type: 'dropdown', required: true, options: ['Yes', 'No'] }
          ]
        },
        {
          name: 'directorDocs',
          label: 'Director Documents',
          type: 'group',
          required: false,
          subFields: [
            { name: 'photo', label: 'Photo', type: 'file', required: true, description: 'Upload 1 supported file (JPG/PNG). Max 2 MB.' },
            { name: 'signature', label: 'Signature', type: 'file', required: true, description: 'Upload 1 supported file (JPG/PNG). Max 2 MB.' },
            { name: 'addressProof', label: 'Residential Address Proof', type: 'file', required: true, description: 'Upload 1 supported file (PDF ONLY). Max 2 MB.' },
            { name: 'aadhaarDoc', label: 'Aadhaar Card', type: 'file', required: true, description: 'Upload 1 supported file (PDF ONLY). Max 2 MB.' },
            { name: 'panDoc', label: 'PAN Card', type: 'file', required: true, description: 'Upload 1 supported file (PDF ONLY). Max 2 MB.' }
          ]
        },
        {
          name: 'nominee',
          label: 'Step 3: Nominee Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'fullName', label: 'Full Name', type: 'text', required: true },
            { name: 'fatherName', label: "Father's Name", type: 'text', required: true },
            { name: 'dob', label: 'Date of Birth', type: 'date', required: true },
            { name: 'placeOfBirth', label: 'Place of Birth', type: 'text', required: true },
            { name: 'nationality', label: 'Nationality', type: 'dropdown', required: true, options: ['Indian', 'Others'] },
            { name: 'occupation', label: 'Occupation', type: 'dropdown', required: true, options: ['Business', 'Employment', 'House wife', 'Student'] },
            { name: 'education', label: 'Education', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'phone', label: 'Phone Number', type: 'phone', required: true },
            { name: 'address', label: 'Residential Address', type: 'text', required: true },
            { name: 'pan', label: 'PAN', type: 'text', required: true },
            { name: 'aadhaar', label: 'Aadhaar Number', type: 'text', required: true }
          ]
        },
        {
          name: 'nomineeDocs',
          label: 'Nominee Documents',
          type: 'group',
          required: false,
          subFields: [
            { name: 'photo', label: 'Photo', type: 'file', required: true, description: 'Upload 1 supported file (JPG/PNG). Max 2 MB.' },
            { name: 'signature', label: 'Signature', type: 'file', required: true, description: 'Upload 1 supported file (JPG/PNG). Max 2 MB.' },
            { name: 'addressProof', label: 'Residential Address Proof', type: 'file', required: true, description: 'Upload 1 supported file (PDF ONLY). Max 2 MB.' },
            { name: 'aadhaarDoc', label: 'Aadhaar Card', type: 'file', required: true, description: 'Upload 1 supported file (PDF ONLY). Max 2 MB.' },
            { name: 'panDoc', label: 'PAN Card', type: 'file', required: true, description: 'Upload 1 supported file (PDF ONLY). Max 2 MB.' }
          ]
        },
        {
          name: 'verification',
          label: 'Step 4: Final Verification',
          type: 'group',
          required: false,
          subFields: [
            { name: 'paymentScreenshot', label: 'Payment Screenshot', type: 'file', required: true, description: 'Upload 1 supported file. Max 2 MB.' },
            { name: 'consent', label: 'By submitting this form, I agree to the collection and use of my personal and professional information by Wealth Empires for consultation, compliance assessment, and service-related communication', type: 'checkbox', required: true }
          ]
        }
      ],
      crossValidations: [
        {
          type: 'sumEquals',
          fieldsStr: 'shareholding',
          value: '100',
          message: 'Shareholding percentage must be exactly 100%.'
        }
      ]
    };

    await FormSchema.findOneAndUpdate(
      { serviceName: 'OPC Incorporation' },
      opcSchema,
      { upsert: true, new: true }
    );

    console.log('Successfully seeded OPC Incorporation form schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedOpcForm();
