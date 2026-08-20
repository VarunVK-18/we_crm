const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' }); // adjusted for running inside seed_forms directory

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedGstCancellationForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const gstCancellationSchema = {
      serviceName: 'GST Cancellation',
      title: 'Complete Details',
      subtitle: 'GST Cancellation Form',
      fields: [
        {
          name: 'businessDetails',
          label: 'Step 1: Business Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'businessName', label: 'Business Name', type: 'text', required: true },
            { name: 'gstin', label: 'GSTIN', type: 'text', required: true, description: 'Format: 15-character GSTIN (e.g. 22AAAAA0000A1Z5)' },
            { name: 'entityType', label: 'Entity Type', type: 'dropdown', required: true, options: ['Proprietorship', 'Partnership', 'LLP', 'Private Limited Company', 'One Person Company (OPC)'] },
            { name: 'mobileNumber', label: 'Mobile Number', type: 'phone', required: true, description: 'Exactly 10 digits' },
            { name: 'emailId', label: 'Email ID', type: 'email', required: true }
          ]
        },
        {
          name: 'cancellationDetails',
          label: 'Step 2: Cancellation Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'cancellationReasonType', label: 'Reason for Cancellation', type: 'dropdown', required: true, options: ['Discontinuance or closure of business', 'Transfer of business', 'Change in constitution of business', 'Death of sole proprietor', 'Amalgamation / merger / de-merger', 'Change in business structure', 'No longer liable to be registered', 'Other'] },
            { name: 'reasonForCancellation', label: 'Additional Details / Specific Reason', type: 'text', required: false, description: 'Required if "Other" is selected.' },
            { name: 'effectiveCancellationDate', label: 'Effective Cancellation Date', type: 'date', required: true, description: 'Cannot be a future date' }
          ]
        },
        {
          name: 'documentUploads',
          label: 'Step 3: Document Uploads',
          type: 'group',
          required: false,
          subFields: [
            { name: 'gstCert', label: 'GST Registration Certificate', type: 'file', required: true, allowedExtensions: ['pdf'], description: 'PDF only. Max 2 MB.' },
            { name: 'panCard', label: 'PAN Card', type: 'file', required: true, allowedExtensions: ['pdf'], description: 'PDF only. Max 2 MB.' },
            { name: 'supportDocs', label: 'Supporting Documents', type: 'file', required: false, allowedExtensions: ['pdf'], description: 'Optional unless reason requires proof. PDF only. Max 2 MB.' }
          ]
        }
      ],
      crossValidations: []
    };

    await FormSchema.findOneAndUpdate(
      { serviceName: 'GST Cancellation' },
      gstCancellationSchema,
      { upsert: true, new: true }
    );

    console.log('Successfully seeded GST Cancellation form schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedGstCancellationForm();
