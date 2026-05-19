import 'package:flutter/material.dart';

enum ReminderStatus { expiringSoon, urgent, expired }

class ComplianceReminder {
  final String id;
  final String serviceName;
  final String entityName;
  final int daysLeft;
  final ReminderStatus status;

  ComplianceReminder({
    required this.id,
    required this.serviceName,
    required this.entityName,
    required this.daysLeft,
    required this.status,
  });

  String get message {
    return switch (status) {
      ReminderStatus.expiringSoon => 'Ends in $daysLeft days',
      ReminderStatus.urgent => 'Ends in $daysLeft day',
      ReminderStatus.expired => 'Service Expired',
    };
  }

  Color get color {
    return switch (status) {
      ReminderStatus.expiringSoon => const Color(0xFFF59E0B), // Orange
      ReminderStatus.urgent => const Color(0xFFEF4444), // Red
      ReminderStatus.expired => const Color(0xFF7F1D1D), // Dark Red
    };
  }
}

final mockReminders = [
  ComplianceReminder(
    id: 'REM-001',
    serviceName: 'GST Monthly Filing',
    entityName: 'Balaji Enterprises Pvt Ltd',
    daysLeft: 2,
    status: ReminderStatus.expiringSoon,
  ),
  ComplianceReminder(
    id: 'REM-002',
    serviceName: 'MCA Annual Return',
    entityName: 'Balaji Enterprises Pvt Ltd',
    daysLeft: 1,
    status: ReminderStatus.urgent,
  ),
  ComplianceReminder(
    id: 'REM-003',
    serviceName: 'Trademark Protection',
    entityName: 'Balaji Enterprises Pvt Ltd',
    daysLeft: 0,
    status: ReminderStatus.expired,
  ),
  ComplianceReminder(
    id: 'REM-004',
    serviceName: 'Income Tax Audit',
    entityName: 'Tech Solutions LLP',
    daysLeft: 5,
    status: ReminderStatus.expiringSoon,
  ),
  ComplianceReminder(
    id: 'REM-005',
    serviceName: 'LLP Form 8 Filing',
    entityName: 'Tech Solutions LLP',
    daysLeft: 1,
    status: ReminderStatus.urgent,
  ),
  ComplianceReminder(
    id: 'REM-006',
    serviceName: 'Professional Tax',
    entityName: 'Tech Solutions LLP',
    daysLeft: 0,
    status: ReminderStatus.expired,
  ),
];
