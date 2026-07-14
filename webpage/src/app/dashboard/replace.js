const fs = require('fs');
const path = require('path');
const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.html')) {
      results.push(file);
    }
  });
  return results;
};
const files = walk('c:/projects/we_crm/webpage/src/app/dashboard');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if(content.includes('placeholder="Search..."')) {
    content = content.replace(/placeholder="Search\.\.\."/g, '');
    fs.writeFileSync(file, content);
    console.log('Updated HTML:', file);
  }
});

// Also update the CSS class to remove 100% width or set width to fit-content
const cssFiles = walk('c:/projects/we_crm/webpage/src/app/dashboard').filter(f => f.endsWith('.css'));
cssFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if(content.includes('.col-search-input {')) {
    content = content.replace(/width: 100%;/g, 'width: 100%; min-width: 0; max-width: 100%;');
    // Maybe the user wants width: max-content or something? 
    // They said "keep the default searchbar size as the title text length"
    // Usually, setting width to 100% inside th makes it span the whole available space, but if we change it to 100% of the title width, we could use `width: 100%; box-sizing: border-box;`. Wait, it already has that.
    fs.writeFileSync(file, content);
    console.log('Updated CSS:', file);
  }
});
