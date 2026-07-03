import 'dart:convert';
import 'dart:io';

void main() async {
  final file = File('assets/json/NIC_2008_classification.json');
  final String contents = await file.readAsString();
  final data = json.decode(contents);
  
  final sections = data['NIC_2008']['sections'] as List;
  for (var sec in sections) {
    if (sec['section'] == 'U') {
      final divisions = sec['divisions'] as List;
      for (var div in divisions) {
        if (div['division'] == '99') {
          final groups = div['groups'] as List;
          for (var grp in groups) {
            if (grp['code'] == '990') {
              final classes = grp['classes'] as List;
              // Keep only class '9900'
              grp['classes'] = classes.where((c) => c['code'] == '9900').toList();
            }
          }
        }
      }
    }
  }
  
  await file.writeAsString(json.encode(data));
  print('JSON cleaned successfully.');
}
