const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' }); // adjusted for running inside seed_forms directory

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedLeiForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const leiSchema = {
      serviceName: 'LEI Registration',
      title: 'Complete Details',
      subtitle: 'LEI Code Application',
      fields: [
        {
          name: 'companyDetails',
          label: '1. Company Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'companyName', label: 'Company Name', type: 'text', required: true },
            { name: 'cinNumber', label: 'CIN Number', type: 'text', required: true },
            { name: 'companyAddress', label: 'Company Address', type: 'text', required: true }
          ]
        },
        {
          name: 'applicantDetails',
          label: '2. Applicant Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'applicantName', label: 'Applicant Name', type: 'text', required: true },
            { name: 'email', label: 'Email ID', type: 'email', required: true },
            { name: 'businessPhone', label: 'Business Phone Number', type: 'phone', required: true, description: 'Exactly 10 digits' }
          ]
        },
        {
          name: 'requiredDocument',
          label: '3. Required Document',
          type: 'group',
          required: false,
          subFields: [
            { name: 'incorpCert', label: 'Incorporation Certificate', type: 'file', required: true, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' }
          ]
        },
        {
          name: 'declarationSection',
          label: '4. Declaration',
          type: 'group',
          required: false,
          subFields: [
            { name: 'declaration', label: 'I hereby declare that all information provided is true and correct to the best of my knowledge.', type: 'checkbox', required: true }
          ]
        }
      ],
      crossValidations: []
    };

    await FormSchema.findOneAndUpdate(
      { serviceName: 'LEI Registration' },
      leiSchema,
      { upsert: true, new: true }
    );

    console.log('Successfully seeded LEI form schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedLeiForm();
