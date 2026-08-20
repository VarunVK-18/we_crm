const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' }); // adjusted for running inside seed_forms directory

const FormSchema = require('../models/FormSchema');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';

async function seedDpiitForm() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const dpiitSchema = {
      serviceName: 'DPIIT Recognition',
      title: 'Complete Details',
      subtitle: 'DPIIT Startup Recognition Form',
      fields: [
        {
          name: 'dscCompanyDetails',
          label: '1. DSC & Company Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'orgDsc', label: 'Organization DSC Available?', type: 'dropdown', required: true, options: ['Yes', 'No, I want one'] },
            { name: 'fullName', label: 'Company / Applicant Full Name', type: 'text', required: true },
            { name: 'companyEmail', label: 'Company Email', type: 'email', required: true },
            { name: 'companyMobile', label: 'Company Mobile Number', type: 'phone', required: true, description: 'Exactly 10 digits' },
            { name: 'cinNumber', label: 'CIN Number', type: 'text', required: true },
            { name: 'companyPan', label: 'Company PAN Number', type: 'text', required: true, description: 'Format: ABCDE1234F' },
            { name: 'companyPanName', label: 'Company PAN Card Name', type: 'text', required: true },
            { name: 'companyAddress', label: 'Business Address', type: 'text', required: true }
          ]
        },
        {
          name: 'authSignatoryDetails',
          label: '2. Authorized Signatory Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'signatoryPan', label: 'PAN of Authorized Signatory', type: 'text', required: true, description: 'Format: ABCDE1234F' },
            { name: 'signatoryFirstName', label: 'PAN First Name', type: 'text', required: true },
            { name: 'signatoryLastName', label: 'PAN Last Name', type: 'text', required: true },
            { name: 'signatoryDob', label: 'PAN Date of Birth', type: 'date', required: true, description: 'Cannot be a future date' }
          ]
        },
        {
          name: 'companyStartupDetails',
          label: '3. Company / Startup Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'companyBrief', label: 'Brief About Company / Startup', type: 'text', required: true },
            { name: 'companyWebsite', label: 'Company Website', type: 'text', required: true, description: 'e.g. https://example.com' }
          ]
        },
        {
          name: 'authRepresentativeDetails',
          label: '4. Authorized Representative Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'repName', label: 'Authorized Representative Name', type: 'text', required: true },
            { name: 'repMobile', label: 'Authorized Representative Mobile', type: 'phone', required: true, description: 'Exactly 10 digits' },
            { name: 'repEmail', label: 'Authorized Representative Email', type: 'email', required: true }
          ]
        },
        {
          name: 'founderDirectorDetails',
          label: '5. Founder / Director Details',
          type: 'group',
          required: false,
          subFields: [
            { name: 'directorName', label: 'Founder / Director Name', type: 'text', required: true },
            { name: 'directorGender', label: 'Gender', type: 'dropdown', required: true, options: ['Male', 'Female', 'Other'] },
            { name: 'directorMobile', label: 'Director Mobile Number', type: 'phone', required: true, description: 'Exactly 10 digits' },
            { name: 'directorEmail', label: 'Director Email', type: 'email', required: true },
            { name: 'directorAddress', label: 'Director Address', type: 'text', required: true },
            { name: 'directorDob', label: 'Date of Birth', type: 'date', required: true, description: 'Cannot be a future date' },
            { name: 'employeeCount', label: 'Current Number of Employees', type: 'number', required: true }
          ]
        },
        {
          name: 'startupInformation',
          label: '6. Startup Information',
          type: 'group',
          required: false,
          subFields: [
            { name: 'iprApplied', label: 'Applied for IPR?', type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'iprDetails', label: 'Provide IPR Details', type: 'text', required: true, visibilityConditionStr: '{"field": "iprApplied", "equals": "Yes"}' },
            { name: 'fundsReceived', label: 'Received any Funds?', type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'fundingDetails', label: 'Provide Funding Details', type: 'text', required: true, visibilityConditionStr: '{"field": "fundsReceived", "equals": "Yes"}' },
            { name: 'awardsReceived', label: 'Received any Awards?', type: 'dropdown', required: true, options: ['Yes', 'No'] },
            { name: 'awardDetails', label: 'Provide Award Details', type: 'text', required: true, visibilityConditionStr: '{"field": "awardsReceived", "equals": "Yes"}' }
          ]
        },
        {
          name: 'documentUploads',
          label: '7. Documents',
          type: 'group',
          required: false,
          subFields: [
            { name: 'incorpCert', label: 'Incorporation Certificate', type: 'file', required: true, allowedExtensions: ['pdf'], description: 'PDF only. Max 2 MB.' },
            { name: 'companyLogo', label: 'Company Logo', type: 'file', required: true, allowedExtensions: ['jpg', 'jpeg'], description: 'JPG/JPEG only. Max 2 MB.' }
          ]
        },
        {
          name: 'declarationSection',
          label: '8. Declaration',
          type: 'group',
          required: false,
          subFields: [
            { name: 'isDeclared', label: 'I hereby verify that the above mentioned facts are true and correct to the best of my knowledge.', type: 'checkbox', required: true }
          ]
        }
      ],
      crossValidations: []
    };

    await FormSchema.findOneAndUpdate(
      { serviceName: 'DPIIT Recognition' },
      dpiitSchema,
      { upsert: true, new: true }
    );

    console.log('Successfully seeded DPIIT Recognition form schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedDpiitForm();
