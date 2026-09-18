const fs = require('fs');
const path = require('path');

const seedDir = path.join(__dirname, 'seed_forms');
const companyProfilePath = path.join(__dirname, 'seed_company_profile.js');

const allFields = new Map();

function extractFieldsFromSchema(fields, formName) {
  if (!fields) return;
  fields.forEach(f => {
    if (f.type === 'group' && f.subFields) {
      extractFieldsFromSchema(f.subFields, formName);
    } else if (f.type === 'array' && f.subFields) {
      extractFieldsFromSchema(f.subFields, formName);
    } else {
      const key = `${f.name}-${f.type}`;
      if (!allFields.has(key)) {
        allFields.set(key, { name: f.name, label: f.label, type: f.type, forms: new Set([formName]) });
      } else {
        allFields.get(key).forms.add(formName);
      }
    }
  });
}

function processFile(filePath, formName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Extract the schema object (very hacky regex for node script, but should work for these seeds)
    const match = content.match(/const schema = ({[\s\S]*?});/);
    if (match) {
      // Use Function constructor to safely evaluate the object
      const fn = new Function('return ' + match[1]);
      const schemaObj = fn();
      extractFieldsFromSchema(schemaObj.fields, formName);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
  }
}

// Process 24 forms
if (fs.existsSync(seedDir)) {
  const files = fs.readdirSync(seedDir);
  files.forEach(file => {
    if (file.endsWith('.js')) {
      processFile(path.join(seedDir, file), file.replace('.js', ''));
    }
  });
}

// Process company profile
processFile(companyProfilePath, 'Company Profile');

// Map fields to our validations based on client-dynamic-form.ts logic
function determineValidation(field) {
  const lowerName = (field.name || '').toLowerCase();
  const lowerLabel = (field.label || '').toLowerCase();
  
  if (/\bpan\b/.test(lowerName) || /\bpan\b/.test(lowerLabel)) {
    if (!/name|date|dob|first|last/.test(lowerName) && !/name|date|dob|first|last/.test(lowerLabel)) {
      return 'PAN Format (ABCDE1234F)';
    }
  }
  if (lowerName.includes('aadhaar') || lowerLabel.includes('aadhaar')) {
    return 'Aadhaar (12 Digits)';
  }
  if (field.type === 'phone' || lowerName.includes('phone') || lowerLabel.includes('mobile')) {
    return 'Phone (10 Digits)';
  }
  if (field.type === 'email' || lowerName.includes('email') || lowerLabel.includes('mail')) {
    return 'Email Format';
  }
  if (lowerName.includes('name') || lowerLabel.includes('name')) {
    return 'Name (Alphanumeric/Spaces/Hyphens, ≥1 Letter)';
  }
  if (lowerName === 'gstin' || lowerLabel.includes('gstin') || lowerLabel.includes('gst number')) {
    return 'GSTIN Format (15 chars)';
  }
  if (lowerName === 'cin' || lowerLabel.includes('cin')) {
    return 'CIN Format (21 chars)';
  }
  if (lowerName.includes('postalcode') || lowerName.includes('pincode') || lowerLabel.includes('postal code') || lowerLabel.includes('pin code')) {
    return 'PIN Code (6 Digits)';
  }
  if (lowerName === 'din' || lowerLabel.includes('din')) {
    return 'DIN (8 Digits)';
  }
  if (lowerName === 'tan' || lowerLabel === 'tan' || lowerLabel.includes('tan number')) {
    return 'TAN Format (ABCD12345E)';
  }
  if (lowerName.includes('ifsc') || lowerLabel.includes('ifsc')) {
    return 'IFSC Format (HDFC0001234)';
  }
  if (lowerName.includes('account') || lowerLabel.includes('account')) {
    return 'Bank Account (9-18 Digits)';
  }
  if (field.type === 'date') return 'Date format (Browser native)';
  if (field.type === 'file') return 'File Upload (Max 5MB)';
  if (field.type === 'checkbox') return 'Boolean (Checked/Unchecked)';
  if (field.type === 'dropdown') return 'Selection (from options)';
  
  return 'Standard Text / Generic';
}

const results = [];
for (const [key, field] of allFields.entries()) {
  const validation = determineValidation(field);
  results.push({
    Name: field.name,
    Label: field.label,
    Type: field.type,
    Validation: validation,
    FormsAppearingIn: Array.from(field.forms).length
  });
}

fs.writeFileSync('c:/projects/we_crm/crm_backend/field_analysis.json', JSON.stringify(results, null, 2));
console.log('Analysis saved to field_analysis.json');
