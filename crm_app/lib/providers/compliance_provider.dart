import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import '../core/constants/port.dart';
import '../features/compliance/compliance_reminder_model.dart';
import 'auth_provider.dart';

// Provider to track the currently selected business entity for compliance views
final selectedEntityProvider = StateProvider<String>((ref) {
  return 'All Entities'; // Default to all entities
});

/// Real-time stream of [ComplianceReminder] documents from the database.
final complianceRemindersProvider =
    StreamProvider<List<ComplianceReminder>>((ref) {
  final uid = ref.watch(authStateProvider).value?.uid;
  if (uid == null) return Stream.value([]);

  final controller = StreamController<List<ComplianceReminder>>();

  Future<void> fetchReminders() async {
    try {
      final List<ComplianceReminder> allReminders = [];

      // Only fetch Checklists API for Final Documents Expiry
      try {
        final user = ref.read(userProfileProvider).value;
        final companyName = user?.companyName ?? '';

        final ordersResponse = await http.get(
          Uri.parse('$kBaseUrl/api/my-checklists'),
          headers: {'x-user-id': uid},
        ).timeout(const Duration(seconds: 5));

        if (ordersResponse.statusCode == 200) {
          final Map<String, dynamic> data = jsonDecode(ordersResponse.body);
          final List<dynamic> checklistsJson = data['checklists'] ?? [];

          for (final c in checklistsJson) {
            final String actualCompany = c['company_name']?.toString() ??
                (c['client_id'] != null
                    ? c['client_id']['company_name']?.toString()
                    : null) ??
                companyName;
            final String serviceName = c['service_name']?.toString() ?? '';
            final String entityName =
                actualCompany.isNotEmpty ? actualCompany : 'Default Entity';
            final List<dynamic> finalDocs = c['final_documents'] ?? [];

            for (final doc in finalDocs) {
              if (doc['expiry_date'] != null) {
                final expiryStr = doc['expiry_date'].toString();
                final expiryDate = DateTime.tryParse(expiryStr);

                if (expiryDate != null) {
                  final now = DateTime.now();
                  final daysLeft = expiryDate.difference(now).inDays;

                  ReminderStatus status = ReminderStatus.expiringSoon;
                  if (daysLeft < 0) {
                    status = ReminderStatus.expired;
                  } else if (daysLeft <= 7) {
                    status = ReminderStatus.urgent;
                  }

                  final docName = doc['name']?.toString() ?? 'Document';

                  allReminders.add(ComplianceReminder(
                    id: doc['document_id']?.toString() ??
                        DateTime.now().millisecondsSinceEpoch.toString(),
                    serviceName: serviceName,
                    entityName: entityName,
                    daysLeft: daysLeft,
                    status: status,
                  ));
                }
              }
            }
          }
        }
      } catch (e) {
        debugPrint("Error fetching checklists API: $e");
      }

      if (!controller.isClosed) {
        controller.add(allReminders);
      }
    } catch (e) {
      debugPrint("Error in fetchReminders: $e");
      if (!controller.isClosed) {
        controller.add([]);
      }
    }
  }

  // Fetch immediately
  fetchReminders();

  // Poll database every 4 seconds for real-time compliance updates
  final timer =
      Timer.periodic(const Duration(seconds: 4), (_) => fetchReminders());

  ref.onDispose(() {
    timer.cancel();
    controller.close();
  });

  return controller.stream;
});
