const fs = require('fs');
const path = require('path');

const directory = 'c:\\projects\\we_crm\\crm_app\\lib\\features\\orders';

// We want to match: validator: isRequired ? (v) => ... : null,
// or whatever the validator line looks like, and replace it.
const pattern = /validator:\s*isRequired\s*\?\s*\(v\)\s*=>\s*v\s*==\s*null\s*\|\|\s*v\.trim\(\)\.isEmpty\s*\?\s*'This is a required question'\s*:\s*null\s*:\s*null\s*,?/g;

const newValidationText = `autovalidateMode: AutovalidateMode.onUserInteraction,
            validator: (v) {
              if (isRequired && (v == null || v.trim().isEmpty)) {
                return 'This is a required question';
              }
              if (v != null && v.trim().isNotEmpty) {
                final text = v.trim();
                final labelLower = label.toLowerCase();
                if (labelLower.contains('phone') || labelLower.contains('mobile') || labelLower.contains('contact')) {
                  if (!RegExp(r'^[0-9]{10}$').hasMatch(text)) return 'Enter a valid 10-digit phone number';
                } else if (labelLower.contains('aadhaar') || labelLower.contains('adhar')) {
                  if (!RegExp(r'^[0-9]{12}$').hasMatch(text)) return 'Enter a valid 12-digit Aadhaar number';
                } else if (labelLower.contains('pan')) {
                  if (!RegExp(r'^[a-zA-Z]{5}[0-9]{4}[a-zA-Z]{1}$').hasMatch(text)) return 'Enter a valid PAN (e.g. ABCDE1234F)';
                } else if (labelLower.contains('tan')) {
                  if (!RegExp(r'^[a-zA-Z]{4}[0-9]{5}[a-zA-Z]{1}$').hasMatch(text)) return 'Enter a valid TAN (e.g. ABCD12345E)';
                }
              }
              return null;
            },`;

fs.readdirSync(directory).forEach(file => {
  if (file.endsWith('_form_screen.dart')) {
    const filePath = path.join(directory, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.match(pattern)) {
      const newContent = content.replace(pattern, newValidationText);
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated ${file}`);
    } else {
      console.log(`Pattern not found in ${file}`);
    }
  }
});
