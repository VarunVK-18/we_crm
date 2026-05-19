import 'dart:async';
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import '../core/constants/port.dart';
import '../models/order_model.dart';
import 'auth_provider.dart';

/// Real-time stream of [ServiceOrder] documents from the database.
final serviceOrdersProvider = StreamProvider<List<ServiceOrder>>((ref) {
  final uid = ref.watch(authStateProvider).value?.uid;
  if (uid == null) return Stream.value([]);

  final controller = StreamController<List<ServiceOrder>>();

  Future<void> fetchOrders() async {
    try {
      final response = await http.get(
        Uri.parse('$kBaseUrl/api/orders/user/$uid'),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        final List<dynamic> ordersJson = data['orders'] ?? [];
        final orders = ordersJson.map((o) {
          final id = o['_id']?.toString() ?? '';
          return ServiceOrder.fromMap(o as Map<String, dynamic>, id);
        }).toList();
        if (!controller.isClosed) {
          controller.add(orders);
        }
      }
    } catch (e) {
      print("Error fetching real-time service orders: $e");
    }
  }

  // Fetch immediately on load
  fetchOrders();

  // Poll database every 4 seconds for real-time progress updates
  final timer = Timer.periodic(const Duration(seconds: 4), (_) => fetchOrders());

  ref.onDispose(() {
    timer.cancel();
    controller.close();
  });

  return controller.stream;
});

/// Convenience derived providers for filtered lists.
final activeOrdersProvider = Provider<List<ServiceOrder>>((ref) {
  final orders = ref.watch(serviceOrdersProvider).value ?? [];
  return orders.where((o) => o.status == ServiceStatus.active).toList();
});

final completeOrdersProvider = Provider<List<ServiceOrder>>((ref) {
  final orders = ref.watch(serviceOrdersProvider).value ?? [];
  return orders.where((o) => o.status == ServiceStatus.complete).toList();
});

final notInitializedOrdersProvider = Provider<List<ServiceOrder>>((ref) {
  final orders = ref.watch(serviceOrdersProvider).value ?? [];
  return orders
      .where((o) => o.status == ServiceStatus.notInitialized)
      .toList();
});
