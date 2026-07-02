const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

let count = 0;
walkDir('c:/projects/we_crm/webpage/src/app', (filePath) => {
  if (filePath.endsWith('.html')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // mediumDate -> dd/MM/yy
    content = content.replace(/\|\s*date\s*:\s*\'mediumDate\'/g, "| date:'dd/MM/yy'");
    // short -> dd/MM/yy, hh:mm a
    content = content.replace(/\|\s*date\s*:\s*\'short\'/g, "| date:'dd/MM/yy, hh:mm a'");
    // medium -> dd/MM/yy, hh:mm a
    content = content.replace(/\|\s*date\s*:\s*\'medium\'/g, "| date:'dd/MM/yy, hh:mm a'");
    // longDate -> dd/MM/yy
    content = content.replace(/\|\s*date\s*:\s*\'longDate\'/g, "| date:'dd/MM/yy'");
    // dd MMM yyyy -> dd/MM/yy
    content = content.replace(/\|\s*date\s*:\s*\'dd MMM yyyy\'/g, "| date:'dd/MM/yy'");
    // shortTime -> hh:mm a
    content = content.replace(/\|\s*date\s*:\s*\'shortTime\'/g, "| date:'hh:mm a'");

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated:', filePath);
      count++;
    }
  }
});
console.log(`Updated ${count} files.`);
