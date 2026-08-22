const fs = require('fs');
const file = 'src/app/dashboard/checklist-details/checklist-details.ts';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
  /const docArrays = \['dunsDocs', 'dpiitDocs', 'incorpDocs', 'trademarkDocs', 'llpDocs', 'msmeDocs', 'gstDocs', 'isoDocs', 'fssaiDocs', 'dscDocs'\];/g,
  "const docArrays = ['dunsDocs', 'dpiitDocs', 'incorpDocs', 'trademarkDocs', 'llpDocs', 'msmeDocs', 'gstDocs', 'isoDocs', 'fssaiDocs', 'dscDocs', 'dynamicDocs'];"
);

data = data.replace(
  /const ignoredKeys = \[\s*'directors', 'dunsForm', 'dunsDocs', 'dpiitForm', 'dpiitDocs', 'entityName',\s*'incorpDocs', 'llpDocs', 'trademarkDocs', 'msmeDocs', 'gstDocs', 'isoDocs', 'fssaiDocs', 'dscDocs'\s*\];/g,
  "const ignoredKeys = [\n      'directors', 'dunsForm', 'dunsDocs', 'dpiitForm', 'dpiitDocs', 'entityName',\n      'incorpDocs', 'llpDocs', 'trademarkDocs', 'msmeDocs', 'gstDocs', 'isoDocs', 'fssaiDocs', 'dscDocs', 'dynamicDocs', 'dynamicForm'\n    ];"
);

fs.writeFileSync(file, data);
console.log('Done');
