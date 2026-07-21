import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;
import '../core/constants/port.dart';
import 'auth_provider.dart';

class SubscriptionModel {
  final String id;
  final String planName;
  final String planTier;
  final String status;
  final DateTime expiryDate;
  final String entityName;

  SubscriptionModel({
    required this.id,
    required this.planName,
    required this.planTier,
    required this.status,
    required this.expiryDate,
    required this.entityName,
  });

  static String _parseEntityName(Map<String, dynamic> map) {
    if (map['checklist_id'] is Map<String, dynamic>) {
      final cl = map['checklist_id'];
      if (cl['details'] != null && cl['details'] is Map) {
         if (cl['details']['entityName'] != null) return cl['details']['entityName'].toString().trim();
         if (cl['details']['companyName'] != null) return cl['details']['companyName'].toString().trim();
      }
      if (cl['entityName'] != null) return cl['entityName'].toString().trim();
      if (cl['companyName'] != null) return cl['companyName'].toString().trim();
    }
    return '';
  }

  factory SubscriptionModel.fromMap(Map<String, dynamic> map) {
    return SubscriptionModel(
      id: map['_id'] ?? '',
      planName: map['plan_name'] ?? 'Premium Plan',
      planTier: map['plan_tier'] ?? 'Gold',
      status: map['status'] ?? 'Active',
      expiryDate: map['expiry_date'] != null ? DateTime.parse(map['expiry_date']) : DateTime.now().add(const Duration(days: 365)),
      entityName: _parseEntityName(map),
    );
  }
}

final mySubscriptionsProvider = FutureProvider.autoDispose<List<SubscriptionModel>>((ref) async {
  final authState = ref.watch(authStateProvider).value;
  if (authState == null) return [];

  final uid = authState.uid;
  try {
    final response = await http.get(
      Uri.parse('$kBaseUrl/api/subscriptions/my-subscriptions'),
      headers: {'x-user-id': uid},
    ).timeout(const Duration(seconds: 8));

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final raw = data['subscriptions'] as List<dynamic>? ?? [];
      return raw
          .map((s) => SubscriptionModel.fromMap(s as Map<String, dynamic>))
          .toList();
    }
    return [];
  } catch (_) {
    return [];
  }
});

Future<bool> renewSubscription(String uid, String subId) async {
  try {
    final response = await http.post(
      Uri.parse('$kBaseUrl/api/subscriptions/renew/$subId'),
      headers: {'x-user-id': uid},
    ).timeout(const Duration(seconds: 8));

    if (response.statusCode == 200) {
      return true;
    }
    return false;
  } catch (_) {
    return false;
  }
}
