const mongoose = require('mongoose');

const schema = {
  serviceName: 'Company Profile',
  title: 'Complete Details',
  subtitle: 'Company Profile Form',
  fields: [
    {
      name: 'businessDetails',
      label: 'Business Details',
      type: 'group',
      required: false,
      subFields: [
        { name: 'companyName', label: 'Company / Business Name', type: 'text', required: true },
        { name: 'businessType', label: 'Business Type (LLP, Pvt Ltd, etc.)', type: 'text', required: true, validation: { regex: "^(?=.*[A-Za-z])[A-Za-z0-9\\\\s\\\\.,&'-]+$", errorMessage: "Must contain at least one letter. Special characters limited to .,&'-" } },
        { name: 'natureOfBusiness', label: 'Nature of Business', type: 'text', required: true, validation: { regex: "^(?=.*[A-Za-z])[A-Za-z0-9\\\\s\\\\.,&'-]+$", errorMessage: "Must contain at least one letter. Special characters limited to .,&'-" } },
        { name: 'cin', label: 'CIN (Corporate Identification Number)', type: 'text', required: false },
        { name: 'incorporationDate', label: 'Date of Incorporation (YYYY-MM-DD)', type: 'date', required: false },
        { name: 'annualTurnover', label: 'Annual Turnover', type: 'dropdown', required: true, options: ['Less than ₹20 Lakhs', '₹20-50 Lakhs', 'Greater than ₹50 Lakhs'] }
      ]
    },
    {
      name: 'contactDetails',
      label: 'Contact Details',
      type: 'group',
      required: false,
      subFields: [
        { name: 'companyEmail', label: 'Company Email', type: 'email', required: true },
        { name: 'companyPhone', label: 'Company Phone', type: 'text', required: true },
        { name: 'registeredAddress', label: 'Registered Address', type: 'text', required: true },
        { name: 'city', label: 'City', type: 'text', required: true },
        { name: 'state', label: 'State', type: 'text', required: true },
        { name: 'postalCode', label: 'Postal Code', type: 'text', required: true }
      ]
    },
    {
      name: 'directorDetails',
      label: 'Director / Founder Details',
      type: 'group',
      required: false,
      subFields: [
        { name: 'directorName', label: 'Director / Founder Name', type: 'text', required: true },
        { name: 'directorEmail', label: 'Director Email', type: 'email', required: true },
        { name: 'directorMobile', label: 'Director Mobile', type: 'text', required: true },
        { name: 'directorPan', label: 'Director PAN', type: 'text', required: true },
        { name: 'directorAadhaar', label: 'Director Aadhaar', type: 'text', required: true },
        { name: 'directorDin', label: 'Director DIN', type: 'text', required: false }
      ]
    },
    {
      name: 'taxDetails',
      label: 'Tax & Certifications (Optional)',
      type: 'group',
      required: false,
      subFields: [
        { name: 'companyPan', label: 'Company PAN', type: 'text', required: false },
        { name: 'gstin', label: 'GSTIN', type: 'text', required: false },
        { name: 'udyamNumber', label: 'Udyam / MSME Number', type: 'text', required: false },
        { name: 'trademarkNo', label: 'Trademark Application / Cert Number', type: 'text', required: false, validation: { regex: "^[A-Za-z0-9/-]{3,30}$", errorMessage: "3–30 characters, letters/numbers, / and - allowed" } },
        { name: 'dpiitRefNo', label: 'DPIIT Registration Number', type: 'text', required: false, validation: { regex: "^DIPP[0-9]{3,10}$", errorMessage: "Must start with DIPP followed by digits (e.g. DIPP123)" } },
        { name: 'isoCertNo', label: 'ISO Certificate Number', type: 'text', required: false, validation: { regex: "^[A-Za-z0-9][A-Za-z0-9./-]{2,49}$", errorMessage: "3–50 characters, alphanumeric with /, ., - allowed" } }
      ]
    },
    {
      name: 'documents',
      label: 'Required Documents',
      type: 'group',
      required: false,
      subFields: [
        { name: 'incorpCert', label: 'Incorporation Certificate (COI)', type: 'file', required: false, description: 'PDF only. Max 2 MB.' },
        { name: 'panCard', label: 'Company PAN Card', type: 'file', required: false, description: 'PDF only. Max 2 MB.' },
        { name: 'gstDoc', label: 'GST Certificate', type: 'file', required: false, description: 'PDF only. Max 2 MB.' },
        { name: 'udyamCert', label: 'Udyam Certificate', type: 'file', required: false, description: 'PDF only. Max 2 MB.' },
        { name: 'trademarkCert', label: 'Trademark Certificate', type: 'file', required: false, description: 'PDF only. Max 2 MB.' },
        { name: 'isoCert', label: 'ISO Certificate', type: 'file', required: false, description: 'PDF only. Max 2 MB.' }
      ]
    }
  ],
  crossValidations: []
};

const mongoURI = process.env.MONGO_URI || 'mongodb://193.203.161.48:27018/';
mongoose.connect(mongoURI).then(async () => {
  const FormSchema = mongoose.connection.db.collection('formschemas');
  await FormSchema.updateOne({ serviceName: 'Company Profile' }, { $set: schema }, { upsert: true });
  console.log('Seeded Company Profile form schema!');
  process.exit(0);
}).catch(console.error);
