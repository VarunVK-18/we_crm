import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import '../core/constants/port.dart';
import 'auth_provider.dart';

class SubscriptionModel {
  final String id;
  final String planName;
  final String planTier;
  final String status;
  final DateTime expiryDate;

  SubscriptionModel({
    required this.id,
    required this.planName,
    required this.planTier,
    required this.status,
    required this.expiryDate,
  });

  factory SubscriptionModel.fromMap(Map<String, dynamic> map) {
    return SubscriptionModel(
      id: map['_id'] ?? '',
      planName: map['plan_name'] ?? 'Premium Plan',
      planTier: map['plan_tier'] ?? 'Gold',
      status: map['status'] ?? 'Active',
      expiryDate: map['expiry_date'] != null ? DateTime.parse(map['expiry_date']) : DateTime.now().add(const Duration(days: 365)),
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
