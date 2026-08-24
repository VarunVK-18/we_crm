import 'dart:convert';
import 'dart:io';

void main() {
  final data = json.decode(File('assets/json/NIC_NEW_structured.json').readAsStringSync());
  final sections = data['NIC_2008']?['sections'] ?? [];
  int count = 0;
  for (var sec in sections) {
    for (var div in sec['divisions'] ?? []) {
      for (var grp in div['groups'] ?? []) {
        for (var cls in grp['classes'] ?? []) {
          for (var sub in cls['sub_classes'] ?? []) {
            count++;
          }
        }
      }
    }
  }
  print('Sub-classes count: $count');
}
