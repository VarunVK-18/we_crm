import 'dart:async';
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;
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
        Uri.parse('$kBaseUrl/api/my-services-summary'),
        headers: {'x-user-id': uid},
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        final List<dynamic> servicesJson = data['services'] ?? [];

        final user = ref.read(userProfileProvider).value;
        final companyName = user?.companyName ?? '';

        final orders = servicesJson.map((c) {
          final id = c['_id']?.toString() ?? '';

          final assignedTo = c['assigned_to'];
          final isAssignedToExpert = assignedTo != null;

          final details = c['details'] as Map<String, dynamic>? ?? {};
          final String actualCompany = (details['entityName']?.toString().isNotEmpty == true)
              ? details['entityName'].toString()
              : (details['companyName']?.toString() ??
                  details['businessName']?.toString() ??
                  details['proposed_company_name']?.toString() ??
                  companyName);

          // Build synthetic steps list from pre-computed counts for progress display
          final int totalItems = (c['totalItems'] as num?)?.toInt() ?? 0;
          final int completedItems = (c['completedItems'] as num?)?.toInt() ?? 0;
          final List<Map<String, dynamic>> syntheticSteps = List.generate(totalItems, (i) => {
            'title': 'Step ${i + 1}',
            'description': '',
            'isCompleted': i < completedItems,
            'isActionStep': false,
            'has_custom_input': false,
            'custom_input_label': '',
            'custom_input_value': '',
            'completedAt': null,
          });

          final mappedData = <String, dynamic>{
            'clientUid': uid,
            'entityName': actualCompany.isNotEmpty ? actualCompany : 'Default Entity',
            'serviceType': c['service_name'] ?? '',
            'companyName': actualCompany,
            'status': c['status'] == 'completed'
                ? 'complete'
                : (!isAssignedToExpert ? 'notInitialized' : 'active'),
            'stage': c['status'] == 'completed'
                ? 'completed'
                : (!isAssignedToExpert ? 'reqReceived' : 'workInProgress'),
            'steps': syntheticSteps,
            'requestedDocuments': [],
            'finalDocuments': [],
            'temporaryDocuments': [],
            'assignedExpert': isAssignedToExpert
                ? (assignedTo['owner_name'] ?? 'To be assigned')
                : 'To be assigned',
            'expertPhone': '',
            'customServiceId': '',
            'createdAt': c['createdAt'],
            'dealClosedAmount': 0,
            'advanceAmountPaid': 0,
            'notes': '',
            'details': {
              ...details,
            },
            'actionRequired': c['action_required'] ?? false,
          };

          return ServiceOrder.fromMap(mappedData, id);
        }).toList();

        yield orders;
      }
    } catch (e) {
      // Silently ignore background polling errors — these fire every 10s and
      // would spam the user with snackbars when the app resumes from background.
      print("Error fetching service orders summary: $e");
    }

    await Future.delayed(const Duration(seconds: 10));
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
