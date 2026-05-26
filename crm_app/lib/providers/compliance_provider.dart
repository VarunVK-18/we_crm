import 'dart:async';
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import '../core/constants/port.dart';
import '../features/compliance/compliance_reminder_model.dart';
import 'auth_provider.dart';
import 'orders_provider.dart';

// Provider to track the currently selected business entity for compliance views
final selectedEntityProvider = StateProvider<String>((ref) {
  return 'Wealth Empires Tech'; // Fallback, will be updated by UI
});

/// Real-time stream of [ComplianceReminder] documents from the database.
final complianceRemindersProvider = StreamProvider<List<ComplianceReminder>>((ref) {
  final uid = ref.watch(authStateProvider).value?.uid;
  if (uid == null) return Stream.value([]);

  final controller = StreamController<List<ComplianceReminder>>();

  Future<void> fetchReminders() async {
    try {
      final response = await http.get(
        Uri.parse('$kBaseUrl/api/compliance/user/$uid'),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        final List<dynamic> remindersJson = data['reminders'] ?? [];
        final reminders = remindersJson.map((r) {
          try {
            final map = r as Map<String, dynamic>;
            final id = map['_id']?.toString() ?? '';
            
            // Map status string to ReminderStatus enum
            ReminderStatus status = ReminderStatus.expiringSoon;
            final statusStr = map['status']?.toString();
            if (statusStr == 'urgent') {
              status = ReminderStatus.urgent;
            } else if (statusStr == 'expired') {
              status = ReminderStatus.expired;
            }

            final serviceName = map['serviceName']?.toString() ?? '';
            final entityName = map['entityName']?.toString() ?? '';
            
            int days = 0;
            final daysVal = map['daysLeft'];
            if (daysVal != null) {
              if (daysVal is num) {
                days = daysVal.toInt();
              } else {
                days = int.tryParse(daysVal.toString()) ?? 0;
              }
            }

            return ComplianceReminder(
              id: id,
              serviceName: serviceName,
              entityName: entityName,
              daysLeft: days,
              status: status,
            );
          } catch (e, stackTrace) {
            print("Error mapping compliance reminder: $e\n$stackTrace");
            return ComplianceReminder(
              id: '',
              serviceName: 'Filing Alert',
              entityName: '',
              daysLeft: 1,
              status: ReminderStatus.expiringSoon,
            );
          }
        }).toList();
        
        if (!controller.isClosed) {
          controller.add(reminders);
        }
      } else {
        if (!controller.isClosed) {
          controller.add([]);
        }
      }
    } catch (e) {
      print("Error fetching real-time compliance reminders: $e");
      if (!controller.isClosed) {
        controller.add([]);
      }
    }
  }

  // Fetch immediately
  fetchReminders();

  // Poll database every 4 seconds for real-time compliance updates
  final timer = Timer.periodic(const Duration(seconds: 4), (_) => fetchReminders());

  ref.onDispose(() {
    timer.cancel();
    controller.close();
  });

  return controller.stream;
});
