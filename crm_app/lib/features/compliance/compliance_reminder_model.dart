import 'package:flutter/material.dart';

enum TaskStatus { upcoming, dueSoon, critical, overdue, completed }

class ComplianceTask {
  final String id;
  final String title;
  final String entityName;
  final int daysLeft;
  final TaskStatus status;

  ComplianceTask({
    required this.id,
    required this.title,
    required this.entityName,
    required this.daysLeft,
    required this.status,
  });

  String get message {
    return switch (status) {
      TaskStatus.upcoming => 'Due in $daysLeft days',
      TaskStatus.dueSoon => 'Due in $daysLeft days',
      TaskStatus.critical => 'Due in $daysLeft days',
      TaskStatus.overdue => 'Overdue - Penalty Applicable',
      TaskStatus.completed => 'Completed',
    };
  }

  Color get color {
    return switch (status) {
      TaskStatus.upcoming => const Color(0xFF3B82F6), // Blue
      TaskStatus.dueSoon => const Color(0xFFF59E0B), // Orange
      TaskStatus.critical => const Color(0xFFEF4444), // Red
      TaskStatus.overdue => const Color(0xFF7F1D1D), // Dark Red
      TaskStatus.completed => const Color(0xFF10B981), // Green
    };
  }
}
