import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;
import '../core/constants/port.dart';
import '../models/checklist_model.dart';
import 'auth_provider.dart';

/// Fetches the checklists for the logged-in customer from the backend.
final myChecklistsProvider = FutureProvider.autoDispose<List<ChecklistModel>>((ref) async {
  final authState = ref.watch(authStateProvider).value;
  if (authState == null) return [];

  final uid = authState.uid;
  try {
    final response = await http.get(
      Uri.parse('$kBaseUrl/api/my-checklists'),
      headers: {'x-user-id': uid},
    ).timeout(const Duration(seconds: 8));

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final raw = data['checklists'] as List<dynamic>? ?? [];
      return raw
          .map((c) => ChecklistModel.fromMap(c as Map<String, dynamic>))
          .toList();
    }
    return [];
  } catch (_) {
    return [];
  }
});
