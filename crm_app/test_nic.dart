import 'dart:io';
import 'dart:convert';

void main() {
  final file = File('c:/projects/we_crm/crm_app/assets/json/NIC_2008_classification.json');
  final response = file.readAsStringSync();
  
  try {
    final data = json.decode(response);
    
    List<Map<String, dynamic>> codes = [];
    final sections = data['NIC_2008']?['sections'] ?? [];
    
    for (var sec in sections) {
      final sectionCode = sec['section'] ?? '';
      final sectionTitle = sec['title'] ?? '';
      
      for (var div in sec['divisions'] ?? []) {
        if (div['division'] != null) {
          codes.add({
            'code': div['division'],
            'type': 'Division',
          });
        }
        
        for (var grp in div['groups'] ?? []) {
          if (grp['code'] != null) {
            codes.add({
              'code': grp['code'],
              'type': 'Group',
            });
          }
          
          for (var cls in grp['classes'] ?? []) {
            if (cls['code'] != null) {
              codes.add({
                'code': cls['code'],
                'type': 'Class',
              });
            }
            
            for (var sub in cls['sub_classes'] ?? []) {
              if (sub['code'] != null) {
                codes.add({
                  'code': sub['code'],
                  'type': 'Sub-class',
                });
              }
            }
          }
        }
      }
    }
    print('Codes length: ${codes.length}');
  } catch (e) {
    print('Error: $e');
  }
}
