const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' }); // adjusted for running inside seed_forms directory

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedIecForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const iecSchema = {
      serviceName: 'Import Export Code (IEC)',
      title: 'Complete Details',
      subtitle: 'IEC Registration Form',
      fields: [
        {
          name: 'applicantDetails',
          label: '1. Applicant Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'applicantFirstName', label: 'First Name', type: 'text', required: true },
            { name: 'applicantLastName', label: 'Last Name', type: 'text', required: true },
            { name: 'applicantEmail', label: 'Email', type: 'email', required: true },
            { name: 'applicantMobile', label: 'Mobile No', type: 'phone', required: true, description: 'Exactly 10 digits' },
            { name: 'applicantAddress', label: 'Address', type: 'text', required: true }
          ]
        },
        {
          name: 'applicantDocuments',
          label: '2. Applicant Documents',
          type: 'group',
          required: false,
          subFields: [
            { name: 'applicantPan', label: 'Applicant PAN Card', type: 'file', required: true, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' },
            { name: 'applicantAddressProof', label: 'Applicant Address Proof', type: 'file', required: true, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' }
          ]
        },
        {
          name: 'companyDetails',
          label: '3. Company Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'companyName', label: 'Company Name', type: 'text', required: true },
            { name: 'companyPanNumber', label: 'Company PAN Number', type: 'text', required: true, description: 'Format: ABCDE1234F' },
            { name: 'nameOnCompanyPan', label: 'Name on Company PAN', type: 'text', required: true },
            { name: 'dateOfIncorporation', label: 'Date of Incorporation', type: 'date', required: true, description: 'Cannot be a future date' },
            { name: 'gstin', label: 'GSTIN', type: 'text', required: true, description: 'Format: 15 characters' },
            { name: 'companyMobileNumber', label: 'Company Mobile Number', type: 'phone', required: true, description: 'Exactly 10 digits' },
            { name: 'companyMailId', label: 'Company Mail ID', type: 'email', required: true }
          ]
        },
        {
          name: 'directorDetailsToggle',
          label: '4. Director / Partner Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'hasDirectorDetails', label: 'Include Director / Partner Details?', type: 'dropdown', required: true, options: ['Yes', 'No'] }
          ]
        },
        {
          name: 'directorDetails',
          label: 'Director / Partner Information',
          type: 'group',
          required: false,
          visibilityConditionStr: '{"field": "hasDirectorDetails", "equals": "Yes"}',
          subFields: [
            { name: 'directorDin', label: 'DIN', type: 'text', required: true },
            { name: 'directorPanName', label: 'Director 1 PAN Name', type: 'text', required: true },
            { name: 'directorPanNumber', label: 'Director 1 PAN Number', type: 'text', required: true, description: 'Format: ABCDE1234F' },
            { name: 'directorPanDob', label: 'Director 1 PAN DOB', type: 'date', required: true, description: 'Cannot be a future date' },
            { name: 'directorFatherName', label: 'Father Name', type: 'text', required: true },
            { name: 'directorAddress', label: 'Address', type: 'text', required: true },
            { name: 'directorPhoneNumber', label: 'Phone Number', type: 'phone', required: true, description: 'Exactly 10 digits' }
          ]
        },
        {
          name: 'directorDocuments',
          label: '5. Director / Partner Documents',
          type: 'group',
          required: false,
          visibilityConditionStr: '{"field": "hasDirectorDetails", "equals": "Yes"}',
          subFields: [
            { name: 'directorPanDoc', label: 'Director PAN Card', type: 'file', required: true, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' },
            { name: 'directorAddressProofDoc', label: 'Director Address Proof', type: 'file', required: true, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' }
          ]
        },
        {
          name: 'bankDetails',
          label: '6. Bank Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'bankAccountNumber', label: 'Bank Account Number', type: 'text', required: true },
            { name: 'bankAccountHolderName', label: 'Bank Account Holder Name', type: 'text', required: true },
            { name: 'ifscCode', label: 'IFSC Code', type: 'text', required: true, description: 'Format: ABCD0123456' },
            { name: 'bankName', label: 'Bank Name', type: 'text', required: true }
          ]
        },
        {
          name: 'bankDocuments',
          label: '7. Bank Documents',
          type: 'group',
          required: false,
          subFields: [
            { name: 'bankDocument', label: 'Bank Account First Page', type: 'file', required: true, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' }
          ]
        },
        {
          name: 'declarationSection',
          label: '8. Declaration',
          type: 'group',
          required: false,
          subFields: [
            { name: 'declaration', label: 'I hereby declare that all the information provided is true and correct.', type: 'checkbox', required: true }
          ]
        }
      ],
      crossValidations: []
    };

    await FormSchema.findOneAndUpdate(
      { serviceName: 'Import Export Code (IEC)' },
      iecSchema,
      { upsert: true, new: true }
    );

    console.log('Successfully seeded IEC form schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedIecForm();
