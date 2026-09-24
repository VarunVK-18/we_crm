const fs = require('fs');

const path = 'c:\\\\projects\\\\we_crm\\\\crm_app\\\\lib\\\\models\\\\form_schema_model.dart';
let c = fs.readFileSync(path, 'utf8');

const fieldValidationClass = `class FieldValidation {
  final String pattern;
  final String message;

  FieldValidation({required this.pattern, required this.message});

  factory FieldValidation.fromJson(Map<String, dynamic> json) {
    return FieldValidation(
      pattern: json['pattern'] ?? '',
      message: json['message'] ?? 'Invalid format',
    );
  }
}

`;

c = fieldValidationClass + c;
c = c.replace('final Map<String, dynamic>? visibilityCondition;', 'final Map<String, dynamic>? visibilityCondition;\\n  final FieldValidation? validation;');
c = c.replace('this.visibilityCondition,', 'this.visibilityCondition,\\n    this.validation,');
c = c.replace("visibilityCondition: json['visibilityCondition'],", "visibilityCondition: json['visibilityCondition'],\\n      validation: json['validation'] != null ? FieldValidation.fromJson(json['validation']) : null,");

fs.writeFileSync(path, c, 'utf8');
console.log('Patched form schema model');
