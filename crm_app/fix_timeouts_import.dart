import 'dart:io';

void main() {
  final dir = Directory('lib');
  int modifiedCount = 0;

  for (final entity in dir.listSync(recursive: true)) {
    if (entity is File && entity.path.endsWith('.dart') && !entity.path.contains('http_client.dart')) {
      final content = entity.readAsStringSync();
      
      if (content.contains("import 'package:http/http.dart' as http;")) {
        final newContent = content.replaceAll(
          "import 'package:http/http.dart' as http;", 
          "import 'package:crm_app/core/utils/http_client.dart' as http;"
        );
        entity.writeAsStringSync(newContent);
        modifiedCount++;
        print('Modified: ${entity.path}');
      } else if (content.contains('import "package:http/http.dart" as http;')) {
        final newContent = content.replaceAll(
          'import "package:http/http.dart" as http;', 
          "import 'package:crm_app/core/utils/http_client.dart' as http;"
        );
        entity.writeAsStringSync(newContent);
        modifiedCount++;
        print('Modified: ${entity.path}');
      }
    }
  }
  print('Total files modified: $modifiedCount');
}
