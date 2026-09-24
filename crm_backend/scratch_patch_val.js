const fs = require('fs');

const path = 'c:\\\\projects\\\\we_crm\\\\crm_app\\\\lib\\\\features\\\\services\\\\dynamic_form_screen.dart';
let c = fs.readFileSync(path, 'utf8');

// The replacement logic:
const oldValidation = `              if (v != null && v.isNotEmpty) {
                String strVal = v.trim();
                String lowerName = (field.name).toLowerCase();
                String lowerLabel = (field.label).toLowerCase();`;

const newValidation = `              if (v != null && v.isNotEmpty) {
                String strVal = v.trim();
                
                // 1. Dynamic Regex Validation from Schema
                if (field.validation != null && field.validation!.pattern.isNotEmpty) {
                  try {
                    final regex = RegExp(field.validation!.pattern);
                    if (!regex.hasMatch(strVal)) {
                      return field.validation!.message.isNotEmpty ? field.validation!.message : 'Invalid format';
                    }
                  } catch (e) {
                    debugPrint('Invalid Regex: \${field.validation!.pattern}');
                  }
                }

                String lowerName = (field.name).toLowerCase();
                String lowerLabel = (field.label).toLowerCase();`;

c = c.replace(oldValidation, newValidation);

fs.writeFileSync(path, c, 'utf8');
console.log('Patched dynamic form validation');
