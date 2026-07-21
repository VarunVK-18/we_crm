import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import 'package:crm_app/core/utils/error_handler.dart';

class TmClass {
  final int classNum;
  final String description;
  final String type;

  const TmClass({
    required this.classNum,
    required this.description,
    required this.type,
  });
}

class TmClassService {
  static Future<List<TmClass>> loadTmClasses() async {
    try {
      final String response = await rootBundle.loadString('assets/json/Trade Marks Classification.json');
      final data = await json.decode(response);
      
      List<TmClass> classes = [];
      
      for (var item in data['goods'] ?? []) {
        if (item['class'] != null) {
          classes.add(TmClass(
            classNum: item['class'],
            description: item['description'] ?? '',
            type: 'Goods',
          ));
        }
      }
      
      for (var item in data['services'] ?? []) {
        if (item['class'] != null) {
          classes.add(TmClass(
            classNum: item['class'],
            description: item['description'] ?? '',
            type: 'Services',
          ));
        }
      }
      
      return classes;
    } catch (e) {
      showGlobalError(e);
      debugPrint('Error loading Trade Mark classes: $e');
      return [];
    }
  }
}
