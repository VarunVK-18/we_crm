const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const form = await db.collection('formschemas').findOne({ serviceName: 'Company Profile' });
  const companyDetails = form.fields.find(f => f.name === 'companyDetails');
  if (companyDetails) {
    const toAdd = [
      { name: 'constitutionType', label: 'Business Constitution / Type', type: 'dropdown', required: true, options: ['Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'Public Limited', 'HUF', 'Trust/Society', 'Other'], allowedExtensions: [] },
      { name: 'natureOfBusiness', label: 'Nature of Business', type: 'dropdown', required: true, options: ['Manufacturer', 'Service Provider', 'Trader', 'Retailer', 'Wholesaler', 'Other'], allowedExtensions: [] },
      { name: 'businessActivity', label: 'Detailed Business Activity', type: 'text', required: false, options: [], allowedExtensions: [] },
      { name: 'employeeCount', label: 'Number of Employees', type: 'number', required: false, options: [], allowedExtensions: [], validation: { regex: '^[0-9]+$', errorMessage: 'Must be a valid number' } }
    ];
    for (const sf of toAdd) {
      if (!companyDetails.subFields.find(existing => existing.name === sf.name)) {
        companyDetails.subFields.push(sf);
        console.log('Added ' + sf.name);
      }
    }
    await db.collection('formschemas').updateOne({ _id: form._id }, { $set: { fields: form.fields } });
    console.log('Updated DB');
  }
  mongoose.disconnect();
}
run();
