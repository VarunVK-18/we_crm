const fs = require('fs');
let c = fs.readFileSync('crm_app/lib/features/services/dynamic_form_screen.dart', 'utf8');

c = c.replace(/String strVal = v\.trim\(\);\s*String lowerName = \(field\.name\)\.toLowerCase\(\);/g, `String strVal = v.trim();

                  if (field.validation != null && field.validation!.pattern.isNotEmpty) {
                    try {
                      if (!RegExp(field.validation!.pattern).hasMatch(strVal)) {
                        return field.validation!.message.isNotEmpty ? field.validation!.message : 'Invalid format';
                      }
                    } catch (e) {
                      // Ignore bad regex
                    }
                  }

                  String lowerName = (field.name).toLowerCase();`);

fs.writeFileSync('crm_app/lib/features/services/dynamic_form_screen.dart', c);
