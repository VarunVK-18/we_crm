import 'package:flutter_riverpod/flutter_riverpod.dart';

class DraftService {
  Future<Map<String, dynamic>?> loadDraft(String id, String screenName) async {
    return null;
  }

  Future<void> saveDraft(String id, String screenName, Map<String, dynamic> data) async {}

  Future<void> clearDraft(String id, String screenName) async {}
}

final draftServiceProvider = Provider<DraftService>((ref) {
  return DraftService();
});
