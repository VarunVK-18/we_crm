const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedIncorpForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const incorpSchema = {
      serviceName: 'Private Limited Incorporation',
      title: 'Complete Details',
      subtitle: 'Step 1: Company Details',
      fields: [
        {
          name: 'companyDetails',
          label: 'Company Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'companyName', label: 'Proposed Company Name', type: 'text', required: true, description: 'Enter your preferred company name.' },
            { name: 'businessActivity', label: 'Business Activity', type: 'text', required: true, description: 'Describe the main business activities your company will undertake.' },
            { name: 'officePreference', label: 'Registered Office Preference', type: 'dropdown', required: true, options: ['Already have address', 'Need virtual office'] },
            { name: 'officeProofPath', label: 'Registered Office Proof', type: 'file', required: true, visibilityCondition: { field: 'officePreference', equals: 'Already have address' }, description: 'Upload EB bill or Wifi bill not less than 2 months old.' },
            { name: 'ownerName', label: 'Name of Owner in Utility Bill', type: 'text', required: true, visibilityCondition: { field: 'officePreference', equals: 'Already have address' } },
            { name: 'companyEmail', label: 'Company Mail', type: 'email', required: true, description: 'Should not be same as director.' },
            { name: 'companyPhone', label: 'Company Phone Number', type: 'phone', required: true, description: 'Should not be same as director.' },
            { name: 'paidUpCapital', label: 'Paid up Share Capital', type: 'number', required: true, description: 'Minimum requirement is ₹10,000.' },
            { name: 'valuePerShare', label: 'Value Per Share', type: 'number', required: true },
            { name: 'numberOfShares', label: 'No. of Shares', type: 'number', required: true },
          ]
        },
        {
          name: 'directors',
          label: 'Step 2: Director Details',
          type: 'array',
          required: false,
          arrayConfig: {
            minItems: 2,
            maxItems: 10,
            dynamicCountRef: 'assignedNumberOfDirectors'
          },
          subFields: [
            { name: 'alreadyDirector', label: 'Already a Director in another company?', type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'fullName', label: 'Full name', type: 'text', required: true, description: 'Enter your complete name as it appears on your official documents.' },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'phone', label: 'Phone number', type: 'phone', required: true },
            { name: 'fatherName', label: "Father's name", type: 'text', required: true, visibilityCondition: { field: 'alreadyDirector', equals: 'No' } },
            { name: 'dob', label: 'DOB', type: 'date', required: true, visibilityCondition: { field: 'alreadyDirector', equals: 'No' } },
            { name: 'placeOfBirth', label: 'Place of birth', type: 'text', required: true, visibilityCondition: { field: 'alreadyDirector', equals: 'No' } },
            { name: 'nationality', label: 'Nationality', type: 'dropdown', required: true, options: ['Indian', 'Others'], visibilityCondition: { field: 'alreadyDirector', equals: 'No' } },
            { name: 'occupation', label: 'Select the occupation', type: 'dropdown', required: true, options: ['Business', 'Employment', 'House wife', 'Student'], visibilityCondition: { field: 'alreadyDirector', equals: 'No' } },
            { name: 'education', label: 'Education', type: 'text', required: true, visibilityCondition: { field: 'alreadyDirector', equals: 'No' } },
            { name: 'address', label: 'Address', type: 'text', required: true, visibilityCondition: { field: 'alreadyDirector', equals: 'No' } },
            { name: 'pan', label: 'PAN', type: 'text', required: true, visibilityCondition: { field: 'alreadyDirector', equals: 'No' } },
            { name: 'aadhaar', label: 'Aadhaar Number', type: 'text', required: true, visibilityCondition: { field: 'alreadyDirector', equals: 'No' } },
            { name: 'din', label: 'DIN Number', type: 'text', required: true, visibilityCondition: { field: 'alreadyDirector', equals: 'Yes' } },
            { name: 'needDsc', label: 'I need DSC', type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'role', label: 'Select your role', type: 'dropdown', required: true, options: ['Director', 'Shareholder', 'Director & Shareholder'] },
            { name: 'shareholding', label: 'Share holding percentage', type: 'number', required: true, description: 'Enter the percentage of shares (0-100).' },
            { name: 'isAuthSignatory', label: "I'm Authorized signatory", type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'photo', label: 'Photo', type: 'file', required: true, description: 'Upload a recent passport-size photograph.' },
            { name: 'signature', label: 'Signature', type: 'file', required: true, description: 'Upload a clear image of your signature.' },
            { name: 'addressProof', label: 'Residential address proof', type: 'file', required: true, description: 'Upload proof of your residential address.' },
            { name: 'aadhaarDoc', label: 'Aadhaar Card', type: 'file', required: true, description: 'Upload Aadhaar card with front and back side pdf.' },
            { name: 'panDoc', label: 'PAN Card', type: 'file', required: true, description: 'Upload PAN card.' }
          ]
        }
      ],
      crossValidations: [
        {
          type: 'sumEquals',
          fields: ['shareholding'],
          value: 100,
          message: 'Total shareholding across all directors must be exactly 100%.'
        }
      ]
    };

    await FormSchema.findOneAndUpdate(
      { serviceName: 'Private Limited Incorporation' },
      incorpSchema,
      { upsert: true, new: true }
    );

    console.log('Successfully seeded Private Limited Company form schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedIncorpForm();
