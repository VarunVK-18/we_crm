const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedLlpForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const llpSchema = {
      serviceName: 'LLP Incorporation',
      title: 'Complete Details',
      subtitle: 'LLP Application Form',
      fields: [
        {
          name: 'companyDetails',
          label: 'LLP Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'companyName', label: 'Proposed LLP name', type: 'text', required: true, description: 'Enter your preferred LLP company name...' },
            { name: 'businessActivity', label: 'Business Activity', type: 'text', required: true, description: 'Describe the main business activities...' },
            { name: 'officePreference', label: 'Registered Office Preference', type: 'dropdown', required: true, options: ['Do you have address for your company', 'Do you want virtual office for your company'] },
            { name: 'officeProofPath', label: 'Registered office proof', type: 'file', required: true, visibilityConditionStr: '{"field": "officePreference", "equals": "Do you have address for your company"}', description: 'EB bill, wifi bill not less than 2 months old (PDF only. Max 2MB)' },
            { name: 'ownerName', label: 'Name of the Owner in the utility bill', type: 'text', required: true, visibilityConditionStr: '{"field": "officePreference", "equals": "Do you have address for your company"}' },
            { name: 'totalCapital', label: 'Total Capital Contribution', type: 'number', required: true, description: 'Enter total capital contributed by all partners' }
          ]
        },
        {
          name: 'partners',
          label: 'Partner Details',
          type: 'array',
          required: false,
          arrayConfig: {
            minItems: 2,
            maxItems: 20,
            dynamicCountRef: 'assignedNumberOfDirectors'
          },
          subFields: [
            { name: 'alreadyDirector', label: 'Already a Director in another company?', type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'fullName', label: 'Full name', type: 'text', required: true, description: 'Include your first name, middle name (if any), and last name.' },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'phone', label: 'Phone number', type: 'phone', required: true },
            { name: 'fatherName', label: "Father's name", type: 'text', required: true, visibilityConditionStr: '{"field": "alreadyDirector", "equals": "No"}', description: 'As it appears on your official documents.' },
            { name: 'dob', label: 'DOB', type: 'date', required: true, visibilityConditionStr: '{"field": "alreadyDirector", "equals": "No"}' },
            { name: 'placeOfBirth', label: 'Place of birth', type: 'text', required: true, visibilityConditionStr: '{"field": "alreadyDirector", "equals": "No"}', description: 'City and state where you were born.' },
            { name: 'nationality', label: 'Nationality', type: 'dropdown', required: true, options: ['Indian', 'Others'], visibilityConditionStr: '{"field": "alreadyDirector", "equals": "No"}' },
            { name: 'occupation', label: 'Select the occupation', type: 'dropdown', required: true, options: ['Business', 'Employment', 'House wife', 'Student'], visibilityConditionStr: '{"field": "alreadyDirector", "equals": "No"}' },
            { name: 'education', label: 'Education', type: 'text', required: true, visibilityConditionStr: '{"field": "alreadyDirector", "equals": "No"}' },
            { name: 'address', label: 'Address', type: 'text', required: true, visibilityConditionStr: '{"field": "alreadyDirector", "equals": "No"}', description: 'Complete residential address with Pin code' },
            { name: 'pan', label: 'PAN', type: 'text', required: true, visibilityConditionStr: '{"field": "alreadyDirector", "equals": "No"}', description: '10-character PAN' },
            { name: 'aadhaar', label: 'Aadhaar Number', type: 'text', required: true, visibilityConditionStr: '{"field": "alreadyDirector", "equals": "No"}', description: '12-digit Aadhaar number' },
            { name: 'din', label: 'DIN Number', type: 'text', required: true, visibilityConditionStr: '{"field": "alreadyDirector", "equals": "Yes"}', description: 'Leave blank if this is your first directorship.' },
            { name: 'needDsc', label: 'I need DSC', type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'designation', label: 'Designation', type: 'dropdown', required: true, options: ['Designated Partner', 'Partner'] },
            { name: 'capital', label: 'Fixed Capital Contribution', type: 'number', required: true, description: 'Amount you will contribute to the LLP' },
            { name: 'profitRatio', label: 'Profit sharing ratio (%)', type: 'number', required: true, description: 'Your profit sharing percentage in the LLP' },
            { name: 'isAuthorized', label: "I'm Authorized signatory", type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'photo', label: 'Photo', type: 'file', required: true, description: 'Upload a recent passport-size photograph.' },
            { name: 'signature', label: 'Signature', type: 'file', required: true, description: 'Upload a clear image of your signature.' },
            { name: 'addressProof', label: 'Residential address proof', type: 'file', required: true, description: 'Utility bill, bank statement, etc.' },
            { name: 'aadhaarDoc', label: 'Aadhaar Card', type: 'file', required: true, description: 'Aadhaar card with front and back side.' },
            { name: 'panDoc', label: 'PAN Card', type: 'file', required: true, description: 'PAN card.' }
          ]
        },
        {
          name: 'verification',
          label: 'Final Verification',
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
          fieldsStr: 'profitRatio',
          value: '100',
          message: 'Total profit sharing across all partners must be exactly 100%.'
        }
      ]
    };

    await FormSchema.findOneAndUpdate(
      { serviceName: 'LLP Incorporation' },
      llpSchema,
      { upsert: true, new: true }
    );

    console.log('Successfully seeded LLP Incorporation form schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedLlpForm();
