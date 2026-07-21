import 'dart:io';

void main() {
  final dir = Directory('lib');
  int modifiedCount = 0;

  for (final entity in dir.listSync(recursive: true)) {
    if (entity is File && entity.path.endsWith('.dart') && !entity.path.contains('file_picker_util.dart')) {
      final content = entity.readAsStringSync();
      
      bool modified = false;
      String newContent = content;
      
      if (newContent.contains('FilePicker.platform.pickFiles(')) {
        newContent = newContent.replaceAll('FilePicker.platform.pickFiles(', 'FilePickerUtil.pickFiles(');
        modified = true;
      }
      
      if (newContent.contains('picker.pickImage(')) {
        newContent = newContent.replaceAll('picker.pickImage(', 'FilePickerUtil.pickImage(');
        modified = true;
      }

      if (newContent.contains('_picker.pickImage(')) {
        newContent = newContent.replaceAll('_picker.pickImage(', 'FilePickerUtil.pickImage(');
        modified = true;
      }
      
      // Some files might use ImagePicker().pickImage directly
      if (newContent.contains('ImagePicker().pickImage(')) {
        newContent = newContent.replaceAll('ImagePicker().pickImage(', 'FilePickerUtil.pickImage(');
        modified = true;
      }

      if (modified && newContent != content) {
        if (!newContent.contains('file_picker_util.dart')) {
          final importRegex = RegExp(r'(import\s+[^;]+;\n)');
          final matches = importRegex.allMatches(newContent);
          if (matches.isNotEmpty) {
            final lastMatch = matches.last;
            newContent = newContent.replaceRange(lastMatch.end, lastMatch.end, "import 'package:crm_app/core/utils/file_picker_util.dart';\n");
          } else {
            newContent = "import 'package:crm_app/core/utils/file_picker_util.dart';\n$newContent";
          }
        }
        
        entity.writeAsStringSync(newContent);
        modifiedCount++;
        print('Modified: ${entity.path}');
      }
    }
  }
  print('Total files modified: $modifiedCount');
}
