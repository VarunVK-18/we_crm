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

      // Replace accept=".pdf,.jpg,.jpeg,.png" or accept="..." with accept=".pdf" 
      // ONLY on file inputs for Aadhar, Pan, Tan, Address Proof

      content = content.replace(/(<input[^>]*type="file"[^>]*>)/gi, (match) => {
        const lowerMatch = match.toLowerCase();
        const isTarget = lowerMatch.includes('aadhaar') || 
                         lowerMatch.includes('aadhar') || 
                         lowerMatch.includes('pan') || 
                         lowerMatch.includes('tan') || 
                         lowerMatch.includes('address') || 
                         lowerMatch.includes('proof');

        if (isTarget) {
          // Replace accept="..." with accept=".pdf"
          let updated = match.replace(/accept="[^"]*"/i, 'accept=".pdf"');
          // if it didn't have accept, add it
          if (updated === match && !match.toLowerCase().includes('accept=')) {
            updated = match.replace('>', ' accept=".pdf">');
          }
          if (updated !== match) {
            modified = true;
            return updated;
          }
        }
        return match;
      });

      // Update the help text "Max 2MB (PDF/JPG/PNG)" -> "Max 2MB (PDF Only)"
      // but only if it's right after one of the target fields. It might be easier to just change the text if it's near.
      // Actually, since we're just doing a global replace on the text, let's just do it where it matches.
      // A safe way is to let the user know, or just replace "(PDF/JPG/PNG)" -> "(PDF Only)" where applicable.
      // We will leave the text alone for now, or replace it if it's specifically for those fields. Let's do a simple replace on the HTML.
      // Wait, changing the help text globally might affect other uploads (like photos). I'll skip it in the script and let it be or just do a regex if it's in the same block.

      if (modified) {
        fs.writeFileSync(htmlFile, content, 'utf8');
        console.log(`Updated ${file.name}.html`);
      }
    }
  }
});
