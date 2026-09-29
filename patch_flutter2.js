const fs = require('fs');
let c = fs.readFileSync('crm_app/lib/features/services/dynamic_form_screen.dart', 'utf8');

c = c.replace(/if \(field\.validation != null && field\.validation!\.pattern\.isNotEmpty\) \{/, `if (field.validation == null) {
                      return 'VALIDATION IS NULL!';
                    }
                    if (field.validation != null && field.validation!.pattern.isNotEmpty) {`);

fs.writeFileSync('crm_app/lib/features/services/dynamic_form_screen.dart', c);
