import 'dart:io';

void main() {
  final directory = Directory('lib/features/orders');
  
  if (!directory.existsSync()) {
    print('Directory not found');
    return;
  }

  // Regex to match the validator line in _buildField
  final pattern1 = RegExp(r"validator:\s*isRequired\s*\?\s*\(v\)\s*=>\s*v\s*==\s*null\s*\|\|\s*v\.trim\(\)\.isEmpty\s*\?\s*'This is a required field'\s*:\s*null\s*:\s*null,");
  final pattern2 = RegExp(r"validator:\s*isRequired\s*\?\s*\(v\)\s*=>\s*v\s*==\s*null\s*\|\|\s*v\.trim\(\)\.isEmpty\s*\?\s*'This is a required question'\s*:\s*null\s*:\s*null,");
  
  final newValidationText = '''autovalidateMode: AutovalidateMode.onUserInteraction,
            validator: (v) {
              if (isRequired && (v == null || v.trim().isEmpty)) {
                return 'This is a required question';
              }
              if (v != null && v.trim().isNotEmpty) {
                final text = v.trim();
                final labelLower = label.toLowerCase();
                if (labelLower.contains('phone') || labelLower.contains('mobile') || labelLower.contains('contact')) {
                  if (!RegExp(r'^[0-9]{10}\$').hasMatch(text)) return 'Enter a valid 10-digit phone number';
                } else if (labelLower.contains('aadhaar') || labelLower.contains('adhar')) {
                  if (!RegExp(r'^[0-9]{12}\$').hasMatch(text)) return 'Enter a valid 12-digit Aadhaar number';
                } else if (labelLower.contains('pan')) {
                  if (!RegExp(r'^[a-zA-Z]{5}[0-9]{4}[a-zA-Z]{1}\$').hasMatch(text)) return 'Enter a valid PAN (e.g. ABCDE1234F)';
                } else if (labelLower.contains('tan')) {
                  if (!RegExp(r'^[a-zA-Z]{4}[0-9]{5}[a-zA-Z]{1}\$').hasMatch(text)) return 'Enter a valid TAN (e.g. ABCD12345E)';
                }
              }
              return null;
            },''';

  final entities = directory.listSync(recursive: true);
  for (var entity in entities) {
    if (entity is File && entity.path.endsWith('_form_screen.dart')) {
      String content = entity.readAsStringSync();
      bool modified = false;

      if (content.contains(pattern1)) {
        content = content.replaceAll(pattern1, newValidationText);
        modified = true;
      }
      if (content.contains(pattern2)) {
        content = content.replaceAll(pattern2, newValidationText);
        modified = true;
      }
      
      // Some files use `validator: validator ?? (isRequired ? ...)`
      final pattern3 = RegExp(r"validator:\s*validator\s*\?\?\s*\(isRequired\s*\?\s*\(v\)\s*=>\s*v\s*==\s*null\s*\|\|\s*v\.isEmpty\s*\?\s*'This is a required question'\s*:\s*null\s*:\s*null\),");
      if (content.contains(pattern3)) {
        content = content.replaceAll(pattern3, newValidationText.replaceFirst('validator: (v) {', 'validator: validator ?? (v) {'));
        modified = true;
      }
      
      final pattern4 = RegExp(r"validator:\s*validator\s*\?\?\s*\(isRequired\s*\?\s*\(v\)\s*=>\s*v\s*==\s*null\s*\|\|\s*v\.trim\(\)\.isEmpty\s*\?\s*'This is a required field'\s*:\s*null\s*:\s*null\),");
      if (content.contains(pattern4)) {
        content = content.replaceAll(pattern4, newValidationText.replaceFirst('validator: (v) {', 'validator: validator ?? (v) {'));
        modified = true;
      }

      if (modified) {
        entity.writeAsStringSync(content);
        print('Updated \${entity.path}');
      }
    }
  }
}
