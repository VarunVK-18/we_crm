import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../providers/notification_provider.dart';
import '../../core/theme/app_theme.dart';

class NotificationSheet extends ConsumerWidget {
  const NotificationSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationProvider);

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 24),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Recent Updates',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.deepTeal,
                  ),
                ),
                TextButton(
                  onPressed: () {
                    ref.read(notificationProvider.notifier).markAllAsRead();
                  },
                  child: const Text(
                    'Mark all as read',
                    style: TextStyle(
                      color: AppTheme.corporateBlue,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Flexible(
            child: notifications.isEmpty
                ? Padding(
                    padding: const EdgeInsets.all(40),
                    child: Text(
                      'No recent updates',
                      style: TextStyle(color: Colors.grey[400]),
                    ),
                  )
                : ListView.separated(
                    shrinkWrap: true,
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.all(24),
                    itemCount: notifications.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: 16),
                    itemBuilder: (context, index) {
                      final notification = notifications[index];
                      return _NotificationItem(notification: notification);
                    },
                  ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

class _NotificationItem extends StatelessWidget {
  final ServiceNotification notification;

  const _NotificationItem({required this.notification});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: notification.isRead
            ? Colors.white
            : AppTheme.corporateBlue.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: notification.isRead
              ? Colors.grey[100]!
              : AppTheme.corporateBlue.withOpacity(0.1),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: notification.isRead
                  ? Colors.grey[100]
                  : AppTheme.corporateBlue.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: HugeIcon(
              icon: HugeIcons.strokeRoundedNotification03,
              color: notification.isRead ? Colors.grey : AppTheme.corporateBlue,
              size: 18,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      notification.title,
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                        color: notification.isRead
                            ? AppTheme.deepTeal.withOpacity(0.7)
                            : AppTheme.deepTeal,
                      ),
                    ),
                    Text(
                      _formatTime(notification.timestamp),
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey[500],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  notification.message,
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey[600],
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.grey[50],
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: Colors.grey[100]!),
                  ),
                  child: Text(
                    notification.serviceName,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: Colors.grey[500],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}
