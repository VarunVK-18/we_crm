import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../providers/notification_provider.dart';
import '../../core/theme/app_theme.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import '../../core/constants/port.dart';
import 'order_chat_screen.dart';
import '../../providers/auth_provider.dart';
import '../../providers/orders_provider.dart';

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

class _NotificationItem extends ConsumerWidget {
  final ServiceNotification notification;

  const _NotificationItem({required this.notification});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: notification.isRead
            ? Colors.white
            : AppTheme.corporateBlue.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: notification.isRead
              ? Colors.grey[200]!
              : AppTheme.corporateBlue.withOpacity(0.2),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
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
                      style: GoogleFonts.inter(
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
                  Row(
                    children: [
                      Flexible(
                        child: Container(
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
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: Colors.grey[800],
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ),
                      const Spacer(),
                      if (notification.type == 'chat' && notification.orderId != null)
                        TextButton.icon(
                          onPressed: () {
                            Navigator.pop(context); // close sheet
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
                          },
                          icon: const Icon(LucideIcons.reply, size: 14),
                          label: const Text('Reply', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          style: TextButton.styleFrom(
                            foregroundColor: AppTheme.corporateBlue,
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                        ),
                      if (notification.type == 'document_request' && notification.orderId != null)
                        ElevatedButton.icon(
                          onPressed: () => _uploadDocument(context, ref, notification.orderId!),
                          icon: const Icon(LucideIcons.upload, size: 12),
                          label: const Text('Upload', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.orange,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                        ),
                    ],
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _uploadDocument(BuildContext context, WidgetRef ref, String orderId) async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
      );

      if (result != null && result.files.single.path != null) {
        final filePath = result.files.single.path!;
        final uri = Uri.parse('$kBaseUrl/api/checklists/$orderId/upload-documents');
        final request = http.MultipartRequest('POST', uri);
        
        // We might not know the exact document name, so we use a generic name or ask user
        // For simplicity, we just use the filename here, though backend might expect specific keys.
        // If it expects specific keys, we might need a generic upload endpoint or parse it.
        request.files.add(await http.MultipartFile.fromPath('document', filePath));

        final uid = ref.read(authStateProvider).value?.uid;
        if (uid != null) {
          request.headers['x-user-id'] = uid;
        }

        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Uploading...')));

        final response = await request.send();
        
        if (!context.mounted) return;
        if (response.statusCode == 200 || response.statusCode == 201) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Document uploaded successfully')),
          );
          ref.invalidate(serviceOrdersProvider);
          Navigator.pop(context); // close sheet
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Upload failed. Try again.')),
          );
        }
      }
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}
