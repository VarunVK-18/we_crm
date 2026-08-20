const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' }); // adjusted for running inside seed_forms directory

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedCopyrightForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const copyrightSchema = {
      serviceName: 'Copyright Registration',
      title: 'Complete Details',
      subtitle: 'Copyright Registration Form',
      fields: [
        {
          name: 'applicantDetails',
          label: '1. Applicant Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'applicantName', label: 'Applicant Name', type: 'text', required: true },
            { name: 'applicantEmail', label: 'Applicant Email', type: 'email', required: true },
            { name: 'applicantPhone', label: 'Applicant Phone Number', type: 'phone', required: true, description: 'Exactly 10 digits' },
            { name: 'applicantAddress', label: 'Applicant Address', type: 'text', required: true }
          ]
        },
        {
          name: 'workDetails',
          label: '2. Details of the Work',
          type: 'group',
          required: false,
          subFields: [
            { name: 'workTitle', label: 'Title of the Work', type: 'text', required: true },
            { name: 'workType', label: 'Type of Work', type: 'dropdown', required: true, options: ['Literary / Dramatic', 'Musical', 'Artistic', 'Cinematograph Film', 'Sound Recording', 'Computer Software / IT'] },
            { name: 'language', label: 'Language of the Work', type: 'text', required: true },
            { name: 'workDescription', label: 'Brief Description of the Work', type: 'text', required: true }
          ]
        },
        {
          name: 'authorDetails',
          label: '3. Author Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'isApplicantAuthor', label: 'Is the Applicant the Author of the work?', type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'authorName', label: 'Author Name', type: 'text', required: true, visibilityConditionStr: '{"field": "isApplicantAuthor", "equals": "No"}' },
            { name: 'authorAddress', label: 'Author Address', type: 'text', required: true, visibilityConditionStr: '{"field": "isApplicantAuthor", "equals": "No"}' }
          ]
        },
        {
          name: 'documents',
          label: '4. Documents',
          type: 'group',
          required: false,
          subFields: [
            { name: 'copyOfWork', label: 'Copy of the Work', type: 'file', required: true, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'mp3', 'mp4', 'zip'], description: 'Max 2 MB.' },
            { name: 'applicantIdProof', label: 'Applicant ID Proof (PAN/Aadhaar)', type: 'file', required: true, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' },
            { name: 'nocFromAuthor', label: 'NOC from Author', type: 'file', required: true, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Required if Applicant is not the Author. Max 2 MB.', visibilityConditionStr: '{"field": "isApplicantAuthor", "equals": "No"}' }
          ]
        },
        {
          name: 'declarationSection',
          label: '5. Declaration',
          type: 'group',
          required: false,
          subFields: [
            { name: 'declaration', label: 'I hereby declare that the work is original and all information provided is true and correct.', type: 'checkbox', required: true }
          ]
        }
      ],
      crossValidations: []
    };

    await FormSchema.findOneAndUpdate(
      { serviceName: 'Copyright Registration' },
      copyrightSchema,
      { upsert: true, new: true }
    );

    console.log('Successfully seeded Copyright form schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedCopyrightForm();
