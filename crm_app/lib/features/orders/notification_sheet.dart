import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../providers/notification_provider.dart';
import '../../core/theme/app_theme.dart';
import 'order_chat_screen.dart';
import 'service_order_detail_screen.dart';
import '../../providers/orders_provider.dart';

class NotificationSheet extends ConsumerStatefulWidget {
  const NotificationSheet({super.key});

  @override
  ConsumerState<NotificationSheet> createState() => _NotificationSheetState();
}

class _NotificationSheetState extends ConsumerState<NotificationSheet> {
  DateTime? _selectedDate;

  @override
  Widget build(BuildContext context) {
    var notifications = ref.watch(notificationProvider);

    if (_selectedDate != null) {
      notifications = notifications.where((n) {
        return n.timestamp.year == _selectedDate!.year &&
            n.timestamp.month == _selectedDate!.month &&
            n.timestamp.day == _selectedDate!.day;
      }).toList();
    }

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 12),
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(LucideIcons.arrowLeft, color: AppTheme.deepTeal),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      const Text(
                        'Recent Updates',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.deepTeal,
                        ),
                      ),
                      if (_selectedDate != null) ...[
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Showing: ${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}',
                              style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey.shade600,
                                  fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(width: 8),
                            InkWell(
                              onTap: () => setState(() => _selectedDate = null),
                              child: Container(
                                padding: const EdgeInsets.all(2),
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade200,
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(Icons.close,
                                    size: 12, color: Colors.grey.shade700),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () async {
                    if (notifications.isEmpty) {
                      showDialog(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: const Text('Nothing to clear'),
                          content: const Text('There are no recent updates to clear.'),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context),
                              child: const Text('OK'),
                            ),
                          ],
                        ),
                      );
                      return;
                    }
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('Clear Notifications'),
                        content: const Text(
                            'Are you sure you want to clear all notifications?'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context, false),
                            child: Text(
                              'Cancel',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ),
                          TextButton(
                            onPressed: () => Navigator.pop(context, true),
                            child: Text(
                              'OK',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: const Color.fromARGB(255, 6, 6, 6),
                                  ),
                            ),
                          ),
                        ],
                      ),
                    );
                    if (confirm == true) {
                      ref.read(notificationProvider.notifier).clearAll();
                    }
                  },
                  icon: const HugeIcon(
                    icon: HugeIcons.strokeRoundedDelete02,
                    color: Colors.redAccent,
                    size: 20.0,
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
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: notifications.length,
                    separatorBuilder: (context, index) => const Divider(
                        height: 1, thickness: 1, color: Color(0xFFEEEEEE)),
                    itemBuilder: (context, index) {
                      final notification = notifications[index];
                      return Dismissible(
                        key: Key(notification.id),
                        direction: DismissDirection.startToEnd,
                        onDismissed: (direction) {
                          final removedNotif = notification;
                          
                          // Hide locally first
                          ref.read(notificationProvider.notifier).hideLocally(removedNotif.id);

                          ScaffoldMessenger.of(context).clearSnackBars();
                          final snackbarController = ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: const Text('Notification dismissed'),
                              action: SnackBarAction(
                                label: 'UNDO',
                                onPressed: () {
                                  ref.read(notificationProvider.notifier).undoHide(removedNotif);
                                },
                              ),
                              duration: const Duration(seconds: 3),
                            ),
                          );

                          snackbarController.closed.then((reason) {
                            if (reason != SnackBarClosedReason.action) {
                              ref.read(notificationProvider.notifier).clearNotification(removedNotif.id);
                            }
                          });
                        },
                        background: Container(
                          color: Colors.redAccent,
                          alignment: Alignment.centerLeft,
                          padding: const EdgeInsets.only(left: 20),
                          child: const Icon(LucideIcons.trash2,
                              color: Colors.white, size: 24),
                        ),
                        child: _NotificationItem(notification: notification),
                      );
                    },
                  ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

class _NotificationItem extends ConsumerWidget {
  final ServiceNotification notification;

  const _NotificationItem({required this.notification});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Widget iconWidget;
    if (notification.type == 'chat') {
      iconWidget = Icon(
        LucideIcons.messageCircle,
        color: Colors.blue.shade600,
        size: 18,
      );
    } else if (notification.type == 'document_request') {
      iconWidget = HugeIcon(
        icon: HugeIcons.strokeRoundedTaskAdd02,
        color: Colors.teal.shade600,
        size: 18.0,
      );
    } else {
      iconWidget = Icon(
        LucideIcons.bellRing,
        color: Colors.teal.shade600,
        size: 18,
      );
    }

    return InkWell(
      onTap: () {
        if (notification.type == 'chat' && notification.orderId != null) {
          Navigator.pop(context);
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => OrderChatScreen(
                orderId: notification.orderId!,
                serviceName: notification.serviceName,
                assignedExpert: 'Expert',
              ),
            ),
          );
        } else if (notification.type == 'document_request' &&
            notification.orderId != null) {
          final ordersState = ref.read(serviceOrdersProvider);
          final orders = ordersState.value ?? [];
          final targetOrder = orders.where((o) => o.id == notification.orderId).firstOrNull;

          if (targetOrder != null) {
            Navigator.pop(context);
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => ServiceOrderDetailScreen(order: targetOrder),
              ),
            );
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Order details not found.')),
            );
          }
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        color: Colors.white,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: notification.type == 'chat'
                  ? Colors.blue.shade50
                  : Colors.teal.shade50,
              child: iconWidget,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 14,
                            fontWeight: notification.isRead
                                ? FontWeight.w500
                                : FontWeight.w700,
                            color: Colors.black87,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _formatTime(notification.timestamp),
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey.shade500,
                          fontWeight: notification.isRead
                              ? FontWeight.w400
                              : FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    notification.message,
                    style: TextStyle(
                      fontSize: 13,
                      color: notification.isRead
                          ? Colors.grey.shade600
                          : Colors.black87,
                      fontWeight: notification.isRead
                          ? FontWeight.w400
                          : FontWeight.w500,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
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
