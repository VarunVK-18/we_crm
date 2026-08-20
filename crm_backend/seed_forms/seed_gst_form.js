const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' }); // adjusted for running inside seed_forms directory

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedGstForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const gstSchema = {
      serviceName: 'GST Registration',
      title: 'Complete Details',
      subtitle: 'GST Registration Form',
      fields: [
        {
          name: 'businessInfo',
          label: '1. Business Information',
          type: 'group',
          required: false,
          subFields: [
            { name: 'legalName', label: 'Legal Name of Business', type: 'text', required: true },
            { name: 'panOfBusiness', label: 'PAN of Business', type: 'text', required: true, description: 'Format: XXXXX9999X' },
            { name: 'businessEmail', label: 'Business Email', type: 'email', required: true },
            { name: 'businessPhone', label: 'Business Phone Number', type: 'phone', required: true, description: 'Exactly 10 digits' },
            { name: 'tradeName', label: 'Trade Name', type: 'text', required: true },
            { name: 'incorpDate', label: 'Date of Incorporation', type: 'date', required: true },
            { name: 'constitutionType', label: 'Constitution of Business', type: 'dropdown', required: true, options: ['Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'OPC', 'Others'] },
            { name: 'incorpCert', label: 'Certificate of Incorporation', type: 'file', required: false, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Required for LLP/Company. Max 2 MB.', visibilityConditionStr: '{"field": "constitutionType", "in": ["LLP", "Private Limited", "OPC"]}' }
          ]
        },
        {
          name: 'director1Info',
          label: '2. Director / Promoter 1 Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'dir1FullName', label: 'Full Name', type: 'text', required: true },
            { name: 'dir1FatherName', label: 'Father\'s Name', type: 'text', required: true },
            { name: 'dir1Dob', label: 'Date of Birth', type: 'date', required: true },
            { name: 'dir1Phone', label: 'Mobile Number', type: 'phone', required: true, description: 'Exactly 10 digits' },
            { name: 'dir1Mail', label: 'Email ID', type: 'email', required: true },
            { name: 'dir1Gender', label: 'Gender', type: 'dropdown', required: true, options: ['Male', 'Female', 'Other'] },
            { name: 'dir1Din', label: 'DIN (If applicable)', type: 'text', required: false },
            { name: 'dir1Pan', label: 'PAN', type: 'text', required: true, description: 'Format: XXXXX9999X' },
            { name: 'dir1Address', label: 'Residential Address', type: 'text', required: true },
            { name: 'dir1AuthSignatory', label: 'Is Authorized Signatory?', type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'dir1Photo', label: 'Photograph', type: 'file', required: true, allowedExtensions: ['jpg', 'jpeg', 'png'], description: 'JPG/PNG only. Max 2 MB.' },
            { name: 'dir1AuthSignatoryDoc', label: 'Authorized Signatory Proof', type: 'file', required: true, visibilityConditionStr: '{"field": "dir1AuthSignatory", "equals": "Yes"}', allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' }
          ]
        },
        {
          name: 'director2Section',
          label: '3. Additional Director / Promoter',
          type: 'group',
          required: false,
          subFields: [
            { name: 'hasDirector2', label: 'Add another Director/Promoter?', type: 'dropdown', required: true, options: ['Yes', 'No'] }
          ]
        },
        {
          name: 'director2Info',
          label: 'Director / Promoter 2 Details',
          type: 'group',
          required: false,
          visibilityConditionStr: '{"field": "hasDirector2", "equals": "Yes"}',
          subFields: [
            { name: 'dir2FullName', label: 'Full Name', type: 'text', required: true },
            { name: 'dir2FatherName', label: 'Father\'s Name', type: 'text', required: true },
            { name: 'dir2Dob', label: 'Date of Birth', type: 'date', required: true },
            { name: 'dir2Phone', label: 'Mobile Number', type: 'phone', required: true, description: 'Exactly 10 digits' },
            { name: 'dir2Mail', label: 'Email ID', type: 'email', required: true },
            { name: 'dir2Gender', label: 'Gender', type: 'dropdown', required: true, options: ['Male', 'Female', 'Other'] },
            { name: 'dir2Din', label: 'DIN (If applicable)', type: 'text', required: false },
            { name: 'dir2Pan', label: 'PAN', type: 'text', required: true, description: 'Format: XXXXX9999X' },
            { name: 'dir2Address', label: 'Residential Address', type: 'text', required: true },
            { name: 'dir2AuthSignatory', label: 'Is Authorized Signatory?', type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'dir2Photo', label: 'Photograph', type: 'file', required: true, allowedExtensions: ['jpg', 'jpeg', 'png'], description: 'JPG/PNG only. Max 2 MB.' },
            { name: 'dir2AuthSignatoryDoc', label: 'Authorized Signatory Proof', type: 'file', required: true, visibilityConditionStr: '{"field": "dir2AuthSignatory", "equals": "Yes"}', allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' }
          ]
        },
        {
          name: 'businessDetails',
          label: '4. Principal Place of Business',
          type: 'group',
          required: false,
          subFields: [
            { name: 'businessAddress', label: 'Business Address', type: 'text', required: true },
            { name: 'premisesType', label: 'Premises Type', type: 'dropdown', required: true, options: ['Own', 'Rented', 'Leased', 'Consent', 'Shared'] },
            { name: 'businessDescription', label: 'Nature of Business Activity', type: 'text', required: true },
            { name: 'ebBill', label: 'Electricity Bill', type: 'file', required: true, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' },
            { name: 'rentalAgreement', label: 'Rental/Lease Agreement', type: 'file', required: true, visibilityConditionStr: '{"field": "premisesType", "in": ["Rented", "Leased"]}', allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' },
            { name: 'propertyTaxReceipt', label: 'Property Tax Receipt', type: 'file', required: true, visibilityConditionStr: '{"field": "premisesType", "equals": "Own"}', allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' }
          ]
        },
        {
          name: 'additionalPlacesSection',
          label: '5. Additional Places of Business',
          type: 'group',
          required: false,
          subFields: [
            { name: 'hasAdditionalPlaces', label: 'Do you have additional places of business?', type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'secondPlaceAddress', label: 'Second Place Address', type: 'text', required: false, visibilityConditionStr: '{"field": "hasAdditionalPlaces", "equals": "Yes"}' },
            { name: 'thirdPlaceAddress', label: 'Third Place Address', type: 'text', required: false, visibilityConditionStr: '{"field": "hasAdditionalPlaces", "equals": "Yes"}' }
          ]
        },
        {
          name: 'companyDocs',
          label: '6. Company Documents',
          type: 'group',
          required: false,
          subFields: [
            { name: 'companyPanFile', label: 'Company / Firm PAN Card', type: 'file', required: true, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' }
          ]
        },
        {
          name: 'bankDetails',
          label: '7. Bank Account Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'accountNumber', label: 'Account Number', type: 'number', required: true },
            { name: 'accountType', label: 'Account Type', type: 'dropdown', required: true, options: ['Current', 'Savings', 'Cash Credit', 'Overdraft'] },
            { name: 'ifscCode', label: 'IFSC Code', type: 'text', required: true },
            { name: 'bankDocument', label: 'Bank Statement / Cancelled Cheque / Passbook', type: 'file', required: true, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' }
          ]
        },
        {
          name: 'declarationSection',
          label: '8. Declaration',
          type: 'group',
          required: false,
          subFields: [
            { name: 'isDeclared', label: 'I hereby solemnly affirm and declare that the information given herein above is true and correct to the best of my knowledge and belief.', type: 'checkbox', required: true }
          ]
        }
      ],
      crossValidations: []
    };

    await FormSchema.findOneAndUpdate(
      { serviceName: 'GST Registration' },
      gstSchema,
      { upsert: true, new: true }
    );

    console.log('Successfully seeded GST Registration form schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedGstForm();
