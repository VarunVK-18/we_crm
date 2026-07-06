const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let replacedCount = 0;
const rootDir = 'c:/projects/we_crm/crm_app/lib';

walkDir(rootDir, function(filePath) {
  if (filePath.endsWith('.dart') && filePath.includes('form_screen')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let originalContent = content;

    // 1. Add imports for formatters if not present
    if (content.includes('_buildField(') && !content.includes('formatters.dart')) {
      content = "import '../../core/utils/formatters.dart';\n" + content;
    }

    // 2. Update _buildField definition to apply formatters automatically based on label
    if (content.includes('Widget _buildField(')) {
      // Find the TextFormField inside _buildField and inject properties
      content = content.replace(/(TextFormField\s*\(\s*controller:\s*controller,\s*keyboardType:\s*keyboardType,\s*maxLines:\s*maxLines,)/, 
        "$1\n            autovalidateMode: AutovalidateMode.onUserInteraction,\n            textCapitalization: label.toLowerCase().contains('pan') ? TextCapitalization.characters : TextCapitalization.none,\n            inputFormatters: label.toLowerCase().contains('pan') ? [UpperCaseTextFormatter()] : label.toLowerCase().contains('aadhaar') ? [AadhaarInputFormatter()] : null,"
      );
    }

    // 3. Document restrictions: change FilePicker configuration
    // Often it's like: FilePickerResult? result = await FilePicker.platform.pickFiles(type: FileType.custom, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png']);
    // We want to change this to pdf only when it's PAN, Aadhaar, Address Proof
    // Since it's hard to know which field the picker is for, let's just find pickFiles in those form screens and restrict all uploads to PDF. Wait, some uploads might be photos which allow jpg.
    // Let's do a basic regex: if a pickFiles is for PAN or Aadhaar, restrict to pdf.
    // Usually it's in a method like `_pickPanCard()`.
    // Let's just find allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'] and replace with ['pdf'] for PAN/Aadhaar.
    content = content.replace(/(void\s+_pick(Pan|Aadhaar|Address|Incorp|Gst)[^\{]+\{[\s\S]*?allowedExtensions:\s*\[)[^\]]+(\])/gi, (match, p1, p2, p3) => {
        return p1 + "'pdf'" + p3;
    });

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      replacedCount++;
      console.log('Updated', filePath);
    }
  }
});

console.log('Total flutter files updated:', replacedCount);
