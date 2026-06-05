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

walk('/Users/yovelr/Softrate/we-crm/we_crm/webpage/src/app/client', function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace #2563eb (blue) with var(--palette-purple)
    content = content.replace(/#2563eb/gi, 'var(--palette-purple)');
    
    // Replace #0f172a (dark slate) with var(--palette-dark)
    content = content.replace(/#0f172a/gi, 'var(--palette-dark)');
    
    // Replace #64748b (slate grey) with a mix of dark
    content = content.replace(/#64748b/gi, 'color-mix(in srgb, var(--palette-dark) 65%, transparent)');
    
    // Replace hover blue #1d4ed8 with dark purple
    content = content.replace(/#1d4ed8/gi, 'var(--palette-purple)');
    
    // Replace var(--palette-blue) with var(--palette-purple) or white depending on the context
    // Actually, user wants black, dark purple, white. Let's replace var(--palette-blue) with var(--palette-purple)
    content = content.replace(/var\(--palette-blue\)/g, 'var(--palette-purple)');

    if (content !== original) {
      fs.writeFileSync(file, content);
      console.log('Updated:', file);
    }
  });
});
