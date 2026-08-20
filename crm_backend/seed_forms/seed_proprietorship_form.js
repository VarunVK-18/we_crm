const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedProprietorshipForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const propSchema = {
      serviceName: 'Proprietorship Registration',
      title: 'Complete Details',
      subtitle: 'Proprietorship Registration Form',
      fields: [
        {
          name: 'proprietorDetails',
          label: '1. Proprietor / Applicant Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'fullName', label: 'Full Name of Proprietor', type: 'text', required: true },
            { name: 'pan', label: 'PAN Number', type: 'text', required: true, description: 'Format: AAAAA9999A' },
            { name: 'aadhaar', label: 'Aadhaar Number', type: 'text', required: true, description: 'Exactly 12 digits' },
            { name: 'dob', label: 'Date of Birth', type: 'date', required: true },
            { name: 'mobile', label: 'Mobile Number', type: 'phone', required: true, description: 'Exactly 10 digits' },
            { name: 'email', label: 'Email ID', type: 'email', required: true },
            { name: 'residentialAddress', label: 'Residential Address', type: 'text', required: true },
            { name: 'state', label: 'State', type: 'text', required: true },
            { name: 'pinCode', label: 'PIN Code', type: 'number', required: true, description: 'Exactly 6 digits' }
          ]
        },
        {
          name: 'businessDetails',
          label: '2. Business Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'businessName', label: 'Proposed Business / Trade Name', type: 'text', required: true },
            { name: 'businessActivity', label: 'Nature of Business / Business Activity', type: 'text', required: true },
            { name: 'businessAddress', label: 'Business Address', type: 'text', required: true },
            { name: 'businessState', label: 'State', type: 'text', required: true },
            { name: 'businessDistrict', label: 'District', type: 'text', required: false },
            { name: 'businessPinCode', label: 'PIN Code', type: 'number', required: true },
            { name: 'businessStartDate', label: 'Business Start Date', type: 'date', required: true },
            { name: 'businessConstitution', label: 'Business Constitution', type: 'dropdown', required: true, options: ['Proprietorship'] }
          ]
        },
        {
          name: 'registrationDetails',
          label: '3. Business / Registration Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'isOperating', label: 'Is the business already operating?', type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'hasGstin', label: 'Do you already have GSTIN?', type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'gstin', label: 'GSTIN', type: 'text', required: true, visibilityConditionStr: '{"field": "hasGstin", "equals": "Yes"}' },
            { name: 'hasUdyam', label: 'Do you already have MSME/Udyam Registration?', type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'udyamNumber', label: 'Udyam Registration Number', type: 'text', required: true, visibilityConditionStr: '{"field": "hasUdyam", "equals": "Yes"}' },
            { name: 'hasShopAct', label: 'Do you have Shop & Establishment Registration?', type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'shopActNumber', label: 'Registration Number', type: 'text', required: true, visibilityConditionStr: '{"field": "hasShopAct", "equals": "Yes"}' }
          ]
        },
        {
          name: 'businessAddressDetails',
          label: '4. Business Address Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'doorNumber', label: 'Door / Building Number', type: 'text', required: true },
            { name: 'street', label: 'Street / Area', type: 'text', required: true },
            { name: 'city', label: 'City', type: 'text', required: true },
            { name: 'district', label: 'District', type: 'text', required: true },
            { name: 'state', label: 'State', type: 'text', required: true },
            { name: 'pinCode', label: 'PIN Code', type: 'number', required: true },
            { name: 'addressType', label: 'Business Address Type', type: 'dropdown', required: true, options: ['Owned', 'Rented/Leased'] },
            { name: 'landlordName', label: 'Landlord / Owner Name', type: 'text', required: true, visibilityConditionStr: '{"field": "addressType", "equals": "Rented/Leased"}' },
            { name: 'leaseDetails', label: 'Rent / Lease Agreement details', type: 'text', required: true, visibilityConditionStr: '{"field": "addressType", "equals": "Rented/Leased"}' }
          ]
        },
        {
          name: 'bankDetails',
          label: '5. Bank Details (Optional)',
          type: 'group',
          required: false,
          subFields: [
            { name: 'bankName', label: 'Bank Name', type: 'text', required: false },
            { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: false },
            { name: 'accountNumber', label: 'Bank Account Number', type: 'number', required: false },
            { name: 'ifsc', label: 'IFSC Code', type: 'text', required: false }
          ]
        },
        {
          name: 'documents',
          label: '6. Required Documents',
          type: 'group',
          required: false,
          subFields: [
            { name: 'panDoc', label: 'Proprietor PAN Card', type: 'file', required: true, description: 'PDF only. Max 2 MB.' },
            { name: 'aadhaarDoc', label: 'Proprietor Aadhaar Card', type: 'file', required: true, description: 'PDF only. Max 2 MB.' },
            { name: 'photo', label: 'Passport Size Photograph', type: 'file', required: true, description: 'JPG/PNG only. Max 2 MB.' },
            { name: 'residentialProof', label: 'Residential Address Proof', type: 'file', required: true, description: 'PDF only. Max 2 MB.' },
            { name: 'businessProof', label: 'Business Address Proof', type: 'file', required: true, description: 'PDF only. Max 2 MB.' }
          ]
        },
        {
          name: 'optionalServices',
          label: '7. Optional Registrations / Services',
          type: 'group',
          required: false,
          subFields: [
            { name: 'optGst', label: 'GST Registration', type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'optMsme', label: 'MSME / Udyam Registration', type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'optShopAct', label: 'Shop & Establishment Registration', type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'optFssai', label: 'FSSAI Registration / License', type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'optIec', label: 'IEC Registration', type: 'dropdown', required: true, options: ['Yes', 'No'] }
          ]
        },
        {
          name: 'verification',
          label: '8. Declaration',
          type: 'group',
          required: false,
          subFields: [
            { name: 'declaration', label: 'I hereby declare that the information provided above is true and correct to the best of my knowledge.', type: 'checkbox', required: true }
          ]
        }
      ],
      crossValidations: []
    };

    await FormSchema.findOneAndUpdate(
      { serviceName: 'Proprietorship Registration' },
      propSchema,
      { upsert: true, new: true }
    );

    console.log('Successfully seeded Proprietorship Registration form schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedProprietorshipForm();
