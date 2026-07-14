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

Future<bool> uploadClientReplyDocument({
  required String taskId,
  required String documentType,
  required String filePath,
  required String fileName,
  required String uid,
}) async {
  try {
    final uri = Uri.parse('$kBaseUrl/api/compliance/tasks/$taskId/upload');
    final request = http.MultipartRequest('POST', uri);
    request.headers['x-user-id'] = uid;
    request.fields['documentType'] = documentType;

    final file = await http.MultipartFile.fromPath(
      'file',
      filePath,
      filename: fileName,
    );
    request.files.add(file);

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200 || response.statusCode == 201) {
      return true;
    } else {
      debugPrint("Upload failed: ${response.statusCode} - ${response.body}");
      return false;
    }
  } catch (e) {
    debugPrint("Error uploading document: $e");
    return false;
  }
}

class CertificateModel {
  final String id;
  final String serviceName;
  final String certificateNumber;
  final String expiryDate;
  final int daysRemaining;
  final String renewalStatus;
  final bool renewalRequired;
  final String entityName;

  CertificateModel({
    required this.id,
    required this.serviceName,
    required this.certificateNumber,
    required this.expiryDate,
    required this.daysRemaining,
    required this.renewalStatus,
    required this.renewalRequired,
    required this.entityName,
  });

  factory CertificateModel.fromJson(Map<String, dynamic> json) {
    return CertificateModel(
      id: json['_id'] ?? '',
      serviceName: json['serviceName'] ?? '',
      certificateNumber: json['certificateNumber'] ?? '',
      expiryDate: json['expiryDate'] ?? '',
      daysRemaining: (json['daysRemaining'] as num?)?.toInt() ?? 0,
      renewalStatus: json['renewalStatus'] ?? 'Active',
      renewalRequired: json['renewalRequired'] ?? true,
      entityName: json['entityName'] ?? '',
    );
  }
}

final certificatesProvider = StreamProvider<List<CertificateModel>>((ref) {
  final uid = ref.watch(authStateProvider).value?.uid;
  if (uid == null) return Stream.value([]);

  final controller = StreamController<List<CertificateModel>>();

  Future<void> fetchCertificates() async {
    try {
      final response = await http.get(
        Uri.parse('$kBaseUrl/api/certificates/client/$uid'),
        headers: {'x-user-id': uid},
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        final List<dynamic> certsJson = data['certificates'] ?? [];
        final certs = certsJson.map((json) => CertificateModel.fromJson(json)).toList();
        if (!controller.isClosed) controller.add(certs);
      }
    } catch (e) {
      debugPrint("Error fetching certificates API: $e");
    }
  }

  fetchCertificates();
  final timer = Timer.periodic(const Duration(seconds: 4), (_) => fetchCertificates());

  ref.onDispose(() {
    timer.cancel();
    controller.close();
  });

  return controller.stream;
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
            
            String rawEntityName = '';

            // Priority 1: explicit entityName field on the task
            if (t['entityName'] != null &&
                t['entityName'].toString().trim().isNotEmpty) {
              rawEntityName = t['entityName'].toString().trim();
            }

            // Priority 2: populated companyId.company_name
            if (rawEntityName.isEmpty &&
                t['companyId'] != null &&
                t['companyId'] is Map) {
              rawEntityName =
                  t['companyId']['company_name']?.toString().trim() ?? '';
            }

            // Priority 3: populated checklistId.details.entityName / companyName
            if (rawEntityName.isEmpty &&
                t['checklistId'] != null &&
                t['checklistId'] is Map) {
              final details = t['checklistId']['details'];
              if (details is Map) {
                rawEntityName = (details['entityName'] ??
                        details['companyName'] ??
                        details['proposed_company_name'] ??
                        details['businessName'] ??
                        '')
                    .toString()
                    .trim();
              }
            }

            // Priority 4: fall back to 'Individual' only if nothing matched
            final String entityName =
                rawEntityName.isNotEmpty ? rawEntityName : 'Individual';

            final int daysLeft = (t['daysLeft'] as num?)?.toInt() ?? 0;
            final String rawStatus = t['status']?.toString() ?? 'Upcoming';
            
            TaskStatus status = TaskStatus.upcoming;
            final lowerStatus = rawStatus.toLowerCase();
            if (lowerStatus == 'due soon') status = TaskStatus.dueSoon;
            else if (lowerStatus == 'critical') status = TaskStatus.critical;
            else if (lowerStatus == 'overdue') status = TaskStatus.overdue;
            else if (lowerStatus == 'completed') status = TaskStatus.completed;

            final List<ComplianceDocument> docs = [];
            
            void addDoc(dynamic docObj, String typeStr) {
              if (docObj != null && docObj['_id'] != null) {
                docs.add(ComplianceDocument(
                  id: docObj['_id'].toString(),
                  filename: docObj['filename']?.toString() ?? 'Document',
                  type: typeStr,
                ));
              }
            }

            addDoc(t['proofDocument'], 'Proof');
            addDoc(t['certificateDocument'], 'Certificate');
            addDoc(t['acknowledgementDocument'], 'Acknowledgement');

            String? extractDocStr(String key) {
              final val = t[key];
              if (val == null) return null;
              if (val is String) return val;
              if (val is Map && val['_id'] != null) return val['_id'].toString();
              return null;
            }

            allTasks.add(ComplianceTask(
              id: t['_id'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
              title: title,
              entityName: entityName,
              daysLeft: daysLeft,
              status: status,
              documents: docs,
              noticeDocument: extractDocStr('noticeDocument'),
              noticeReplyDocument: extractDocStr('noticeReplyDocument'),
              shareholdersDocument: extractDocStr('shareholdersDocument'),
              shareholdersReplyDocument: extractDocStr('shareholdersReplyDocument'),
              directorsDocument: extractDocStr('directorsDocument'),
              directorsReplyDocument: extractDocStr('directorsReplyDocument'),
              notesDocument: extractDocStr('notesDocument'),
              notesReplyDocument: extractDocStr('notesReplyDocument'),
              temporaryDocument: extractDocStr('temporaryDocument'),
              temporaryReplyDocument: extractDocStr('temporaryReplyDocument'),
              normalDocument: extractDocStr('normalDocument'),
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
