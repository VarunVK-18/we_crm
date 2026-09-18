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
      const key = `${f.name}`;
      if (!allFields.has(key)) {
        allFields.set(key, { name: f.name, label: f.label, type: f.type, forms: new Set([formName]) });
      } else {
        allFields.get(key).forms.add(formName);
        if (!allFields.get(key).label && f.label) {
          allFields.get(key).label = f.label;
        }
      }
    }
  });
}

function processFile(filePath, formName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/const [a-zA-Z0-9_]+Schema = ({[\s\S]*?});/);
    let objStr = match ? match[1] : null;
    if (!objStr) {
      const match2 = content.match(/const schema = ({[\s\S]*?});/);
      objStr = match2 ? match2[1] : null;
    }
    
    if (objStr) {
      const fn = new Function('return ' + objStr);
      const schemaObj = fn();
      extractFieldsFromSchema(schemaObj.fields, formName);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
  }
}

if (fs.existsSync(seedDir)) {
  const files = fs.readdirSync(seedDir);
  files.forEach(file => {
    if (file.endsWith('.js')) {
      processFile(path.join(seedDir, file), file.replace('.js', ''));
    }
  });
}

if (fs.existsSync(companyProfilePath)) {
  processFile(companyProfilePath, 'Company Profile');
}

function determineValidation(field) {
  const lowerName = (field.name || '').toLowerCase();
  const lowerLabel = (field.label || '').toLowerCase();
  
  if (/\bpan\b/.test(lowerName) || /\bpan\b/.test(lowerLabel)) {
    if (!/name|date|dob|first|last/.test(lowerName) && !/name|date|dob|first|last/.test(lowerLabel)) {
      return { rule: 'PAN Format', correct: 'ABCDE1234F', wrong: 'ABCD12345F *(starts with 4 letters)*' };
    }
  }
  if (lowerName.includes('aadhaar') || lowerLabel.includes('aadhaar')) {
    return { rule: 'Aadhaar (12 Digits)', correct: '123456789012', wrong: '12345678901 *(11 digits)*' };
  }
  if (field.type === 'phone' || lowerName.includes('phone') || lowerLabel.includes('mobile')) {
    return { rule: 'Phone (10 Digits)', correct: '9876543210', wrong: '987654321 *(9 digits)*' };
  }
  if (field.type === 'email' || lowerName.includes('email') || lowerLabel.includes('mail')) {
    return { rule: 'Email Format', correct: 'user@domain.com', wrong: 'user@domain *(no TLD)*' };
  }
  if (lowerName.includes('name') || lowerLabel.includes('name')) {
    return { rule: 'Name (≥1 Letter)', correct: 'John Doe', wrong: '12345 *(no letters)*' };
  }
  if (lowerName.includes('model') || lowerLabel.includes('model')) {
    return { rule: 'Model Number', correct: 'MDL-1234', wrong: 'MDL@1234 *(special char)*' };
  }
  if (lowerName === 'gstin' || lowerLabel.includes('gstin') || lowerLabel.includes('gst number')) {
    return { rule: 'GSTIN (15 chars)', correct: '22AAAAA0000A1Z5', wrong: '22AAAAA0000A1Z *(14 chars)*' };
  }
  if (lowerName === 'cin' || lowerLabel.includes('cin')) {
    return { rule: 'CIN/LLPIN', correct: 'U12345AB1234CDE123456', wrong: '12345AB1234CDE1234567 *(must start L/U)*' };
  }
  if (lowerName.includes('postalcode') || lowerName.includes('pincode') || lowerLabel.includes('postal code') || lowerLabel.includes('pin code')) {
    return { rule: 'PIN Code (6 Digits)', correct: '600001', wrong: '60000 *(5 digits)*' };
  }
  if (lowerName === 'din' || lowerLabel.includes('din')) {
    return { rule: 'DIN (8 Digits)', correct: '12345678', wrong: '1234567 *(7 digits)*' };
  }
  if (lowerName === 'tan' || lowerLabel === 'tan' || lowerLabel.includes('tan number')) {
    return { rule: 'TAN Format', correct: 'ABCD12345E', wrong: 'ABCDE1234F *(5 letters)*' };
  }
  if (lowerName.includes('ifsc') || lowerLabel.includes('ifsc')) {
    return { rule: 'IFSC Format', correct: 'HDFC0001234', wrong: 'HDFC0123456 *(must have 0 at 5th)*' };
  }
  if (lowerName.includes('account') || lowerLabel.includes('account')) {
    return { rule: 'Bank Account', correct: '123456789012', wrong: '12345678 *(8 digits)*' };
  }
  if (lowerName.includes('udyam') || lowerLabel.includes('udyam')) {
    return { rule: 'UDYAM MSME', correct: 'UDYAM-MH-18-0000001', wrong: 'UDYAM-MH-18-123 *(too short)*' };
  }
  
  if (field.type === 'date') return { rule: 'Browser Native Date', correct: '01/01/2026', wrong: '32/13/2026 *(invalid date)*' };
  if (field.type === 'file') return { rule: 'File Upload (5MB)', correct: 'file.pdf (2MB)', wrong: 'video.mp4 (10MB)' };
  if (field.type === 'checkbox') return { rule: 'Boolean', correct: 'Checked', wrong: 'Unchecked (if required)' };
  if (field.type === 'dropdown') return { rule: 'Selection', correct: 'Option A', wrong: 'Cannot type manually' };
  
  return { rule: 'Generic Text', correct: 'Any valid text string', wrong: 'Empty (if required)' };
}

let md = `# Comprehensive Fields Validation Matrix\n\n`;
md += `This document contains all ${allFields.size} unique fields extracted from across all 24 database schemas and the Complete Company Profile.\n\n`;
md += `| Internal Name | Display Label | UI Type | Validation Rule | ✅ Correct Example | ❌ Wrong Example (Should Fail) |\n`;
md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

const sortedFields = Array.from(allFields.values()).sort((a, b) => a.name.localeCompare(b.name));

sortedFields.forEach(field => {
  const val = determineValidation(field);
  const label = field.label ? field.label.replace(/\|/g, '-') : 'N/A';
  md += `| \`${field.name}\` | ${label} | ${field.type} | **${val.rule}** | \`${val.correct}\` | \`${val.wrong}\` |\n`;
});

fs.writeFileSync('c:/projects/we_crm/comprehensive_fields_matrix.md', md);
console.log('Matrix generated!');
