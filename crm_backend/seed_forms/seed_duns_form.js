const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' }); // adjusted for running inside seed_forms directory

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedDunsForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const dunsSchema = {
      serviceName: 'DUNS Number',
      title: 'Complete Details',
      subtitle: 'DUNS Registration Form',
      fields: [
        {
          name: 'applicantDetails',
          label: '1. Applicant Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'applicantName', label: 'Applicant Name', type: 'text', required: true }
          ]
        },
        {
          name: 'companyDetails',
          label: '2. Company Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'legalBusinessName', label: 'Legal Business Name', type: 'text', required: true },
            { name: 'tradeName', label: 'Trade Name (if any)', type: 'text', required: false },
            { name: 'businessType', label: 'Business Type', type: 'dropdown', required: true, options: ['Private Limited', 'LLP', 'Sole Proprietorship', 'Partnership', 'Other'] },
            { name: 'businessTypeOther', label: 'Other Business Type', type: 'text', required: true, visibilityConditionStr: '{"field": "businessType", "equals": "Other"}' },
            { name: 'yearOfEstablishment', label: 'Year of Establishment', type: 'number', required: true },
            { name: 'numberOfEmployees', label: 'Number of Employees', type: 'number', required: true }
          ]
        },
        {
          name: 'businessAddressDetails',
          label: '3. Business Address Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'registeredAddress', label: 'Registered Address', type: 'text', required: true },
            { name: 'city', label: 'City', type: 'text', required: true },
            { name: 'state', label: 'State', type: 'text', required: true },
            { name: 'pinCode', label: 'PIN Code', type: 'number', required: true, description: 'Exactly 6 digits' },
            { name: 'country', label: 'Country', type: 'text', required: true, description: 'Default: India' }
          ]
        },
        {
          name: 'businessRegistrationDetails',
          label: '4. Business Registration Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'officialEmail', label: 'Official Email ID', type: 'email', required: true },
            { name: 'businessPhone', label: 'Business Phone Number', type: 'phone', required: true, description: 'Exactly 10 digits' },
            { name: 'websiteUrl', label: 'Website URL', type: 'text', required: false },
            { name: 'panNumber', label: 'PAN Number of the Business', type: 'text', required: true, description: 'Format: ABCDE1234F' },
            { name: 'gstNumber', label: 'GST Number', type: 'text', required: false },
            { name: 'cinLlpinNumber', label: 'CIN / LLPIN Number', type: 'text', required: false }
          ]
        },
        {
          name: 'businessInformation',
          label: '5. Business Information',
          type: 'group',
          required: false,
          subFields: [
            { name: 'natureOfBusiness', label: 'Nature of Business', type: 'text', required: true },
            { name: 'mainProducts', label: 'Main Products / Services', type: 'text', required: true },
            { name: 'annualRevenue', label: 'Annual Revenue (Approx)', type: 'dropdown', required: true, options: ['< 50 Lakhs', '50 Lakhs - 1 Crore', '1 Cr - 10 Cr', '10 – 30 Cr', '30 - 100 Cr', '100 - 250 Cr', '250 - 500 Cr', 'Above 500 Cr'] },
            { name: 'annualTurnover', label: 'Annual Turnover', type: 'number', required: true }
          ]
        },
        {
          name: 'directorDetailsToggle',
          label: '6. Director Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'hasDirectorDetails', label: 'Add Director Details?', type: 'dropdown', required: true, options: ['Yes', 'No'] }
          ]
        },
        {
          name: 'directorDetails',
          label: 'Director Details Information',
          type: 'group',
          required: false,
          visibilityConditionStr: '{"field": "hasDirectorDetails", "equals": "Yes"}',
          subFields: [
            { name: 'directorFirstName', label: 'Director First Name', type: 'text', required: true },
            { name: 'directorLastName', label: 'Director Last Name', type: 'text', required: true },
            { name: 'directorPersonalEmail', label: 'Personal Mail ID', type: 'email', required: true },
            { name: 'contactNumber', label: 'Director Phone Number', type: 'phone', required: true, description: 'Exactly 10 digits' },
            { name: 'directorMobile', label: 'Mobile Number', type: 'phone', required: true, description: 'Exactly 10 digits' },
            { name: 'designation', label: 'Designation', type: 'text', required: true }
          ]
        },
        {
          name: 'documents',
          label: '7. Documents',
          type: 'group',
          required: false,
          subFields: [
            { name: 'incorpCert', label: 'Incorporation Certificate', type: 'file', required: true, allowedExtensions: ['pdf'], description: 'PDF only. Max 2 MB.' },
            { name: 'gstDocument', label: 'GST Document', type: 'file', required: true, allowedExtensions: ['pdf'], description: 'PDF only. Max 2 MB.' },
            { name: 'panCard', label: 'PAN Card of Company', type: 'file', required: true, allowedExtensions: ['pdf'], description: 'PDF only. Max 2 MB.' },
            { name: 'addressProof', label: 'Business Address Proof', type: 'file', required: true, allowedExtensions: ['pdf'], description: 'Utility Bill, Bank Statement, etc. PDF only. Max 2 MB.' }
          ]
        },
        {
          name: 'declarationSection',
          label: '8. Declaration',
          type: 'group',
          required: false,
          subFields: [
            { name: 'declaration', label: 'I confirm that the above information is accurate and authorize submission for D-U-N-S registration via Dun & Bradstreet.', type: 'checkbox', required: true }
          ]
        }
      ],
      crossValidations: []
    };

    await FormSchema.findOneAndUpdate(
      { serviceName: 'DUNS Number' },
      dunsSchema,
      { upsert: true, new: true }
    );

    console.log('Successfully seeded DUNS form schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedDunsForm();
