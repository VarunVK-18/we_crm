const mongoose = require('mongoose');
require('dotenv').config();

async function extendProfileForm() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const form = await db.collection('formschemas').findOne({ serviceName: 'Company Profile' });
  if (!form) {
    console.log("Company Profile form not found");
    process.exit(1);
  }

  let modified = false;

  // Helper to add group
  const addGroup = (name, label, subFields) => {
    if (!form.fields.find(f => f.name === name)) {
      form.fields.push({
        name,
        label,
        type: 'group',
        required: false,
        options: [],
        allowedExtensions: [],
        subFields
      });
      modified = true;
      console.log(`Added group ${name}`);
    } else {
      const g = form.fields.find(f => f.name === name);
      for (const sf of subFields) {
        if (!g.subFields.find(existing => existing.name === sf.name)) {
          g.subFields.push(sf);
          modified = true;
          console.log(`Added subField ${sf.name} to ${name}`);
        }
      }
    }
  };

  // Add Bank Details Group
  addGroup('bankDetails', 'Bank Account Details', [
    {
      name: 'accountHolderName',
      label: 'Account Holder Name',
      type: 'text',
      required: true,
      options: [],
      allowedExtensions: [],
      validation: {
        regex: "^[A-Za-z\\s\\.\\-]+$",
        errorMessage: "Name can only contain alphabets, spaces, dots, and hyphens"
      }
    },
    {
      name: 'bankName',
      label: 'Bank Name',
      type: 'text',
      required: true,
      options: [],
      allowedExtensions: [],
      validation: {
        regex: "^[A-Za-z\\s]+$",
        errorMessage: "Bank name can only contain alphabets and spaces"
      }
    },
    {
      name: 'accountNumber',
      label: 'Account Number',
      type: 'text',
      required: true,
      options: [],
      allowedExtensions: [],
      validation: {
        regex: "^[0-9]{9,18}$",
        errorMessage: "Account number must be 9 to 18 digits"
      }
    },
    {
      name: 'ifscCode',
      label: 'IFSC Code',
      type: 'text',
      required: true,
      options: [],
      allowedExtensions: [],
      validation: {
        regex: "^[A-Z]{4}0[A-Z0-9]{6}$",
        errorMessage: "Invalid IFSC code format (e.g. HDFC0001234)"
      }
    },
    {
      name: 'accountType',
      label: 'Account Type',
      type: 'dropdown',
      required: true,
      options: ['Current', 'Savings', 'Cash Credit', 'Overdraft'],
      allowedExtensions: []
    }
  ]);

  // Enhance Basic Details Group with constitution & business activity
  const basicDetails = form.fields.find(f => f.name === 'basicDetails');
  if (basicDetails) {
    const toAdd = [
      {
        name: 'constitutionType',
        label: 'Business Constitution / Type',
        type: 'dropdown',
        required: true,
        options: ['Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'Public Limited', 'HUF', 'Trust/Society', 'Other'],
        allowedExtensions: []
      },
      {
        name: 'natureOfBusiness',
        label: 'Nature of Business',
        type: 'dropdown',
        required: true,
        options: ['Manufacturer', 'Service Provider', 'Trader', 'Retailer', 'Wholesaler', 'Other'],
        allowedExtensions: []
      },
      {
        name: 'businessActivity',
        label: 'Detailed Business Activity',
        type: 'text',
        required: false,
        options: [],
        allowedExtensions: []
      },
      {
        name: 'employeeCount',
        label: 'Number of Employees',
        type: 'number',
        required: false,
        options: [],
        allowedExtensions: [],
        validation: {
          regex: "^[0-9]+$",
          errorMessage: "Must be a valid number"
        }
      }
    ];

    for (const sf of toAdd) {
      if (!basicDetails.subFields.find(existing => existing.name === sf.name)) {
        basicDetails.subFields.push(sf);
        modified = true;
        console.log(`Added subField ${sf.name} to basicDetails`);
      }
    }
  }

  // Add capital details to tax & certifications if missing, or maybe a new group
  addGroup('capitalDetails', 'Capital & Shareholding (For Companies)', [
    {
      name: 'authorizedCapital',
      label: 'Authorized Capital (₹)',
      type: 'number',
      required: false,
      options: [],
      allowedExtensions: [],
      validation: {
        regex: "^[0-9]+$",
        errorMessage: "Must be a valid number"
      }
    },
    {
      name: 'paidUpCapital',
      label: 'Paid-Up Capital (₹)',
      type: 'number',
      required: false,
      options: [],
      allowedExtensions: [],
      validation: {
        regex: "^[0-9]+$",
        errorMessage: "Must be a valid number"
      }
    }
  ]);

  // Add bank document to documents group
  const docs = form.fields.find(f => f.name === 'documents');
  if (docs) {
    if (!docs.subFields.find(f => f.name === 'bankStatement')) {
      docs.subFields.push({
        name: 'bankStatement',
        label: 'Bank Statement / Cancelled Cheque',
        type: 'file',
        required: false,
        options: [],
        allowedExtensions: [],
        description: "PDF/JPG/PNG. Max 2 MB."
      });
      modified = true;
      console.log('Added bankStatement to documents');
    }
  }

  // Add Declaration
  addGroup('declaration', 'Declaration', [
    {
      name: 'isDeclared',
      label: 'I hereby declare that the details furnished above are true and correct to the best of my knowledge.',
      type: 'checkbox',
      required: true,
      options: [],
      allowedExtensions: []
    }
  ]);

  if (modified) {
    await db.collection('formschemas').updateOne(
      { _id: form._id },
      { $set: { fields: form.fields } }
    );
    console.log("Successfully updated Company Profile form schema.");
  } else {
    console.log("No new fields were added (already exist).");
  }

  process.exit(0);
}

extendProfileForm().catch(err => {
  console.error(err);
  process.exit(1);
});
