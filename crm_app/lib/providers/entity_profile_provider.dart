// ignore_for_file: deprecated_member_use
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: unnecessary_brace_in_string_interps
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;
import '../core/constants/port.dart';
import 'auth_provider.dart';

/// Fetches the aggregated entity profile from the backend.
/// Returns a Map<String, String> of common field values pulled from all
/// previously submitted forms (MSME, FSSAI, DPIIT, IEC, LEI, DUNS, GST, etc.)
final entityProfileProvider =
    FutureProvider<Map<String, String>>((ref) async {
  final uid = ref.watch(authStateProvider).value?.uid;
  if (uid == null) return {};

  try {
    final response = await http.get(
      Uri.parse('$kBaseUrl/api/entity-profile'),
      headers: {'x-user-id': uid},
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final profile = data['profile'] as Map<String, dynamic>? ?? {};
      return profile.map((k, v) => MapEntry(k, v?.toString() ?? ''));
    }
  } catch (e) {
    // silently ignore — prefill is best-effort
  }
  return {};
});
