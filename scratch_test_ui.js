const fs = require('fs');
const path = 'webpage/src/app/client/client-profile.html';
let content = fs.readFileSync(path, 'utf8');

const target = `<h1>HELLO WORLD TEST - IF YOU SEE THIS, IT UPDATED</h1><div class="documents-list">`;
const replacement = `<div class="documents-list">`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Removed hello world header');
} else {
  console.log('Could not find hello world header');
}
