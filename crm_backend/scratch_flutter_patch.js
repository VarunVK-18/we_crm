const fs = require('fs');

const path = 'c:\\\\projects\\\\we_crm\\\\crm_app\\\\lib\\\\features\\\\services\\\\dynamic_form_screen.dart';
let c = fs.readFileSync(path, 'utf8');

const oldDropdownChange = `            onChanged: (value) {
              setState(() {
                _formData[pathKey] = value;
              });
              _saveDraft();
            },`;

const newDropdownChange = `            onChanged: (value) {
              setState(() {
                _formData[pathKey] = value;
                
                // Custom Authorized Signatory exclusive logic
                if (field.name == 'isAuthSignatory' && value == 'Yes') {
                  bool othersChanged = false;
                  // Look for other array items in formData
                  final baseArrayMatch = RegExp(r'^(.*?\\[)\\d+(\\]).*$').firstMatch(pathKey);
                  if (baseArrayMatch != null) {
                    final prefix = baseArrayMatch.group(1)!;
                    final suffix = baseArrayMatch.group(2)!;
                    
                    // Iterate through formData keys that look like sibling items
                    for (final key in _formData.keys.toList()) {
                      if (key != pathKey && key.startsWith(prefix) && key.endsWith('].isAuthSignatory')) {
                        if (_formData[key] == 'Yes') {
                          _formData[key] = 'No';
                          othersChanged = true;
                        }
                      }
                    }
                    
                    if (othersChanged) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Only one Authorized Signatory is allowed. The other director has been automatically set to "No".'),
                          backgroundColor: Colors.orange,
                          duration: Duration(seconds: 3),
                        )
                      );
                    }
                  }
                }
              });
              _saveDraft();
            },`;

c = c.replace(oldDropdownChange, newDropdownChange);
fs.writeFileSync(path, c, 'utf8');
console.log('Patched Flutter app logic for auth signatory');
