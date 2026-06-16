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

/// Real-time stream of [ComplianceTask] documents from the database.
final complianceRemindersProvider =
    StreamProvider<List<ComplianceTask>>((ref) {
  final uid = ref.watch(authStateProvider).value?.uid;
  if (uid == null) return Stream.value([]);

  final controller = StreamController<List<ComplianceTask>>();

  Future<void> fetchReminders() async {
    try {
      final List<ComplianceTask> allTasks = [];

      try {
        final response = await http.get(
          Uri.parse('$kBaseUrl/api/compliance/tasks/user/$uid'),
          headers: {'x-user-id': uid},
        ).timeout(const Duration(seconds: 15));

        if (response.statusCode == 200) {
          final Map<String, dynamic> data = jsonDecode(response.body);
          final List<dynamic> tasksJson = data['tasks'] ?? [];

          for (final t in tasksJson) {
            final String title = t['title']?.toString() ?? 'Task';
            
            String rawEntityName = 'Individual';
            if (t['entityName'] != null && t['entityName'].toString().isNotEmpty) {
              rawEntityName = t['entityName'].toString();
            } else if (t['companyId'] != null) {
              if (t['companyId'] is Map) {
                rawEntityName = t['companyId']['company_name']?.toString() ?? 'Individual';
              } else {
                rawEntityName = 'Company';
              }
            }
            final String entityName = rawEntityName.trim();
            final int daysLeft = (t['daysLeft'] as num?)?.toInt() ?? 0;
            final String rawStatus = t['status']?.toString() ?? 'Upcoming';
            
            TaskStatus status = TaskStatus.upcoming;
            if (rawStatus == 'Due Soon') status = TaskStatus.dueSoon;
            else if (rawStatus == 'Critical') status = TaskStatus.critical;
            else if (rawStatus == 'Overdue') status = TaskStatus.overdue;
            else if (rawStatus == 'Completed') status = TaskStatus.completed;

            allTasks.add(ComplianceTask(
              id: t['_id'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
              title: title,
              entityName: entityName,
              daysLeft: daysLeft,
              status: status,
            ));
          }
        }
      } catch (e) {
        debugPrint("Error fetching compliance tasks API: $e");
      }

      if (!controller.isClosed) {
        controller.add(allTasks);
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
