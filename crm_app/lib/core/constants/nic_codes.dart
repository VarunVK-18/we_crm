import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';

class NicCode {
  final String code;
  final String description;
  final String type;
  final String section;
  final String sectionTitle;

  const NicCode({
    required this.code,
    required this.description,
    required this.type,
    this.section = '',
    this.sectionTitle = '',
  });
}

class NicCodeService {
  static Future<List<NicCode>> loadNicCodes() async {
    try {
      final String response = await rootBundle.loadString('assets/json/NIC_2008_classification.json');
      final data = await json.decode(response);
      
      List<NicCode> codes = [];
      final sections = data['NIC_2008']?['sections'] ?? [];
      
      for (var sec in sections) {
        final sectionCode = sec['section'] ?? '';
        final sectionTitle = sec['title'] ?? '';
        
        for (var div in sec['divisions'] ?? []) {
          if (div['division'] != null) {
            codes.add(NicCode(
              code: div['division'],
              description: div['title'] ?? '',
              type: 'Division',
              section: sectionCode,
              sectionTitle: sectionTitle,
            ));
          }
          
          for (var grp in div['groups'] ?? []) {
            if (grp['code'] != null) {
              codes.add(NicCode(
                code: grp['code'],
                description: grp['description'] ?? '',
                type: 'Group',
                section: sectionCode,
                sectionTitle: sectionTitle,
              ));
            }
            
            for (var cls in grp['classes'] ?? []) {
              if (cls['code'] != null) {
                codes.add(NicCode(
                  code: cls['code'],
                  description: cls['description'] ?? '',
                  type: 'Class',
                  section: sectionCode,
                  sectionTitle: sectionTitle,
                ));
              }
              
              for (var sub in cls['sub_classes'] ?? []) {
                if (sub['code'] != null) {
                  codes.add(NicCode(
                    code: sub['code'],
                    description: sub['description'] ?? '',
                    type: 'Sub-class',
                    section: sectionCode,
                    sectionTitle: sectionTitle,
                  ));
                }
              }
            }
          }
        }
      }
      return codes;
    } catch (e) {
      debugPrint('Error loading NIC codes: $e');
      return [];
    }
  }
}
