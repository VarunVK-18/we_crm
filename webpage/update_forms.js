const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let replacedCount = 0;
const rootDir = 'c:/projects/we_crm/webpage/src/app/client/forms';

walkDir(rootDir, function(filePath) {
  if (filePath.endsWith('.html')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let originalContent = content;

    content = content.replace(/<input\s+[^>]*type=[\"\']file[\"\'][^>]*>/gi, (match) => {
      // Check if it's PAN, Aadhaar, or Address Proof
      const isRestrictedDoc = /(pan|aadhaar|addressproof|identityproof)/i.test(match);
      if (isRestrictedDoc) {
        return match.replace(/accept=[\"\'][^\"\']*[\"\']/i, 'accept=".pdf"');
      }
      return match;
    });

    // Also add directives for text inputs
    // PAN
    content = content.replace(/(<input\s+[^>]*name=["']panNumber["'][^>]*>)/gi, (match) => {
      if (!match.includes('appPanFormat')) {
        return match.replace('<input ', '<input appPanFormat ');
      }
      return match;
    });
    // Aadhaar
    content = content.replace(/(<input\s+[^>]*name=["']aadhaarNumber["'][^>]*>)/gi, (match) => {
      if (!match.includes('appAadhaarFormat')) {
        return match.replace('<input ', '<input appAadhaarFormat ');
      }
      return match;
    });

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      replacedCount++;
      console.log('Updated html', filePath);
    }
  }

  if (filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let originalContent = content;
    
    // Add import for directives if we added them in HTML
    if (content.includes('panNumber') || content.includes('aadhaarNumber')) {
      if (!content.includes('PanFormatDirective')) {
        // Find imports block
        content = `import { PanFormatDirective, AadhaarFormatDirective, PhoneFormatDirective } from '../../../utils/form-format.directives';\n` + content;
        // Find standalone imports array
        content = content.replace(/imports:\s*\[([\s\S]*?)\]/, (match, p1) => {
          return `imports: [${p1}, PanFormatDirective, AadhaarFormatDirective, PhoneFormatDirective]`;
        });
      }
    }

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('Updated ts', filePath);
    }
  }
});

console.log('Total files updated:', replacedCount);
