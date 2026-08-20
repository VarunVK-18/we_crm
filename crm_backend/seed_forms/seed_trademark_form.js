const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedTrademarkForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const trademarkSchema = {
      serviceName: 'Trademark Registration',
      title: 'Complete Details',
      subtitle: 'Trademark Registration Form',
      fields: [
        {
          name: 'applicantDetails',
          label: 'Applicant / Company Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'companyName', label: 'Company / Business Name', type: 'text', required: true },
            { name: 'udyamNumber', label: 'UDYAM MSME Number', type: 'text', required: true, description: 'Format: UDYAM-XX-00-0000000' },
            { name: 'msmeType', label: 'MSME Type', type: 'dropdown', required: true, options: ['Micro', 'Small', 'Medium'] },
            { name: 'applicantName', label: 'Applicant Name', type: 'text', required: true },
            { name: 'companyAddress', label: 'Address of the Company', type: 'text', required: true },
            { name: 'tradeDescription', label: 'Trade Description', type: 'dropdown', required: true, options: ['Goods', 'Services'] },
            { name: 'categoryOfMark', label: 'Category of Mark', type: 'dropdown', required: true, options: ['Word Mark', 'Device Mark'], description: 'Word Mark: includes one or more words, letters, numerals. Device Mark: includes a label, sticker, monogram, logo or graphical representation.' },
            { name: 'companyMobile', label: 'Company Mobile Number', type: 'phone', required: true, description: 'Exactly 10 digits' },
            { name: 'companyEmail', label: 'Company Email ID', type: 'email', required: true },
            { name: 'partnersName', label: 'Partners Name if Partnership Firm', type: 'text', required: false, description: 'Leave blank if not applicable.' },
            { name: 'businessDescription', label: 'Business Description', type: 'text', required: true, description: 'Describe your business/products/services.' },
            { name: 'dateFirstUsed', label: 'Date of Trade / Brand Name First Used / Date of Company Incorporation', type: 'date', required: true }
          ]
        },
        {
          name: 'documents',
          label: 'Document Uploads',
          type: 'group',
          required: false,
          subFields: [
            { name: 'udyamCert', label: 'UDYAM MSME Certificate', type: 'file', required: true, description: 'PDF/JPG/PNG. Max 2 MB.' },
            { name: 'trademarkLogo', label: 'Trademark Logo', type: 'file', required: true, description: 'PDF/JPG/PNG. Max 2 MB.' },
            { name: 'signature', label: 'Signature with Name', type: 'file', required: true, description: 'PDF/JPG/PNG. Max 2 MB.' }
          ]
        },
        {
          name: 'verificationSection',
          label: 'Verification',
          type: 'group',
          required: false,
          subFields: [
            { name: 'isVerified', label: 'I hereby verify that the above mentioned facts are true and correct to the best of my knowledge and belief.', type: 'checkbox', required: true }
          ]
        }
      ],
      crossValidations: []
    };

    await FormSchema.findOneAndUpdate(
      { serviceName: 'Trademark Registration' },
      trademarkSchema,
      { upsert: true, new: true }
    );

    console.log('Successfully seeded Trademark form schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedTrademarkForm();
