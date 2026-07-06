const fs = require('fs');
const path = require('path');

const formsDir = path.join(__dirname, 'crm_app', 'lib', 'features', 'orders');

const files = fs.readdirSync(formsDir).filter(f => f.endsWith('_screen.dart') && f.includes('form'));

files.forEach(file => {
  const dartFile = path.join(formsDir, file);
  let content = fs.readFileSync(dartFile, 'utf8');
  let modified = false;

  // 1. Ensure _pickFile has the allowedExtensions parameter if it doesn't already
  // Match: Future<void> _pickFile(Function(String) onPicked) async {
  // Or: Future<void> _pickFile(DirectorFormData data, String field) async {
  // Wait, I can just find `FilePicker.platform.pickFiles(` and if it doesn't have `allowedExtensions: allowedExtensions,` I can add it, or just leave it.
  // Actually, since there are many ways `_pickFile` is defined, let's just replace the calls.
  // Wait, if `_pickFile` doesn't have the `allowedExtensions` parameter, adding it to the call will cause a compile error.
  // So I must first modify `_pickFile` definition to accept `allowedExtensions`.

  if (content.includes('Future<void> _pickFile(Function(String) onPicked) async {') || content.includes('Future<void> _pickFile(Function(String) onPicked, {List<String> allowedExtensions = const [\'jpg\', \'jpeg\', \'png\', \'pdf\']}) async {') === false) {
    if (!content.includes('allowedExtensions = const')) {
        content = content.replace(
          /Future<void> _pickFile\(Function\(String\) onPicked\) async \{/,
          `Future<void> _pickFile(Function(String) onPicked, {List<String> allowedExtensions = const ['jpg', 'jpeg', 'png', 'pdf']}) async {`
        );
        
        content = content.replace(
          /allowedExtensions:\s*\['jpg',\s*'jpeg',\s*'png',\s*'pdf'\]/,
          `allowedExtensions: allowedExtensions`
        );
        modified = true;
    }
  }

  // Find all calls to _pickFile and if they correspond to aadhar/pan/tan/address proof, add allowedExtensions: const ['pdf']
  // Since we don't know the exact lines, we can search for the text preceding the button.
  // Usually it looks like: onPressed: () => _pickFile((path) => _aadhaarPath = path)
  
  content = content.replace(/_pickFile\(\(path\)\s*=>\s*(_aadhaarPath|_panPath|_tanPath|_officeProofPath|_addressProofPath)\s*=\s*path\)/g, (match, p1) => {
    modified = true;
    return `_pickFile((path) => ${p1} = path, allowedExtensions: const ['pdf'])`;
  });

  // For director_details_form_screen.dart:
  // _pickFile(d, 'aadhaar')
  content = content.replace(/_pickFile\(d,\s*'aadhaar'\)/g, () => {
    modified = true;
    return `_pickFile(d, 'aadhaar', allowedExtensions: const ['pdf'])`;
  });
  content = content.replace(/_pickFile\(d,\s*'pan'\)/g, () => {
    modified = true;
    return `_pickFile(d, 'pan', allowedExtensions: const ['pdf'])`;
  });
  content = content.replace(/_pickFile\(d,\s*'addressProof'\)/g, () => {
    modified = true;
    return `_pickFile(d, 'addressProof', allowedExtensions: const ['pdf'])`;
  });

  // For other forms that might have a different format, let's catch:
  // _pickFile((path) { d.aadhaar = path; })
  
  if (modified) {
    fs.writeFileSync(dartFile, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
