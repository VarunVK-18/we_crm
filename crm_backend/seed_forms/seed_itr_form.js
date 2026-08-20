const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' }); // adjusted for running inside seed_forms directory

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedItrForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const itrSchema = {
      serviceName: 'Income Tax Return (ITR)',
      title: 'Complete Details',
      subtitle: 'Income Tax Return (ITR) Form',
      fields: [
        {
          name: 'taxpayerInfo',
          label: 'Taxpayer / Business Information',
          type: 'group',
          required: false,
          subFields: [
            { name: 'legalName', label: 'Legal Name / Taxpayer Name', type: 'text', required: true },
            { name: 'pan', label: 'PAN', type: 'text', required: true, description: 'Format: XXXXX9999X' },
            { name: 'email', label: 'Email ID', type: 'email', required: true },
            { name: 'mobile', label: 'Mobile Number', type: 'phone', required: true, description: 'Exactly 10 digits' },
            { name: 'address', label: 'Address', type: 'text', required: true },
            { name: 'assessmentYear', label: 'Assessment Year', type: 'dropdown', required: true, options: ['2023-24', '2024-25', '2025-26'] },
            { name: 'financialYear', label: 'Financial Year', type: 'dropdown', required: true, options: ['2022-23', '2023-24', '2024-25'] },
            { name: 'taxpayerType', label: 'Taxpayer Type', type: 'dropdown', required: true, options: ['Individual', 'Proprietorship', 'Partnership', 'LLP', 'Private Limited Company', 'Public Limited Company', 'Other'] }
          ]
        },
        {
          name: 'financialInfo',
          label: 'Financial Information',
          type: 'group',
          required: false,
          subFields: [
            { name: 'grossTotalIncome', label: 'Gross Total Income', type: 'number', required: true },
            { name: 'totalBusinessTurnover', label: 'Total Business Turnover', type: 'number', required: false },
            { name: 'salaryIncome', label: 'Salary Income', type: 'number', required: false },
            { name: 'businessIncome', label: 'Business / Professional Income', type: 'number', required: false },
            { name: 'otherIncome', label: 'Other Income', type: 'number', required: false },
            { name: 'tdsDeducted', label: 'TDS Deducted', type: 'number', required: false },
            { name: 'advanceTaxPaid', label: 'Advance Tax Paid', type: 'number', required: false },
            { name: 'selfAssessmentTaxPaid', label: 'Self Assessment Tax Paid', type: 'number', required: false },
            { name: 'bankInterestIncome', label: 'Bank Interest Income', type: 'number', required: false }
          ]
        },
        {
          name: 'requiredDocuments',
          label: 'Required Documents',
          type: 'group',
          required: false,
          subFields: [
            { name: 'bankStatement', label: 'Bank Statement', type: 'file', required: true, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' },
            { name: 'form16', label: 'Form 16 / Salary Certificate', type: 'file', required: false, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Required for salary income. Max 2 MB.' },
            { name: 'form26as', label: 'Form 26AS / AIS', type: 'file', required: true, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' },
            { name: 'previousItr', label: 'Previous Year ITR', type: 'file', required: false, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' },
            { name: 'purchaseBills', label: 'Purchase Bills', type: 'file', required: false, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Required for business. Max 2 MB.' },
            { name: 'salesInvoices', label: 'Sales Invoices', type: 'file', required: false, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Required for business. Max 2 MB.' },
            { name: 'companyPan', label: 'Company / Business PAN', type: 'file', required: true, visibilityConditionStr: '{"field": "taxpayerType", "in": ["Proprietorship", "Partnership", "LLP", "Private Limited Company", "Public Limited Company"]}', allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Max 2 MB.' }
          ]
        },
        {
          name: 'optionalDocuments',
          label: 'Optional Documents',
          type: 'group',
          required: false,
          subFields: [
            { name: 'previousTaxComputation', label: 'Previous Tax Computation', type: 'file', required: false, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Optional. Max 2 MB.' },
            { name: 'gstReturns', label: 'GST Returns', type: 'file', required: false, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Optional. Max 2 MB.' },
            { name: 'tdsCertificates', label: 'TDS Certificates', type: 'file', required: false, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Optional. Max 2 MB.' },
            { name: 'investmentProofs', label: 'Investment Proofs', type: 'file', required: false, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Optional. Max 2 MB.' },
            { name: 'loanInterestCertificate', label: 'Loan Interest Certificate', type: 'file', required: false, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Optional. Max 2 MB.' },
            { name: 'otherDocs', label: 'Other Supporting Documents', type: 'file', required: false, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], description: 'Optional. Max 2 MB.' }
          ]
        },
        {
          name: 'declarationSection',
          label: 'Declaration',
          type: 'group',
          required: false,
          subFields: [
            { name: 'isVerified', label: 'I hereby declare that the information and documents provided by me are true and correct to the best of my knowledge.', type: 'checkbox', required: true }
          ]
        }
      ],
      crossValidations: []
    };

    await FormSchema.findOneAndUpdate(
      { serviceName: 'Income Tax Return (ITR)' },
      itrSchema,
      { upsert: true, new: true }
    );

    console.log('Successfully seeded upgraded ITR form schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedItrForm();
