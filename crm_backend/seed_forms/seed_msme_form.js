const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedMsmeForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const msmeSchema = {
      serviceName: 'MSME Registration',
      title: 'Complete Details',
      subtitle: 'MSME / Udyam Registration',
      fields: [
        {
          name: 'applicantDetails',
          label: 'Applicant / Entrepreneur Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'aadhaarNumber', label: 'Aadhaar Number', type: 'text', required: true, description: 'Exactly 12 digits' },
            { name: 'entrepreneurName', label: 'Name of Entrepreneur', type: 'text', required: true, description: 'Full legal name' },
            { name: 'mobileNumber', label: 'Mobile Number', type: 'phone', required: true, description: 'Exactly 10 digits' },
            { name: 'email', label: 'Email', type: 'email', required: true }
          ]
        },
        {
          name: 'organizationDetails',
          label: 'Organization Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'organizationType', label: 'Type of Organization', type: 'dropdown', required: true, options: ['Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'OPC', 'Trust', 'Society'] },
            { name: 'enterpriseName', label: 'Name of Enterprise', type: 'text', required: true, description: 'Legal/business enterprise name' },
            { name: 'incorporationDate', label: 'Date of Incorporation', type: 'date', required: true }
          ]
        },
        {
          name: 'panGstDetails',
          label: 'PAN & GST Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'pan', label: 'PAN', type: 'text', required: true, description: '10-character format (e.g. ABCDE1234F)' },
            { name: 'panHolderName', label: 'Name of PAN Holder', type: 'text', required: true },
            { name: 'panDob', label: 'Date of Birth / Incorporation as per PAN', type: 'date', required: true },
            { name: 'hasGst', label: 'Do you have GSTIN?', type: 'dropdown', required: true, options: ['Yes', 'No', 'Exempted'] },
            { name: 'gstin', label: 'GST Number', type: 'text', required: true, visibilityConditionStr: '{"field": "hasGst", "equals": "Yes"}', description: 'Standard GSTIN format' }
          ]
        },
        {
          name: 'businessDetails',
          label: 'Business Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'investment', label: 'Total Investment Made in Business (₹)', type: 'number', required: true },
            { name: 'turnover', label: 'Turnover in Last FY', type: 'number', required: true },
            { name: 'officeName', label: 'Office Name', type: 'text', required: true },
            { name: 'majorActivity', label: 'Major Activity of Unit', type: 'dropdown', required: true, options: ['Manufacturing', 'Services', 'Trading'] },
            { name: 'officeAddress', label: 'Office Address', type: 'text', required: true, description: 'Include PIN code' }
          ]
        },
        {
          name: 'socialCategoryDetails',
          label: 'Social & Category Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'socialCategory', label: 'Social Category', type: 'dropdown', required: true, options: ['General', 'SC', 'ST', 'OBC'] },
            { name: 'gender', label: 'Gender', type: 'dropdown', required: true, options: ['Male', 'Female', 'Others'] },
            { name: 'divyang', label: 'Specially Abled (DIVYANG)?', type: 'dropdown', required: true, options: ['Yes', 'No'] }
          ]
        },
        {
          name: 'bankDetails',
          label: 'Bank Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'bankName', label: 'Bank Name', type: 'text', required: true },
            { name: 'ifsc', label: 'IFSC Code', type: 'text', required: true },
            { name: 'accountNumber', label: 'Bank Account Number', type: 'number', required: true }
          ]
        },
        {
          name: 'employeeDetails',
          label: 'Employee Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'maleEmployees', label: 'No. of Male Employees', type: 'number', required: true },
            { name: 'femaleEmployees', label: 'No. of Female Employees', type: 'number', required: true }
          ]
        },
        {
          name: 'tredsRegistration',
          label: 'TReDS Registration',
          type: 'group',
          required: false,
          subFields: [
            { name: 'treds', label: 'Interested in TReDS Portal Registration?', type: 'dropdown', required: true, options: ['Yes', 'No'] }
          ]
        }
      ],
      crossValidations: []
    };

    await FormSchema.findOneAndUpdate(
      { serviceName: 'MSME Registration' },
      msmeSchema,
      { upsert: true, new: true }
    );

    console.log('Successfully seeded MSME Registration form schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedMsmeForm();
