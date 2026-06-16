const fs = require('fs');
const path = require('path');

const webFormsDir = 'c:/projects/we_crm/webpage/src/app/client/forms';
const appFormsDir = 'c:/projects/we_crm/crm_app/lib/features/orders';

function processDirectory(directory) {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(directory, file.name);
    if (file.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.html') || fullPath.endsWith('.dart'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      // Replace max size constants
      content = content.replace(/10 \* 1024 \* 1024/g, '2 * 1024 * 1024');
      content = content.replace(/5 \* 1024 \* 1024/g, '2 * 1024 * 1024');

      // Replace max size UI labels
      content = content.replace(/Max 10MB/g, 'Max 2MB');
      content = content.replace(/Max 10 MB/g, 'Max 2 MB');
      content = content.replace(/Max 5MB/g, 'Max 2MB');
      content = content.replace(/Max 5 MB/g, 'Max 2 MB');

      // Replace alert texts
      content = content.replace(/File size is large\.\s*Max \d+MB allowed\./g, 'Upload a file less than 2 MB or equal to 2 MB.');
      content = content.replace(/The file is large\.\s*Max \d+MB allowed\./g, 'Upload a file less than 2 MB or equal to 2 MB.');

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(webFormsDir);
processDirectory(appFormsDir);
console.log('Done!');
