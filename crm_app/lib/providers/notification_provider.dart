import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/constants/port.dart';
import 'auth_provider.dart';

class ServiceNotification {
  final String id;
  final String title;
  final String message;
  final String serviceName;
  final DateTime timestamp;
  final bool isRead;
  final String type;
  final String? orderId;

  ServiceNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.serviceName,
    required this.timestamp,
    this.isRead = false,
    required this.type,
    this.orderId,
  });

  ServiceNotification copyWith({bool? isRead}) {
    return ServiceNotification(
      id: id,
      title: title,
      message: message,
      serviceName: serviceName,
      timestamp: timestamp,
      isRead: isRead ?? this.isRead,
      type: type,
      orderId: orderId,
    );
  }
}

class NotificationNotifier extends StateNotifier<List<ServiceNotification>> {
  final Ref ref;

  NotificationNotifier(this.ref) : super([]) {
    fetchNotifications();
  }

  Future<void> fetchNotifications() async {
    final uid = ref.read(authStateProvider).value?.uid;
    if (uid == null) return;

    try {
      final res = await http.get(
        Uri.parse('$kBaseUrl/api/notifications'),
        headers: {'x-user-id': uid},
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final List notifs = data['notifications'] ?? [];
        state = notifs.map((n) {
          final order = n['order_id'] ?? {};
          return ServiceNotification(
            id: n['_id'],
            title: n['title'] ?? 'Notification',
            message: n['message'] ?? '',
            serviceName: order['service_name'] ?? 'General',
            timestamp: DateTime.parse(n['createdAt']),
            isRead: n['isRead'] ?? false,
            type: n['type'] ?? 'info',
            orderId: order['_id'],
          );
        }).toList();
      }
    } catch (e) {
      // ignore
    }
  }

  Future<void> markAllAsRead() async {
    final uid = ref.read(authStateProvider).value?.uid;
    if (uid == null) return;

    state = [
      for (final n in state)
        if (!n.isRead) n.copyWith(isRead: true) else n
    ];

    try {
      await http.put(
        Uri.parse('$kBaseUrl/api/notifications/read'),
        headers: {'x-user-id': uid},
      );
    } catch (e) {
      // ignore
    }
  }

  void addNewNotification(ServiceNotification notification) {
    state = [notification, ...state];
  }
}

final notificationProvider = StateNotifierProvider<NotificationNotifier, List<ServiceNotification>>((ref) {
  return NotificationNotifier(ref);
});

final unreadNotificationCountProvider = Provider<int>((ref) {
  final notifications = ref.watch(notificationProvider);
  return notifications.where((n) => !n.isRead).length;
});
