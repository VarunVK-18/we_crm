import 'package:flutter/services.dart';

class UpperCaseTextFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    return TextEditingValue(
      text: newValue.text.toUpperCase(),
      selection: newValue.selection,
    );
  }
}

class AadhaarInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    // Only allow digits
    String newText = newValue.text.replaceAll(RegExp(r'[^0-9]'), '');
    
    // Limit to 12 digits
    if (newText.length > 12) {
      newText = newText.substring(0, 12);
    }
    
    int cursorPosition = newValue.selection.baseOffset;
    if (cursorPosition > newText.length) {
      cursorPosition = newText.length;
    }
    
    return TextEditingValue(
      text: newText,
      selection: TextSelection.collapsed(offset: cursorPosition),
    );
  }
}
