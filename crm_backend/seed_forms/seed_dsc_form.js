const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' }); // adjusted for running inside seed_forms directory

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedDscForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const dscSchema = {
      serviceName: 'Digital Signature Certificate (DSC)',
      title: 'Complete Details',
      subtitle: 'DSC Application Form',
      fields: [
        {
          name: 'applicationInformation',
          label: '1. Application Information',
          type: 'group',
          required: false,
          subFields: [
            { name: 'applyingFor', label: 'I\'m applying for', type: 'dropdown', required: true, options: ['Individual DSC for Company Incorporation / Registration', 'Organization DSC for DPIIT Certificate Purpose'] },
            { name: 'applicantName', label: 'Applicant Name (As per PAN)', type: 'text', required: true },
            { name: 'applicantPanNumber', label: 'Applicant PAN Number', type: 'text', required: true, description: 'Format: ABCDE1234F' },
            { name: 'applicantDob', label: 'Applicant Date of Birth', type: 'date', required: true, description: 'Cannot be a future date' },
            { name: 'applicantMail', label: 'Applicant Mail ID / Office Mail ID', type: 'email', required: true, description: 'For OTPs' },
            { name: 'applicantPhone', label: 'Applicant Phone Number', type: 'phone', required: true, description: 'For OTPs. Exactly 10 digits' },
            { name: 'organizationName', label: 'Organization Name', type: 'text', required: true },
            { name: 'organizationType', label: 'Organization Type', type: 'dropdown', required: true, options: ['Proprietorship', 'Partnership', 'LLP', 'Private Limited Company', 'Public Limited Company', 'Section 8 Company', 'AOP / BOI', 'NGO', 'Trust', 'Society', 'Bank', 'Government Organization', 'Department', 'HUF', 'Pvt Ltd', 'Foreign Company'] },
            { name: 'officeAddress', label: 'Office Address', type: 'text', required: true },
            { name: 'courierAddress', label: 'Address for couriering the DSC', type: 'text', required: true, description: 'Full Address with PIN code' }
          ]
        },
        {
          name: 'mandatoryDocuments',
          label: '2. Mandatory Documents',
          type: 'group',
          required: false,
          subFields: [
            { name: 'applicantPan', label: 'Applicant PAN Card', type: 'file', required: true, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' },
            { name: 'applicantAadhaar', label: 'Applicant Aadhaar Card', type: 'file', required: true, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' },
            { name: 'applicantPhoto', label: 'Applicant Photo', type: 'file', required: true, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' }
          ]
        },
        {
          name: 'optionalDocuments',
          label: '3. Optional Documents',
          type: 'group',
          required: false,
          subFields: [
            { name: 'certificateOfIncorporation', label: 'Certificate of Incorporation', type: 'file', required: false, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Optional. Max 2 MB.' },
            { name: 'organizationPan', label: 'Organization PAN', type: 'file', required: false, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Optional. Max 2 MB.' },
            { name: 'gstCertificate', label: 'GST Certificate', type: 'file', required: false, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Optional. Max 2 MB.' },
            { name: 'msmeCertificate', label: 'MSME (UDYAM) Certificate', type: 'file', required: false, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Optional. Max 2 MB.' },
            { name: 'otherDirectorPan', label: 'Other Director PAN', type: 'file', required: false, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Optional. Max 2 MB.' }
          ]
        },
        {
          name: 'verificationSection',
          label: '4. Verification',
          type: 'group',
          required: false,
          subFields: [
            { name: 'verification', label: 'I hereby verify that the above-mentioned facts are true and correct to the best of my knowledge and belief.', type: 'checkbox', required: true }
          ]
        }
      ],
      crossValidations: []
    };

    await FormSchema.findOneAndUpdate(
      { serviceName: 'Digital Signature Certificate (DSC)' },
      dscSchema,
      { upsert: true, new: true }
    );

    console.log('Successfully seeded DSC form schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedDscForm();
