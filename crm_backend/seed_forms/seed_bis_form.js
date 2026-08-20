const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedBisForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const bisSchema = {
      serviceName: 'BIS Certification',
      title: 'Complete Details',
      subtitle: 'BIS Certification Form',
      fields: [
        {
          name: 'companyDetails',
          label: 'Company & Applicant Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'companyLegalName', label: 'Company Legal Name', type: 'text', required: true },
            { name: 'companyAddress', label: 'Company Address', type: 'text', required: true, description: 'Full Address with PIN code' },
            { name: 'applicantName', label: 'Applicant Name', type: 'text', required: true },
            { name: 'email', label: 'Email ID', type: 'email', required: true },
            { name: 'whatsapp', label: 'WhatsApp Number', type: 'phone', required: true },
            { name: 'courierAddress', label: 'Address for couriering the ISO Certificate', type: 'text', required: true, description: 'Full Address with PIN code' }
          ]
        },
        {
          name: 'documents',
          label: 'Documents',
          type: 'group',
          required: false,
          subFields: [
            { name: 'msmeCertificate', label: 'Upload MSME Certificate', type: 'file', required: true, description: 'Upload 1 supported file. Max 2 MB.' }
          ]
        },
        {
          name: 'verification',
          label: 'Verification',
          type: 'group',
          required: false,
          subFields: [
            { name: 'isVerified', label: 'I hereby verify that above mentioned facts are true and correct to best of my knowledge and belief', type: 'checkbox', required: true }
          ]
        }
      ],
      crossValidations: []
    };

    await FormSchema.findOneAndUpdate(
      { serviceName: 'BIS Certification' },
      bisSchema,
      { upsert: true, new: true }
    );

    console.log('Successfully seeded BIS form schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedBisForm();
