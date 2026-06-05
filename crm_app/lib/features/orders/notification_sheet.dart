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
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Recent Updates',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.deepTeal,
                        ),
                      ),
                      if (_selectedDate != null) ...[
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Text(
                              'Showing: ${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}',
                              style: TextStyle(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.bold),
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
                                child: Icon(Icons.close, size: 12, color: Colors.grey.shade700),
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
                    final date = await showDatePicker(
                      context: context,
                      initialDate: _selectedDate ?? DateTime.now(),
                      firstDate: DateTime(2020),
                      lastDate: DateTime(2100),
                      builder: (context, child) {
                        return Theme(
                          data: Theme.of(context).copyWith(
                            colorScheme: const ColorScheme.light(
                              primary: AppTheme.corporateBlue,
                              onPrimary: Colors.white,
                              onSurface: AppTheme.deepTeal,
                            ),
                          ),
                          child: child!,
                        );
                      },
                    );
                    if (date != null) {
                      setState(() {
                        _selectedDate = date;
                      });
                    }
                  },
                  icon: const Icon(LucideIcons.calendar, color: AppTheme.corporateBlue),
                ),
                TextButton(
                  onPressed: () {
                    ref.read(notificationProvider.notifier).clearAll();
                  },
                  child: const Text(
                    'Clear all',
                    style: TextStyle(
                      color: Colors.redAccent,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
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
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: notifications.length,
                    separatorBuilder: (context, index) =>
                        const Divider(height: 1, thickness: 1, color: Color(0xFFEEEEEE)),
                    itemBuilder: (context, index) {
                      final notification = notifications[index];
                      return Dismissible(
                        key: Key(notification.id),
                        direction: DismissDirection.startToEnd,
                        onDismissed: (direction) {
                          ref.read(notificationProvider.notifier).clearNotification(notification.id);
                        },
                        background: Container(
                          color: Colors.redAccent,
                          alignment: Alignment.centerLeft,
                          padding: const EdgeInsets.only(left: 20),
                          child: const Icon(LucideIcons.trash2, color: Colors.white, size: 24),
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
        } else if (notification.type == 'document_request' && notification.orderId != null) {
          _uploadDocument(context, ref, notification.orderId!);
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
              child: Icon(
                notification.type == 'chat' ? LucideIcons.messageCircle : LucideIcons.bellRing,
                color: notification.type == 'chat' ? Colors.blue.shade600 : Colors.teal.shade600,
                size: 18,
              ),
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
                            fontWeight: notification.isRead ? FontWeight.w500 : FontWeight.w700,
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
                          fontWeight: notification.isRead ? FontWeight.w400 : FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                     notification.message,
                     style: TextStyle(
                       fontSize: 13,
                       color: notification.isRead ? Colors.grey.shade600 : Colors.black87,
                       fontWeight: notification.isRead ? FontWeight.w400 : FontWeight.w500,
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
