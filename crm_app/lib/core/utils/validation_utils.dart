class ValidationUtils {
  static bool isValidEmail(String? email) {
    if (email == null || email.isEmpty) return false;
    return email.contains('@') && email.length > 3;
  }

  static bool isValidPhone(String? phone) {
    if (phone == null || phone.isEmpty) return false;
    // Remove any formatting spaces/dashes if necessary, but assume raw input here
    final cleaned = phone.replaceAll(RegExp(r'\D'), '');
    return cleaned.length == 10;
  }

  static bool isValidPan(String? pan) {
    if (pan == null || pan.isEmpty) return false;
    final regex = RegExp(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$');
    return regex.hasMatch(pan.toUpperCase());
  }
}
