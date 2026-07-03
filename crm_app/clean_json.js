const fs = require('fs');
const path = 'assets/json/NIC_2008_classification.json';

const contents = fs.readFileSync(path, 'utf8');
const data = JSON.parse(contents);

const sections = data['NIC_2008']['sections'];
for (const sec of sections) {
  if (sec['section'] === 'U') {
    for (const div of sec['divisions']) {
      if (div['division'] === '99') {
        for (const grp of div['groups']) {
          if (grp['code'] === '990') {
            grp['classes'] = grp['classes'].filter(c => c['code'] === '9900');
          }
        }
      }
    }
  }
}

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('JSON cleaned successfully.');
