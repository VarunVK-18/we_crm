import 'dart:io';

void main() {
  final dir = Directory('lib');
  int modifiedCount = 0;

  for (final entity in dir.listSync(recursive: true)) {
    if (entity is File && entity.path.endsWith('.dart') && !entity.path.contains('error_handler.dart')) {
      final content = entity.readAsStringSync();
      
      // Basic check if the file has a catch block that might need fixing
      if (content.contains('catch (e) {') || content.contains('catch(e) {') || content.contains('catch (error) {')) {
        
        bool modified = false;
        
        // We do a simple regex to find catch blocks and inject showGlobalError if not present
        final regex = RegExp(r'(catch\s*\(\s*([a-zA-Z_]+)\s*\)\s*\{)');
        
        final newContent = content.replaceAllMapped(regex, (match) {
          final catchStatement = match.group(1)!;
          final varName = match.group(2)!;
          
          // Inject it at the top of the catch block.
          modified = true;
          return '$catchStatement\n      showGlobalError($varName);';
        });

        if (modified && newContent != content) {
          // Check if we need to add import
          String finalContent = newContent;
          if (!finalContent.contains('error_handler.dart')) {
            // Find the last import and add ours after it
            final importRegex = RegExp(r'(import\s+[^;]+;\n)');
            final matches = importRegex.allMatches(finalContent);
            if (matches.isNotEmpty) {
              final lastMatch = matches.last;
              finalContent = finalContent.replaceRange(lastMatch.end, lastMatch.end, "import 'package:crm_app/core/utils/error_handler.dart';\n");
            } else {
              finalContent = "import 'package:crm_app/core/utils/error_handler.dart';\n$finalContent";
            }
          }
          
          entity.writeAsStringSync(finalContent);
          modifiedCount++;
          print('Modified: ${entity.path}');
        }
      }
    }
  }
  print('Total files modified: $modifiedCount');
}
