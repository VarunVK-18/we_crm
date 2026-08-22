const fs = require('fs');
const tsFile = 'src/app/dashboard/checklist-details/checklist-details.ts';
let tsContent = fs.readFileSync(tsFile, 'utf8');

// 1. Update ignoredKeys
tsContent = tsContent.replace(
  /const ignoredKeys = \[/,
  "const ignoredKeys = [\n      'status', 'nextStep', 'stage', 'clientFormSubmitted', 'action_required', 'form_submitted',"
);

// 2. Add getDynamicFormDetails
const dynamicFormFunc = `
  getDynamicFormDetails(): { key: string, value: any }[] {
    const cl = this.checklist();
    if (!cl || !cl.details || !cl.details.dynamicForm) return [];
    
    const entries: { key: string, value: any }[] = [];
    
    const flatten = (obj: any, prefix = '') => {
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        // Don't format the prefix again, just format the new key part
        const formattedKey = this.formatLabel(key);
        // Special case: don't prepend 'Application Information - ' everywhere if it's the root wrapper
        let newKey = prefix ? \`\${prefix} - \${formattedKey}\` : formattedKey;
        if (prefix === 'Application Information' || prefix === 'Business Info') {
            newKey = formattedKey;
        }
        
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          flatten(val, prefix ? newKey : formattedKey);
        } else if (Array.isArray(val)) {
          entries.push({ key: newKey, value: val.join(', ') });
        } else {
          entries.push({ key: newKey, value: val });
        }
      }
    };
    
    flatten(cl.details.dynamicForm);
    return entries;
  }
`;

if (!tsContent.includes('getDynamicFormDetails()')) {
  tsContent = tsContent.replace(
    /getDirectorDocumentsGrouped\(\):/,
    dynamicFormFunc + '\n\n  getDirectorDocumentsGrouped():'
  );
  fs.writeFileSync(tsFile, tsContent);
  console.log('Updated TS file.');
} else {
  console.log('TS file already has getDynamicFormDetails.');
}

const htmlFile = 'src/app/dashboard/checklist-details/checklist-details.html';
let htmlContent = fs.readFileSync(htmlFile, 'utf8');

// 3. Update HTML
const newHtmlBlock = `
          <div
            style="padding: 24px; border-top: 1px solid var(--border-color); display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px;">
            @for (field of getDynamicFormDetails(); track field.key) {
            <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
              <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">
                {{ field.key }}
              </span>
              <span style="font-size: 15px; font-weight: 500;"
                [style.color]="(field.key.toString().toLowerCase().includes('phone') || field.key.toString().toLowerCase().includes('email')) ? '#0369a1' : 'var(--text-primary)'"
                [style.background]="(field.key.toString().toLowerCase().includes('phone') || field.key.toString().toLowerCase().includes('email')) ? '#f0f9ff' : 'transparent'"
                [style.padding]="(field.key.toString().toLowerCase().includes('phone') || field.key.toString().toLowerCase().includes('email')) ? '4px 10px' : '0'"
                [style.border-radius]="(field.key.toString().toLowerCase().includes('phone') || field.key.toString().toLowerCase().includes('email')) ? '6px' : '0'"
                [style.border]="(field.key.toString().toLowerCase().includes('phone') || field.key.toString().toLowerCase().includes('email')) ? '1px solid #bae6fd' : 'none'">
                {{ field.value || 'N/A' }}
              </span>
            </div>
            }
          </div>
`;

// Find the section for dynamic form and replace the grid div entirely
const startRegex = /<div\s+style="padding: 24px; border-top: 1px solid var\(--border-color\); display: grid; grid-template-columns: repeat\(auto-fill, minmax\(250px, 1fr\)\); gap: 16px;">\s*@for \(field of \(checklist\(\)\.details\.dynamicForm \| keyvalue\); track field\.key\) {[\s\S]*?<\/div>/;

if (startRegex.test(htmlContent)) {
  htmlContent = htmlContent.replace(startRegex, newHtmlBlock.trim());
  fs.writeFileSync(htmlFile, htmlContent);
  console.log('Updated HTML file.');
} else {
  console.log('Could not find the HTML block to replace.');
}
