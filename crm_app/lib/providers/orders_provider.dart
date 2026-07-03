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

          final assignedTo = c['assigned_to'];
          final isAssignedToExpert = assignedTo != null && 
              (assignedTo['role'] == 'filling_staff' || assignedTo['role'] == 'account_manager');

          final String actualCompany = (c['details'] != null && c['details']['entityName'] != null)
              ? c['details']['entityName'].toString()
              : (c['company_name']?.toString() ??
                  (c['client_id'] != null ? c['client_id']['company_name']?.toString() : null) ??
                  companyName);

          final mappedData = <String, dynamic>{
            'clientUid': uid,
            'entityName':
                actualCompany.isNotEmpty ? actualCompany : 'Default Entity',
            'serviceType': c['service_name'] ?? '',
            'companyName': actualCompany,
            'status': c['status'] == 'completed'
                ? 'complete'
                : (!isAssignedToExpert ? 'notInitialized' : 'active'),
            'stage': c['status'] == 'completed'
                ? 'completed'
                : (!isAssignedToExpert ? 'reqReceived' : 'workInProgress'),
            'steps': (c['items'] as List<dynamic>? ?? [])
                .map((i) => {
                      'title': i['title'] ?? i['label'] ?? '',
                      'description': i['description'] ?? i['notes'] ?? '',
                      'isCompleted': i['isChecked'] == true,
                      'isActionStep': i['isActionStep'] == true,
                    })
                .toList(),
            'requestedDocuments': c['requested_documents'] ?? [],
            'finalDocuments': c['final_documents'] ?? [],
            'assignedExpert': isAssignedToExpert
                ? (assignedTo['owner_name'] ?? 'To be assigned')
                : 'To be assigned',
            'expertPhone':
                isAssignedToExpert ? (assignedTo['phone'] ?? '') : '',
            'customServiceId': c['custom_service_id']?.toString() ?? '',
            'createdAt': c['createdAt'],
            'dealClosedAmount': c['dealClosedAmount'] ?? 0,
            'advanceAmountPaid': c['advanceAmountPaid'] ?? 0,
            'notes': c['notes'] ?? '',
            'details': c['details'] ?? {},
            'actionRequired': c['action_required'] ?? false,
          };

          return ServiceOrder.fromMap(mappedData, id);
        }).toList();

        yield orders;
      }
    } catch (e) {
      print("Error fetching real-time service orders: $e");
    }

    await Future.delayed(const Duration(seconds: 2));
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
  return orders.where((o) => o.status == ServiceStatus.notInitialized).toList();
});
