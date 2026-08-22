const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' }); // adjusted for running inside seed_forms directory

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedGstReturnForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const gstReturnSchema = {
      serviceName: 'GST Returns Filing',
      title: 'Complete Details',
      subtitle: 'GST Return Filing Form',
      fields: [
        {
          name: 'filingInfo',
          label: '1. GST Return Filing Information',
          type: 'group',
          required: false,
          subFields: [
            { name: 'gstin', label: 'GSTIN', type: 'text', required: true, description: 'Format: 22AAAAA0000A1Z5' },
            { name: 'legalName', label: 'Legal Name of Business', type: 'text', required: true },
            { name: 'tradeName', label: 'Trade Name', type: 'text', required: false },
            { name: 'returnPeriod', label: 'Return Period / Tax Period', type: 'dropdown', required: true, options: ['April 2026', 'May 2026', 'June 2026', 'July 2026', 'August 2026', 'September 2026'] },
            { name: 'returnType', label: 'Return Type', type: 'dropdown', required: true, options: ['GSTR-1', 'GSTR-3B', 'GSTR-1 & GSTR-3B', 'Other'] },
            { name: 'businessEmail', label: 'Business Email ID', type: 'email', required: false },
            { name: 'businessPhone', label: 'Business Phone Number', type: 'phone', required: false, description: 'Exactly 10 digits' }
          ]
        },
        {
          name: 'returnDetails',
          label: '2. Return Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'totalSales', label: 'Total Sales / Turnover', type: 'number', required: false },
            { name: 'taxableSales', label: 'Taxable Sales', type: 'number', required: false },
            { name: 'exemptSales', label: 'Exempt Sales', type: 'number', required: false },
            { name: 'nilRatedSales', label: 'Nil Rated Sales', type: 'number', required: false },
            { name: 'totalPurchases', label: 'Total Purchases', type: 'number', required: false },
            { name: 'eligibleItc', label: 'Eligible ITC', type: 'number', required: false },
            { name: 'outputGst', label: 'Output GST', type: 'number', required: false },
            { name: 'inputGst', label: 'Input GST / ITC', type: 'number', required: false },
            { name: 'reverseCharge', label: 'Reverse Charge', type: 'number', required: false }
          ]
        },
        {
          name: 'documents',
          label: '3. Documents',
          type: 'group',
          required: false,
          subFields: [
            { name: 'bankStatements', label: 'Bank Statements (Current Account)', type: 'file', required: true, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' },
            { name: 'purchaseBills', label: 'Purchase Bills', type: 'file', required: true, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' },
            { name: 'salesInvoices', label: 'Sales Invoice Copies', type: 'file', required: true, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' },
            { name: 'companyPan', label: 'Company PAN Card', type: 'file', required: true, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' }
          ]
        },
        {
          name: 'declarationSection',
          label: '4. Declaration',
          type: 'group',
          required: false,
          subFields: [
            { name: 'isDeclared', label: 'I hereby declare that the information and documents provided for GST return filing are true and correct to the best of my knowledge.', type: 'checkbox', required: true }
          ]
        }
      ],
      crossValidations: []
    };

    await FormSchema.findOneAndUpdate(
      { serviceName: 'GST Returns Filing' },
      gstReturnSchema,
      { upsert: true, new: true }
    );

    console.log('Successfully seeded GST Returns Filing form schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedGstReturnForm();
