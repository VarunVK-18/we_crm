enum ValidationType {
  none,
  phone,
  aadhaar,
  pan,
  tan,
}

class FormValidators {
  static String? validate(String? value, ValidationType type, {bool isRequired = false}) {
    if (value == null || value.trim().isEmpty) {
      return isRequired ? 'This is a required field' : null;
    }

    final trimmedValue = value.trim();

    switch (type) {
      case ValidationType.phone:
        final phoneRegex = RegExp(r'^[0-9]{10}$');
        if (!phoneRegex.hasMatch(trimmedValue)) {
          return 'Enter a valid 10-digit phone number';
        }
        break;
      case ValidationType.aadhaar:
        final aadhaarRegex = RegExp(r'^[0-9]{12}$');
        if (!aadhaarRegex.hasMatch(trimmedValue)) {
          return 'Enter a valid 12-digit Aadhaar number';
        }
        break;
      case ValidationType.pan:
        final panRegex = RegExp(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$');
        if (!panRegex.hasMatch(trimmedValue.toUpperCase())) {
          return 'Enter a valid PAN (e.g. ABCDE1234F)';
        }
        break;
      case ValidationType.tan:
        final tanRegex = RegExp(r'^[A-Z]{4}[0-9]{5}[A-Z]{1}$');
        if (!tanRegex.hasMatch(trimmedValue.toUpperCase())) {
          return 'Enter a valid TAN (e.g. ABCD12345E)';
        }
        break;
      case ValidationType.none:
      default:
        break;
    }

    return null;
  }
}
