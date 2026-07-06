const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git') && !file.includes('.dart_tool')) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.html') || file.endsWith('.dart')) { 
      results.push(file);
    }
  });
  return results;
}

const files = walk('c:/projects/we_crm');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('5 * 1024 * 1024')) {
    content = content.replace(/5 \* 1024 \* 1024/g, '2 * 1024 * 1024');
    changed = true;
  }
  if (content.includes('5 MB')) {
    content = content.replace(/5 MB/g, '2 MB');
    changed = true;
  }
  if (content.includes('5MB')) {
    content = content.replace(/5MB/g, '2MB');
    changed = true;
  }
  
  if (file.endsWith('.dart') && content.includes('_buildFileRow')) {
    let original = content;
    content = content.replace(/shape: RoundedRectangleBorder\(borderRadius: BorderRadius\.circular\(8\)\),/g, 'shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),\n                  minimumSize: const Size(80, 32),\n                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),');
    if (original !== content) changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
console.log('Done');
