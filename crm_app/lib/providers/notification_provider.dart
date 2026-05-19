import 'package:flutter_riverpod/flutter_riverpod.dart';

class ServiceNotification {
  final String id;
  final String title;
  final String message;
  final String serviceName;
  final DateTime timestamp;
  final bool isRead;

  ServiceNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.serviceName,
    required this.timestamp,
    this.isRead = false,
  });

  ServiceNotification copyWith({bool? isRead}) {
    return ServiceNotification(
      id: id,
      title: title,
      message: message,
      serviceName: serviceName,
      timestamp: timestamp,
      isRead: isRead ?? this.isRead,
    );
  }
}

class NotificationNotifier extends StateNotifier<List<ServiceNotification>> {
  NotificationNotifier() : super([]) {
    // Initialize with mock data for demonstration
    state = [
      ServiceNotification(
        id: '1',
        title: 'Documents Verified',
        message: 'Your documents for GST Registration have been verified successfully.',
        serviceName: 'GST Registration',
        timestamp: DateTime.now().subtract(const Duration(hours: 2)),
      ),
      ServiceNotification(
        id: '2',
        title: 'Name Approved',
        message: 'MCA has approved the name "Balaji Enterprises Pvt Ltd".',
        serviceName: 'Private Limited Incorporation',
        timestamp: DateTime.now().subtract(const Duration(days: 1)),
        isRead: true,
      ),
      ServiceNotification(
        id: '3',
        title: 'Expert Assigned',
        message: 'Rohan Mehra has been assigned as your expert for TDS Filing.',
        serviceName: 'TDS Filing (Q4 2025-26)',
        timestamp: DateTime.now().subtract(const Duration(days: 2)),
        isRead: true,
      ),
    ];
  }

  void markAllAsRead() {
    state = [
      for (final n in state)
        if (!n.isRead) n.copyWith(isRead: true) else n
    ];
  }

  void addNewNotification(ServiceNotification notification) {
    state = [notification, ...state];
  }
}

final notificationProvider = StateNotifierProvider<NotificationNotifier, List<ServiceNotification>>((ref) {
  return NotificationNotifier();
});

final unreadNotificationCountProvider = Provider<int>((ref) {
  final notifications = ref.watch(notificationProvider);
  return notifications.where((n) => !n.isRead).length;
});
