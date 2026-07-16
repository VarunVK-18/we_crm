const fs = require('fs');
const files = [
  'bucket/bucket.ts',
  'requests/requests.ts',
  'service-checklists/service-checklists.ts',
  'staff-compliance/staff-compliance.ts',
  'service-tracker-table/service-tracker-table.ts',
  'client-bank/client-bank.ts'
];
const basePath = '/Users/yovelr/Softrate/we-crm/we_crm/webpage/src/app/dashboard/';

files.forEach(file => {
  const fullPath = basePath + file;
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  
  if (!content.includes('ResizableColumnDirective')) {
    // Add import statement
    content = `import { ResizableColumnDirective } from '../../directives/resizable-column.directive';\n` + content;
    
    // Add to imports array
    content = content.replace(/imports:\s*\[([\s\S]*?)\]/, (match, p1) => {
      if (p1.includes('ResizableColumnDirective')) return match;
      return `imports: [${p1}, ResizableColumnDirective]`;
    });
    
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${file}`);
  }
});
