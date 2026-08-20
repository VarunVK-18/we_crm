const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' }); // adjusted for running inside seed_forms directory

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedPatentForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const patentSchema = {
      serviceName: 'Patent Registration',
      title: 'Complete Details',
      subtitle: 'Patent Registration Form',
      fields: [
        {
          name: 'applicantDetails',
          label: 'Applicant Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'applicantName', label: 'Applicant Name', type: 'text', required: true, description: 'Individual / Company name' },
            { name: 'entityType', label: 'Entity Type', type: 'dropdown', required: true, options: ['Individual', 'Startup', 'Small Entity', 'Educational Institution', 'Corporate / Other'] },
            { name: 'mobileNumber', label: 'Mobile Number', type: 'phone', required: true, description: 'Exactly 10 digits' },
            { name: 'emailId', label: 'Email ID', type: 'email', required: true },
            { name: 'address', label: 'Address', type: 'text', required: true }
          ]
        },
        {
          name: 'inventionDetails',
          label: 'Invention Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'inventionTitle', label: 'Invention Title', type: 'text', required: true },
            { name: 'inventionDescription', label: 'Invention Description', type: 'text', required: true },
            { name: 'industryCategory', label: 'Industry Category', type: 'text', required: true, description: 'Example: Software, Mechanical, Pharma, Electronics, etc.' },
            { name: 'inventorNames', label: 'Inventor Name(s)', type: 'text', required: true, description: 'Comma separated list of inventors' }
          ]
        },
        {
          name: 'primaryInventorDetails',
          label: 'Primary Inventor Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'inventorName', label: 'Inventor Name', type: 'text', required: true },
            { name: 'inventorNationality', label: 'Nationality', type: 'text', required: true },
            { name: 'inventorAddress', label: 'Inventor Address', type: 'text', required: true }
          ]
        },
        {
          name: 'documents',
          label: 'Document Uploads',
          type: 'group',
          required: false,
          subFields: [
            { name: 'identityProof', label: 'Identity Proof', type: 'file', required: true, allowedExtensions: ['pdf'], description: 'Aadhaar / Passport / PAN. PDF only. Max 2 MB.' },
            { name: 'addressProof', label: 'Address Proof', type: 'file', required: true, allowedExtensions: ['pdf'], description: 'PDF only. Max 2 MB.' },
            { name: 'inventionDescriptionDoc', label: 'Invention Description', type: 'file', required: true, allowedExtensions: ['pdf', 'doc', 'docx'], description: 'Detailed invention description document. PDF/DOC/DOCX. Max 2 MB.' },
            { name: 'drawingsDiagrams', label: 'Drawings / Diagrams', type: 'file', required: false, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'PDF/JPG/PNG. Max 2 MB.' },
            { name: 'authLetter', label: 'Authorization Letter', type: 'file', required: false, allowedExtensions: ['pdf', 'doc', 'docx'], description: 'PDF/DOC/DOCX. Max 2 MB.' }
          ]
        }
      ],
      crossValidations: []
    };

    await FormSchema.findOneAndUpdate(
      { serviceName: 'Patent Registration' },
      patentSchema,
      { upsert: true, new: true }
    );

    console.log('Successfully seeded Patent form schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedPatentForm();
