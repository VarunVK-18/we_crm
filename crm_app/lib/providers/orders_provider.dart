import 'dart:async';
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import '../core/constants/port.dart';
import '../models/order_model.dart';
import 'auth_provider.dart';

/// Real-time stream of [ServiceOrder] documents from the database.
final serviceOrdersProvider = StreamProvider<List<ServiceOrder>>((ref) async* {
  final uid = ref.watch(authStateProvider).value?.uid;
  if (uid == null) {
    yield [];
    return;
  }

  while (true) {
    try {
      final response = await http.get(
        Uri.parse('$kBaseUrl/api/my-checklists'),
        headers: {'x-user-id': uid},
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        final List<dynamic> checklistsJson = data['checklists'] ?? [];
        
        final user = ref.read(userProfileProvider).value;
        final companyName = user?.companyName ?? '';

        final orders = checklistsJson.map((c) {
          final id = c['_id']?.toString() ?? '';
          
          final mappedData = <String, dynamic>{
            'clientUid': uid,
            'entityName': companyName.isNotEmpty ? companyName : 'Default Entity',
            'serviceType': c['service_name'] ?? '',
            'companyName': companyName,
            'status': c['status'] == 'completed' ? 'complete' : (c['status'] == 'pending' ? 'notInitialized' : 'active'),
            'stage': c['status'] == 'completed' ? 'completed' : (c['status'] == 'pending' ? 'reqReceived' : 'workInProgress'),
            'steps': (c['items'] as List<dynamic>? ?? []).map((i) => {
              'title': i['title'] ?? i['label'] ?? '',
              'description': i['description'] ?? i['notes'] ?? '',
              'isCompleted': i['isChecked'] == true,
            }).toList(),
            'requestedDocuments': c['requested_documents'] ?? [],
            'finalDocuments': c['final_documents'] ?? [],
            'assignedExpert': c['assigned_to']?['owner_name'] ?? 'To be assigned',
            'expertPhone': c['assigned_to']?['phone'] ?? '',
            'createdAt': c['createdAt'],
          };

          return ServiceOrder.fromMap(mappedData, id);
        }).toList();

        yield orders;
      }
    } catch (e) {
      print("Error fetching real-time service orders: $e");
    }

    await Future.delayed(const Duration(seconds: 4));
  }
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
