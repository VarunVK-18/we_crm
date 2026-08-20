const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' }); // adjusted for running inside seed_forms directory

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedFssaiForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const fssaiSchema = {
      serviceName: 'FSSAI Registration',
      title: 'Complete Details',
      subtitle: 'FSSAI Application Form',
      fields: [
        {
          name: 'foodBusinessDetails',
          label: '1. Food Business Details',
          type: 'group',
          required: false,
          description: 'Select all that apply for the Nature of Food Business.',
          subFields: [
            { name: 'isManufacturer', label: 'Manufacturer', type: 'checkbox' },
            { name: 'isTrader', label: 'Trader', type: 'checkbox' },
            { name: 'isRetailer', label: 'Retailer', type: 'checkbox' },
            { name: 'isDistributor', label: 'Distributor', type: 'checkbox' },
            { name: 'isWholesaler', label: 'Wholesaler', type: 'checkbox' },
            { name: 'isRestaurant', label: 'Restaurant / Food Service', type: 'checkbox' },
            { name: 'isCaterer', label: 'Caterer', type: 'checkbox' },
            { name: 'isImporter', label: 'Importer', type: 'checkbox' },
            { name: 'isExporter', label: 'Exporter', type: 'checkbox' },
            { name: 'isStorage', label: 'Storage / Warehouse', type: 'checkbox' },
            { name: 'isTransporter', label: 'Transporter', type: 'checkbox' },
            { name: 'isEcommerce', label: 'E-commerce Food Seller', type: 'checkbox' },
            { name: 'isOtherNature', label: 'Other', type: 'checkbox' },
            { name: 'otherNature', label: 'Other Nature of Food Business', type: 'text', required: true, visibilityConditionStr: '{"field": "isOtherNature", "equals": true}' }
          ]
        },
        {
          name: 'businessDetails',
          label: '2. Business Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'annualTurnover', label: 'Expected Annual Turnover', type: 'dropdown', required: true, options: ['Below ₹12 Lakhs', '₹12 Lakhs to ₹20 Crores', 'Above ₹20 Crores'] },
            { name: 'businessType', label: 'Type of Business', type: 'dropdown', required: true, options: ['Proprietorship', 'Partnership', 'LLP', 'Private Limited Company', 'One Person Company', 'Other'] },
            { name: 'otherBusinessType', label: 'Other Type of Business', type: 'text', required: true, visibilityConditionStr: '{"field": "businessType", "equals": "Other"}' },
            { name: 'businessName', label: 'Name of Business', type: 'text', required: true },
            { name: 'companyPanNumber', label: 'Company PAN Number', type: 'text', required: true, description: 'Format: ABCDE1234F' },
            { name: 'startDate', label: 'When did your business start?', type: 'date', required: true, description: 'Cannot be a future date' }
          ]
        },
        {
          name: 'applicantDetails',
          label: '3. Applicant Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'fullName', label: 'Enter your full name', type: 'text', required: true },
            { name: 'aadhaarNumber', label: 'Aadhaar Number', type: 'number', required: true, description: 'Exactly 12 digits' },
            { name: 'mobile', label: 'Mobile Number (WhatsApp)', type: 'phone', required: true, description: 'Exactly 10 digits' },
            { name: 'email', label: 'Email ID', type: 'email', required: true },
            { name: 'employees', label: 'No. of Employees', type: 'number', required: true }
          ]
        },
        {
          name: 'premisesDetails',
          label: '4. Premises Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'premisesAddress', label: 'Address of Premises', type: 'text', required: true, description: 'Door/Plot no, block, street, area, district, state, country - pincode' },
            { name: 'premisesType', label: 'Premises Type', type: 'dropdown', required: true, options: ['Own', 'Rent'] }
          ]
        },
        {
          name: 'addressDetails',
          label: '5. Address Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'isCorrespondenceSame', label: 'Is your correspondence Address same as Address of Premises?', type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'corrAddress', label: 'Correspondence Address', type: 'text', required: true, visibilityConditionStr: '{"field": "isCorrespondenceSame", "equals": "No"}' }
          ]
        },
        {
          name: 'applicantDocuments',
          label: '6. Applicant Documents',
          type: 'group',
          required: false,
          subFields: [
            { name: 'passportPhoto', label: 'Passport Size Photo', type: 'file', required: true, allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'], description: 'Max 2 MB.' },
            { name: 'aadhaarCard', label: 'Aadhaar Card', type: 'file', required: true, allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'], description: 'Max 2 MB.' }
          ]
        },
        {
          name: 'businessDocuments',
          label: '7. Business Documents',
          type: 'group',
          required: false,
          subFields: [
            { name: 'unitEntrancePhoto', label: 'Photographs of the Unit (Entrance)', type: 'file', required: true, allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'], description: 'Max 2 MB.' },
            { name: 'panCard', label: 'PAN Card', type: 'file', required: true, allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'], description: 'Max 2 MB.' },
            { name: 'businessAddressProof', label: 'Business Address Proof', type: 'file', required: true, allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'], description: 'Rental Agreement / Electricity Bill / NOC / Utility Bill. Max 2 MB.' }
          ]
        },
        {
          name: 'declarationSection',
          label: '8. Declaration',
          type: 'group',
          required: false,
          subFields: [
            { name: 'isDeclared', label: 'I hereby declare that all information provided is true and correct to the best of my knowledge.', type: 'checkbox', required: true }
          ]
        }
      ],
      crossValidations: []
    };

    await FormSchema.findOneAndUpdate(
      { serviceName: 'FSSAI Registration' },
      fssaiSchema,
      { upsert: true, new: true }
    );

    console.log('Successfully seeded FSSAI Registration form schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedFssaiForm();
