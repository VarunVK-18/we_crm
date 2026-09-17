const fs = require('fs');
function fixCSS(filePath) {
  let content = fs.readFileSync(filePath);
  const str = content.toString('utf8');
  const anchor = '.btn-modal-save:hover {\r\n  background: #eff6ff;\r\n}';
  const anchorUnix = '.btn-modal-save:hover {\n  background: #eff6ff;\n}';
  
  let idx = str.indexOf(anchor);
  let length = anchor.length;
  if (idx === -1) {
    idx = str.indexOf(anchorUnix);
    length = anchorUnix.length;
  }
  
  if (idx !== -1) {
    const cleanStr = str.substring(0, idx + length);
    const appendedCSS = `

.form-group.has-error input,
.form-group.has-error select,
.form-group.has-error .file-drop-area {
  border-color: #ef4444;
  background-color: #fef2f2;
}
.inline-error-text {
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 4px;
  display: block;
}
`;
    fs.writeFileSync(filePath, cleanStr + appendedCSS);
    console.log('Fixed', filePath);
  } else {
    console.log('Anchor not found in', filePath);
  }
}

fixCSS('c:\\projects\\we_crm\\webpage\\src\\app\\client\\forms\\dynamic-form\\client-dynamic-form.css');
fixCSS('c:\\projects\\we_crm\\webpage\\src\\app\\client\\forms\\mca-form\\mca-form.css');
