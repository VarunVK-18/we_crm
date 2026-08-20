const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' }); // adjusted for running inside seed_forms directory

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedIsoForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const isoSchema = {
      serviceName: 'ISO Certification',
      title: 'Complete Details',
      subtitle: 'ISO Certification Form',
      fields: [
        {
          name: 'companyApplicantDetails',
          label: 'Company & Applicant Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'companyLegalName', label: 'Company Legal Name', type: 'text', required: true },
            { name: 'companyAddress', label: 'Company Address', type: 'text', required: true },
            { name: 'applicantName', label: 'Applicant Name', type: 'text', required: true },
            { name: 'email', label: 'Email ID', type: 'email', required: true },
            { name: 'whatsapp', label: 'WhatsApp Number', type: 'phone', required: true, description: 'Exactly 10 digits' },
            { name: 'courierAddress', label: 'Address for Couriering the ISO Certificate', type: 'text', required: true, description: 'Full Address with PIN Code' }
          ]
        },
        {
          name: 'isoCertificationDetails',
          label: 'ISO Certification Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'preferredIsoCertification', label: 'Preferred ISO Certification', type: 'dropdown', required: true, options: ['ISO 9001 - Quality Management System', 'ISO 27001 - Information Security Management System', 'ISO 14001 - Environment Management System', 'ISO 45001 - Occupational Health & Safety', 'ISO 20000 - Information Technology Service Management System', 'ISO 22000 - Food Safety Management System', 'ISO 13485 - Medical Device QMS', 'Other'] },
            { name: 'otherIsoCertification', label: 'Specify Other ISO Certification', type: 'text', required: true, visibilityConditionStr: '{"field": "preferredIsoCertification", "equals": "Other"}' }
          ]
        },
        {
          name: 'documents',
          label: 'Documents',
          type: 'group',
          required: false,
          subFields: [
            { name: 'msmeCertificate', label: 'MSME Certificate', type: 'file', required: true, allowedExtensions: ['pdf'], description: 'PDF only. Max 2 MB.' }
          ]
        },
        {
          name: 'verificationSection',
          label: 'Verification',
          type: 'group',
          required: false,
          subFields: [
            { name: 'verificationStatus', label: 'I hereby verify that the above mentioned facts are true and correct to the best of my knowledge and belief.', type: 'checkbox', required: true }
          ]
        }
      ],
      crossValidations: []
    };

    await FormSchema.findOneAndUpdate(
      { serviceName: 'ISO Certification' },
      isoSchema,
      { upsert: true, new: true }
    );

    console.log('Successfully seeded ISO Certification form schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedIsoForm();
