import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class DraftService {
  Future<Map<String, dynamic>?> loadDraft(String id, String screenName) async {
    final prefs = await SharedPreferences.getInstance();
    final key = 'draft_${screenName}_$id';
    final data = prefs.getString(key);
    if (data != null) {
      return jsonDecode(data) as Map<String, dynamic>;
    }
    return null;
  }

  Future<void> saveDraft(String id, String screenName, Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    final key = 'draft_${screenName}_$id';
    await prefs.setString(key, jsonEncode(data));
  }

  Future<void> clearDraft(String id, String screenName) async {
    final prefs = await SharedPreferences.getInstance();
    final key = 'draft_${screenName}_$id';
    await prefs.remove(key);
  }
}

final draftServiceProvider = Provider<DraftService>((ref) {
  return DraftService();
});
