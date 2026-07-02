import os
import re

directory = r'c:\projects\we_crm\crm_app\lib\features\orders'

old_build_field_pattern = re.compile(
    r'(Widget _buildField\(String label, String hint, TextEditingController controller, \{bool isRequired = false, TextInputType keyboardType = TextInputType\.text, bool isDate = false\}\) \{.*?TextFormField\(.*?)validator:.*?,\n(\s*\),\n\s*\])',
    re.DOTALL
)

new_build_field_text = '''\\1autovalidateMode: AutovalidateMode.onUserInteraction,
            validator: (v) {
              if (isRequired && (v == null || v.trim().isEmpty)) {
                return 'This is a required question';
              }
              if (v != null && v.trim().isNotEmpty) {
                final text = v.trim();
                final labelLower = label.toLowerCase();
                if (labelLower.contains('phone') || labelLower.contains('mobile') || labelLower.contains('contact')) {
                  if (!RegExp(r'^[0-9]{10}$').hasMatch(text)) return 'Enter a valid 10-digit phone number';
                } else if (labelLower.contains('aadhaar') || labelLower.contains('adhar')) {
                  if (!RegExp(r'^[0-9]{12}$').hasMatch(text)) return 'Enter a valid 12-digit Aadhaar number';
                } else if (labelLower.contains('pan')) {
                  if (!RegExp(r'^[a-zA-Z]{5}[0-9]{4}[a-zA-Z]{1}$').hasMatch(text)) return 'Enter a valid PAN (e.g. ABCDE1234F)';
                } else if (labelLower.contains('tan')) {
                  if (!RegExp(r'^[a-zA-Z]{4}[0-9]{5}[a-zA-Z]{1}$').hasMatch(text)) return 'Enter a valid TAN (e.g. ABCD12345E)';
                }
              }
              return null;
            },
\\2'''

for filename in os.listdir(directory):
    if filename.endswith('_form_screen.dart'):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = old_build_field_pattern.sub(new_build_field_text, content)
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'Updated {filename}')
        else:
            print(f'No match found in {filename}')
