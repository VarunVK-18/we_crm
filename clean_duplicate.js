const fs = require('fs');
const path = require('path');

const dir = 'c:\\projects\\we_crm\\crm_app\\lib\\features\\orders';

const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.dart')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace duplicated padding block
    const duplicateBlock = `                  minimumSize: const Size(80, 32),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  minimumSize: const Size(80, 32),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),`;
                  
    const singleBlock = `                  minimumSize: const Size(80, 32),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),`;

    if (content.includes(duplicateBlock)) {
      content = content.replace(new RegExp(duplicateBlock.replace(/[.*+?^$\/{}()|[\\]\\\\]/g, '\\$&'), 'g'), singleBlock);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Cleaned ${file}`);
    }
  }
}
console.log('Cleanup done!');
