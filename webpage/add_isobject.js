const fs = require('fs');
const file = 'src/app/dashboard/checklist-details/checklist-details.ts';
let ts = fs.readFileSync(file, 'utf8');

const isObjectFunc = `
  isObject(val: any): boolean {
    return typeof val === 'object' && val !== null;
  }
`;

if (ts.includes('getGeneralDetails():')) {
  ts = ts.replace('  getGeneralDetails():', isObjectFunc + '\n  getGeneralDetails():');
  fs.writeFileSync(file, ts);
  console.log('Added isObject method successfully.');
} else {
  console.log('Failed to add isObject method.');
}
