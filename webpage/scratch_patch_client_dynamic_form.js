const fs = require('fs');

const path = 'c:\\\\projects\\\\we_crm\\\\webpage\\\\src\\\\app\\\\client\\\\forms\\\\dynamic-form\\\\client-dynamic-form.ts';
if (fs.existsSync(path)) {
  let c = fs.readFileSync(path, 'utf8');

  const oldRegexBlock = `        if (f.validation?.regex) {
          const re = new RegExp(f.validation.regex);
          if (!re.test(strVal)) {
            formatError = f.validation.errorMessage || 'Invalid format.';
          }
        }`;

  const newRegexBlock = `        const regexPattern = f.validation?.regex || f.validation?.pattern;
        const regexMsg = f.validation?.errorMessage || f.validation?.message || 'Invalid format.';
        if (regexPattern) {
          const re = new RegExp(regexPattern);
          if (!re.test(strVal)) {
            formatError = regexMsg;
          }
        }`;

  c = c.replace(oldRegexBlock, newRegexBlock);
  fs.writeFileSync(path, c, 'utf8');
  console.log('Patched: ' + path);
} else {
  console.log('File not found: ' + path);
}
