const fs = require('fs');
const path = require('path');

const formsDir = path.join(__dirname, 'webpage', 'src', 'app', 'client', 'forms');

const files = fs.readdirSync(formsDir, { withFileTypes: true });

files.forEach(file => {
  if (file.isDirectory()) {
    const htmlFile = path.join(formsDir, file.name, `${file.name}.html`);
    if (fs.existsSync(htmlFile)) {
      let content = fs.readFileSync(htmlFile, 'utf8');
      let modified = false;

      // 1. Phone numbers
      content = content.replace(/(<input[^>]*type="tel"[^>]*name="([^"]+)"[^>]*>)/g, (match, p1, name) => {
        if (match.includes('pattern=')) return match;
        // Strip {{...}} from name for variable
        const safeName = name.replace(/[^a-zA-Z0-9]/g, '');
        let updated = match.replace('>', ` pattern="^[0-9]{10}$" #${safeName}Field="ngModel">`);
        updated += `\n                  <div *ngIf="${safeName}Field.invalid && ${safeName}Field.touched" class="error-msg">Phone number must be exactly 10 digits</div>`;
        modified = true;
        return updated;
      });

      // 2. Aadhaar
      content = content.replace(/(<input[^>]*name="([^"]*aadhaar[^"]*)"[^>]*>)/gi, (match, p1, name) => {
        if (match.includes('pattern=')) return match;
        if (match.includes('type="file"')) return match;
        const safeName = name.replace(/[^a-zA-Z0-9]/g, '');
        let updated = match.replace('>', ` pattern="^[0-9]{12}$" #${safeName}Field="ngModel">`);
        updated += `\n                  <div *ngIf="${safeName}Field.invalid && ${safeName}Field.touched" class="error-msg">Aadhaar must be exactly 12 digits</div>`;
        modified = true;
        return updated;
      });

      // 3. PAN
      content = content.replace(/(<input[^>]*name="([^"]*pan[^"]*)"[^>]*>)/gi, (match, p1, name) => {
        if (match.includes('pattern=')) return match;
        if (match.includes('type="file"')) return match;
        const safeName = name.replace(/[^a-zA-Z0-9]/g, '');
        let updated = match.replace('>', ` pattern="^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$" #${safeName}Field="ngModel" style="text-transform: uppercase;">`);
        updated += `\n                  <div *ngIf="${safeName}Field.invalid && ${safeName}Field.touched" class="error-msg">Invalid PAN format (e.g. ABCDE1234F)</div>`;
        modified = true;
        return updated;
      });

      // 4. Email
      content = content.replace(/(<input[^>]*type="email"[^>]*name="([^"]+)"[^>]*>)/g, (match, p1, name) => {
        const safeName = name.replace(/[^a-zA-Z0-9]/g, '');
        if (match.includes('#' + safeName + 'Field')) return match;
        let updated = match.replace('>', ` email #${safeName}Field="ngModel">`);
        updated += `\n                  <div *ngIf="${safeName}Field.invalid && ${safeName}Field.touched" class="error-msg">Please enter a valid email address</div>`;
        modified = true;
        return updated;
      });

      // 5. Shareholding percentage
      content = content.replace(/(<input[^>]*name="([^"]*share[^"]*)"[^>]*>)/gi, (match, p1, name) => {
        if (match.includes('min="0"')) return match;
        if (match.includes('type="file"')) return match;
        const safeName = name.replace(/[^a-zA-Z0-9]/g, '');
        let updated = match.replace('>', ` min="0" max="100" #${safeName}Field="ngModel">`);
        updated += `\n                  <div *ngIf="${safeName}Field.invalid && ${safeName}Field.touched" class="error-msg">Percentage must be between 0 and 100</div>`;
        modified = true;
        return updated;
      });

      if (modified) {
        fs.writeFileSync(htmlFile, content, 'utf8');
        console.log(`Updated ${file.name}.html`);
      }
    }
  }
});
