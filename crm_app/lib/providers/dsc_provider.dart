import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import '../core/constants/port.dart';
import '../models/dsc_order_model.dart';
import 'auth_provider.dart';

/// Real-time stream of [DscOrder] documents from the database.
final dscOrdersProvider = StreamProvider<List<DscOrder>>((ref) {
  final uid = ref.watch(authStateProvider).value?.uid;
  if (uid == null) return Stream.value([]);

  final controller = StreamController<List<DscOrder>>();

  Future<void> fetchDscOrders() async {
    try {
      final response = await http.get(
        Uri.parse('$kBaseUrl/api/dsc/user/$uid'),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        final List<dynamic> ordersJson = data['orders'] ?? [];
        final orders = ordersJson.map((o) {
          final id = o['_id']?.toString() ?? '';
          return DscOrder.fromMap(o as Map<String, dynamic>, id);
        }).toList();
        if (!controller.isClosed) {
          controller.add(orders);
        }
      }
    } catch (e) {
      debugPrint("Error fetching real-time DSC orders: $e");
    }
  }

  // Fetch immediately on load
  fetchDscOrders();

  // Poll database every 4 seconds for real-time progress updates
  final timer = Timer.periodic(const Duration(seconds: 4), (_) => fetchDscOrders());

  ref.onDispose(() {
    timer.cancel();
    controller.close();
  });

  return controller.stream;
});
