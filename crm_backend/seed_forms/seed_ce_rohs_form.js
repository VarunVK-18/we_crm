const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' }); // adjusted for running inside seed_forms directory

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedCeRohsForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const ceRohsSchema = {
      title: 'Complete Details',
      subtitle: 'CE & RoHS Form',
      fields: [
        {
          name: 'productDetails',
          label: '1. Product Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'certificationType', label: 'Certification Type', type: 'dropdown', required: true, options: ['CE Certification', 'RoHS Certification', 'CE & RoHS'] },
            { name: 'productName', label: 'Product Name', type: 'text', required: true },
            { name: 'modelNumber', label: 'Model Number', type: 'text', required: true }
          ]
        },
        {
          name: 'companyDetails',
          label: '2. Company / Manufacturer Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'manufacturerName', label: 'Company Legal Name', type: 'text', required: true },
            { name: 'companyAddress', label: 'Company Address', type: 'text', required: true }
          ]
        },
        {
          name: 'contactDetails',
          label: '3. Contact Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'contactPerson', label: 'Contact Person Details', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'whatsapp', label: 'WhatsApp Number', type: 'phone', required: true, description: 'Exactly 10 digits' },
            { name: 'courierAddress', label: 'Courier Address', type: 'text', required: true }
          ]
        },
        {
          name: 'productSpecsSection',
          label: '4. Product Specifications',
          type: 'group',
          required: false,
          subFields: [
            { name: 'productSpecs', label: 'Product Specifications (Voltage, Power, etc.)', type: 'text', required: true }
          ]
        },
        {
          name: 'requiredDocs',
          label: '5. Required Documents',
          type: 'group',
          required: false,
          subFields: [
            { name: 'productDatasheet', label: 'Product Datasheet', type: 'file', required: true, allowedExtensions: ['pdf'], description: 'PDF only. Max 2 MB.' },
            { name: 'userManual', label: 'User Manual', type: 'file', required: true, allowedExtensions: ['pdf'], description: 'PDF only. Max 2 MB.' },
            { name: 'bom', label: 'Bill of Materials (BOM)', type: 'file', required: true, allowedExtensions: ['pdf'], description: 'PDF only. Max 2 MB.' },
            { name: 'productImages', label: 'Product Images', type: 'file', required: true, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'JPG/PNG/PDF. Max 2 MB.' }
          ]
        },
        {
          name: 'optionalDocs',
          label: '6. Optional Documents',
          type: 'group',
          required: false,
          subFields: [
            { name: 'circuitDiagram', label: 'Circuit Diagram / PCB Details', type: 'file', required: false, allowedExtensions: ['pdf'], description: 'Optional. PDF only. Max 2 MB.' },
            { name: 'testReports', label: 'Existing Test Reports/Certificates', type: 'file', required: false, allowedExtensions: ['pdf'], description: 'Optional. PDF only. Max 2 MB.' }
          ]
        }
      ],
      crossValidations: []
    };

    // Update for both CE Certification and RoHS Certification
    await FormSchema.findOneAndUpdate(
      { serviceName: 'CE Certification' },
      { serviceName: 'CE Certification', ...ceRohsSchema },
      { upsert: true, new: true }
    );

    await FormSchema.findOneAndUpdate(
      { serviceName: 'RoHS Certification' },
      { serviceName: 'RoHS Certification', ...ceRohsSchema },
      { upsert: true, new: true }
    );

    console.log('Successfully seeded CE & RoHS form schemas!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedCeRohsForm();
