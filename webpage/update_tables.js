const fs = require('fs');
const files = [
  'bucket/bucket.html',
  'requests/requests.html',
  'service-checklists/service-checklists.html',
  'staff-compliance/staff-compliance.html',
  'service-tracker-table/service-tracker-table.html',
  'client-bank/client-bank.html'
];
const basePath = '/Users/yovelr/Softrate/we-crm/we_crm/webpage/src/app/dashboard/';

files.forEach(file => {
  const fullPath = basePath + file;
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  let counter = 1;
  const prefix = file.split('/')[0];
  content = content.replace(/<th([^>]*)>/g, (match, p1) => {
    if (p1.includes('appResizableColumn')) return match;
    const colId = `${prefix}-col-${counter++}`;
    return `<th${p1} appResizableColumn="${colId}">`;
  });
  fs.writeFileSync(fullPath, content);
  console.log(`Updated ${file}`);
});
