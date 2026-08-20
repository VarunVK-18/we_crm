const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' }); // adjusted for running inside seed_forms directory

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedMcaComplianceForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const mcaSchema = {
      serviceName: 'MCA Compliance',
      title: 'Complete Details',
      subtitle: 'MCA Compliance Form',
      fields: [
        {
          name: 'businessDetails',
          label: 'Business Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'annualTurnover', label: 'Expected Annual Turnover', type: 'dropdown', required: true, options: ['Less than ₹20 Lakhs', 'Greater than ₹20 Lakhs and Less than ₹50 Lakhs', 'Greater than ₹50 Lakhs'] }
          ]
        },
        {
          name: 'credentials',
          label: 'Credentials (Optional)',
          type: 'group',
          required: false,
          subFields: [
            { name: 'mcaUsername', label: 'MCA Username', type: 'text', required: false },
            { name: 'mcaPassword', label: 'MCA Password', type: 'password', required: false }
          ]
        },
        {
          name: 'documents',
          label: 'Documents Required',
          type: 'group',
          required: false,
          subFields: [
            { name: 'coi', label: 'Certificate of Incorporation', type: 'file', required: true, description: 'PDF only. Max 2 MB.' },
            { name: 'pan', label: 'PAN Card of the Company', type: 'file', required: true, description: 'PDF only. Max 2 MB.' },
            { name: 'moa', label: 'Memorandum of Association (MOA)', type: 'file', required: true, description: 'PDF only. Max 2 MB.' },
            { name: 'aoa', label: 'Articles of Association (AOA)', type: 'file', required: true, description: 'PDF only. Max 2 MB.' },
            { name: 'bankStatement', label: 'Last FY Bank Statements', type: 'file', required: true, description: 'PDF only. Max 2 MB.' },
            { name: 'salesInvoice', label: 'Sales Invoice Copies of Last FY', type: 'file', required: true, description: 'PDF only. Max 2 MB.' },
            { name: 'purchaseBills', label: 'Purchase Bills of Last FY', type: 'file', required: true, description: 'PDF only. Max 2 MB.' }
          ]
        }
      ],
      crossValidations: []
    };

    await FormSchema.findOneAndUpdate(
      { serviceName: 'MCA Compliance' },
      mcaSchema,
      { upsert: true, new: true }
    );

    console.log('Successfully seeded MCA Compliance form schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedMcaComplianceForm();
