const fs = require('fs');
const path = require('path');

const dir = 'c:\\projects\\we_crm\\crm_app\\lib\\features\\orders';
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.dart')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace duplicate block regardless of \r\n or \n
    const duplicateRegex = /minimumSize:\s*const\s*Size\(80,\s*32\),\s*padding:\s*const\s*EdgeInsets\.symmetric\(horizontal:\s*16,\s*vertical:\s*8\),\s*minimumSize:\s*const\s*Size\(80,\s*32\),\s*padding:\s*const\s*EdgeInsets\.symmetric\(horizontal:\s*16,\s*vertical:\s*8\),/g;
                  
    const singleBlock = `minimumSize: const Size(80, 32),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),`;

    let cleaned = false;
    while (duplicateRegex.test(content)) {
      content = content.replace(duplicateRegex, singleBlock);
      cleaned = true;
    }
    
    if (cleaned) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Cleaned ${file} successfully!`);
    }
  }
}
console.log('Cleanup done!');
