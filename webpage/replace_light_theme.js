const fs = require('fs');
const path = require('path');

const walk = function(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (file.endsWith('.css') || file.endsWith('.html')) {
            results.push(file);
          }
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

walk('/Users/yovelr/Softrate/we-crm/we_crm/webpage/src/app', function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Backgrounds
    content = content.replace(/background-color:\s*white;?/gi, 'background-color: var(--surface);');
    content = content.replace(/background:\s*white;?/gi, 'background: var(--surface);');
    content = content.replace(/background-color:\s*#ffffff;?/gi, 'background-color: var(--surface);');
    content = content.replace(/background:\s*#ffffff;?/gi, 'background: var(--surface);');
    
    content = content.replace(/background-color:\s*#FDFBF7;?/gi, 'background-color: var(--background);');
    content = content.replace(/background-color:\s*#fafbfc;?/gi, 'background-color: var(--surface);');
    content = content.replace(/background-color:\s*#f8fafc;?/gi, 'background-color: var(--background);');
    content = content.replace(/background:\s*#f8fafc;?/gi, 'background: var(--background);');
    
    // Borders
    content = content.replace(/border-color:\s*#e2e8f0;?/gi, 'border-color: var(--border);');
    content = content.replace(/border:\s*1px solid #e2e8f0;?/gi, 'border: 1px solid var(--border);');
    content = content.replace(/border:\s*1px solid #f1f5f9;?/gi, 'border: 1px solid var(--border);');
    content = content.replace(/border-bottom:\s*1px solid #f1f5f9;?/gi, 'border-bottom: 1px solid var(--border);');
    content = content.replace(/border-bottom:\s*1px solid #e2e8f0;?/gi, 'border-bottom: 1px solid var(--border);');
    
    // Text colors
    content = content.replace(/color:\s*#0f172a;?/gi, 'color: var(--text-primary);');
    content = content.replace(/color:\s*#1e293b;?/gi, 'color: var(--text-primary);');
    
    // Shadows
    content = content.replace(/box-shadow:\s*0 1px 3px rgba\(0, 0, 0, 0\.05\);?/gi, 'box-shadow: var(--shadow);');
    content = content.replace(/box-shadow:\s*0 4px 20px rgba\(0, 0, 0, 0\.03\);?/gi, 'box-shadow: var(--shadow);');

    if (content !== original) {
      fs.writeFileSync(file, content);
      console.log('Updated:', file);
    }
  });
});
