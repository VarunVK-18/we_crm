import 'package:google_fonts/google_fonts.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/theme/app_theme.dart';
import '../profile/name_check_screen.dart';
import '../profile/my_entities_screen.dart';
import 'compliance_reminder_model.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/compliance_provider.dart';
import '../services/service_request_summary_sheet.dart';
import '../../core/utils/responsive.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/port.dart';
import '../../core/widgets/we_loader.dart';
import '../../providers/auth_provider.dart';
import 'package:http/http.dart' as http;
import 'package:file_picker/file_picker.dart';
import '../orders/order_chat_screen.dart';

class ComplianceRadarScreen extends ConsumerWidget {
  const ComplianceRadarScreen({super.key});

  void _showNotificationPanel(BuildContext context, WidgetRef ref) {
    final selectedEntity = ref.read(selectedEntityProvider);
    final reminders = ref.read(complianceRemindersProvider).value ?? [];
    final filteredReminders = reminders
        .where((r) =>
            (selectedEntity == 'All Entities' ||
                r.entityName == selectedEntity) &&
            r.daysLeft <= 3)
        .toList()
      ..sort((a, b) {
        if (a.status == TaskStatus.completed && b.status != TaskStatus.completed) return 1;
        if (a.status != TaskStatus.completed && b.status == TaskStatus.completed) return -1;
        return a.daysLeft.compareTo(b.daysLeft);
      });

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(36)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.fromLTRB(28, 12, 28, 40),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(36)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 20,
              offset: const Offset(0, -10),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Service Alerts',
                      style: GoogleFonts.outfit(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.deepTeal,
                        letterSpacing: -0.5,
                      ),
                    ),
                    Text(
                      'Action required for your entities',
                      style: GoogleFonts.outfit(
                        fontSize: 13,
                        color: Colors.grey[500],
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      LucideIcons.x,
                      color: Colors.grey,
                      size: 16,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
            Flexible(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    ...filteredReminders.map(
                      (reminder) => _ReminderItem(reminder: reminder),
                    ),
                    if (filteredReminders.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 40),
                        child: Center(
                          child: Text(
                            'No active alerts for this entity.',
                            style: GoogleFonts.outfit(
                              color: Colors.grey[400],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showPendingCompliancesPanel(BuildContext context, WidgetRef ref) {
    final selectedEntity = ref.read(selectedEntityProvider);
    final reminders = ref.read(complianceRemindersProvider).value ?? [];
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(36)),
      ),
      builder: (context) {
        String filterType = 'pending';
        return StatefulBuilder(
          builder: (context, setState) {
            final filteredReminders = reminders
                .where((r) =>
                    (selectedEntity == 'All Entities' ||
                        r.entityName == selectedEntity) &&
                    (filterType == 'all' ||
                        (filterType == 'pending' &&
                            r.status != TaskStatus.completed) ||
                        (filterType == 'completed' &&
                            r.status == TaskStatus.completed)))
                .toList()
              ..sort((a, b) {
                if (a.status == TaskStatus.completed && b.status != TaskStatus.completed) return 1;
                if (a.status != TaskStatus.completed && b.status == TaskStatus.completed) return -1;
                return a.daysLeft.compareTo(b.daysLeft);
              });

            return Container(
              padding: const EdgeInsets.fromLTRB(28, 12, 28, 40),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(36)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 20,
                    offset: const Offset(0, -10),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 24),
                      decoration: BoxDecoration(
                        color: Colors.grey[200],
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Compliances',
                            style: GoogleFonts.outfit(
                              fontSize: 24,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.deepTeal,
                              letterSpacing: -0.5,
                            ),
                          ),
                          Text(
                            'Upcoming filings & actions required',
                            style: GoogleFonts.outfit(
                              fontSize: 13,
                              color: Colors.grey[500],
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          Container(
                            margin: const EdgeInsets.only(right: 8),
                            decoration: BoxDecoration(
                              color: Colors.grey[100],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: PopupMenuButton<String>(
                              color: Colors.white,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                                side: BorderSide(color: Colors.grey.withOpacity(0.2)),
                              ),
                              offset: const Offset(0, 40),
                              child: const Padding(
                                padding: EdgeInsets.all(6),
                                child: Icon(LucideIcons.listFilter,
                                    color: Colors.grey, size: 16),
                              ),
                              tooltip: 'Filter Tasks',
                              onSelected: (value) {
                                setState(() => filterType = value);
                              },
                              itemBuilder: (context) => [
                                PopupMenuItem(
                                    value: 'pending',
                                    child: Text('Pending',
                                        style: GoogleFonts.outfit(
                                            fontSize: 14,
                                            color: AppTheme.deepTeal,
                                            fontWeight: FontWeight.w500))),
                                PopupMenuItem(
                                    value: 'completed',
                                    child: Text('Completed',
                                        style: GoogleFonts.outfit(
                                            fontSize: 14,
                                            color: AppTheme.deepTeal,
                                            fontWeight: FontWeight.w500))),
                                PopupMenuItem(
                                    value: 'all',
                                    child: Text('All',
                                        style: GoogleFonts.outfit(
                                            fontSize: 14,
                                            color: AppTheme.deepTeal,
                                            fontWeight: FontWeight.w500))),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () => Navigator.pop(context),
                            icon: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: Colors.grey[100],
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                LucideIcons.x,
                                color: Colors.grey,
                                size: 16,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  Flexible(
                    child: SingleChildScrollView(
                      child: Column(
                        children: [
                          ...(() {
                            if (filteredReminders.isEmpty) {
                              return [
                                Padding(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 40),
                                  child: Center(
                                    child: Text(
                                      'No compliances found for this filter.',
                                      style: GoogleFonts.outfit(
                                        color: Colors.grey[400],
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                )
                              ];
                            }

                            final grouped = <String, List<dynamic>>{};
                            for (final r in filteredReminders) {
                              final key = selectedEntity == 'All Entities'
                                  ? (r.entityName.isNotEmpty
                                      ? r.entityName
                                      : 'Other')
                                  : r.status
                                      .toString()
                                      .split('.')
                                      .last
                                      .toUpperCase();
                              grouped.putIfAbsent(key, () => []).add(r);
                            }

                            return grouped.entries.map((entry) {
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Padding(
                                      padding: const EdgeInsets.only(
                                          left: 4, bottom: 12),
                                      child: Row(
                                        children: [
                                          Container(
                                            width: 4,
                                            height: 16,
                                            decoration: BoxDecoration(
                                              color: AppTheme.activeOrange,
                                              borderRadius:
                                                  BorderRadius.circular(2),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            entry.key,
                                            style: GoogleFonts.outfit(
                                              fontSize: 16,
                                              fontWeight: FontWeight.w600,
                                              color: AppTheme.deepTeal,
                                              letterSpacing: -0.3,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    ...entry.value.map((reminder) =>
                                        _ReminderItem(reminder: reminder)),
                                  ],
                                ),
                              );
                            }).toList();
                          })(),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Responsive.init(context);
    final currentEntity = ref.watch(selectedEntityProvider);

    final remindersAsync = ref.watch(complianceRemindersProvider);
    final reminders = remindersAsync.value ?? [];
    final isLoading = remindersAsync.isLoading && reminders.isEmpty;

    // Removed auto-correct to allow selecting entities with zero reminders

    final pendingReminders = reminders
        .where((r) =>
            (currentEntity == 'All Entities' ||
                r.entityName == currentEntity) &&
            r.status != TaskStatus.completed)
        .toList();
    final pendingCountStr = pendingReminders.length.toString().padLeft(2, '0');

    // Calculate Health Score dynamically based on active tasks
    double minScore = 0.9;
    if (pendingReminders.isEmpty) {
      minScore = 1.0;
    } else {
      for (final r in pendingReminders) {
        if (r.status == TaskStatus.overdue)
          minScore = minScore > 0.25 ? 0.25 : minScore;
        else if (r.status == TaskStatus.critical)
          minScore = minScore > 0.5 ? 0.5 : minScore;
        else if (r.status == TaskStatus.dueSoon)
          minScore = minScore > 0.75 ? 0.75 : minScore;
      }
    }

    final score = minScore;
    final healthStatus = score >= 0.9
        ? 'EXCELLENT'
        : score >= 0.75
            ? 'GOOD'
            : score >= 0.5
                ? 'WARNING'
                : 'CRITICAL';
    final healthMessage = score >= 0.9
        ? 'Your entity compliance health is safe.'
        : score >= 0.75
            ? 'Some items are due soon.'
            : score >= 0.5
                ? 'Critical action required soon.'
                : 'Action required: resolve overdue items.';

    // Find the most urgent deadline dynamically
    final urgentReminder = pendingReminders.isEmpty
        ? null
        : pendingReminders.reduce((a, b) => a.daysLeft < b.daysLeft ? a : b);

    final certsAsync = ref.watch(certificatesProvider);
    final certs = certsAsync.value ?? [];
    final filteredCerts = certs.where((c) => currentEntity == 'All Entities' || c.entityName == currentEntity).toList();
    final warningCerts = filteredCerts.where((c) => ['Due Soon', 'Action Required', 'Critical', 'Expired'].contains(c.renewalStatus)).toList();

    // Map upcoming items dynamically to the timeline card
    final List<Map<String, String>> timelineItems = pendingReminders
        .map((r) => <String, String>{
              'title': currentEntity == 'All Entities'
                  ? '${r.title} (${r.entityName})'
                  : r.title,
              'status': r.message,
              'type': (r.status == TaskStatus.critical ||
                      r.status == TaskStatus.overdue)
                  ? 'Urgent'
                  : 'Upcoming',
            })
        .toList();

    return AnnotatedRegion<SystemUiOverlayStyle>(
        value: SystemUiOverlayStyle.dark.copyWith(
          statusBarColor: Colors.transparent,
        ),
        child: Scaffold(
          backgroundColor: AppTheme.backgroundLight,
          floatingActionButton: FloatingActionButton(
            onPressed: () {
              final user = ref.read(authStateProvider).value;
              if (user != null) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => OrderChatScreen(
                      orderId: 'compliance_${user.uid}',
                      serviceName: 'Compliance Services',
                      assignedExpert: 'Support',
                    ),
                  ),
                );
              }
            },
            backgroundColor: AppTheme.deepTeal,
            elevation: 4,
            child: const Icon(LucideIcons.messageCircle, color: Colors.white),
          ),
          body: SafeArea(
            child: isLoading
                ? const Center(
                    child: WeLoader(size: 24),
                  )
                : RefreshIndicator(
                    color: AppTheme.deepTeal,
                    onRefresh: () async {
                      ref.invalidate(complianceRemindersProvider);
                      try {
                        await ref.read(complianceRemindersProvider.future);
                      } catch (_) {}
                    },
                    child: SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: EdgeInsets.symmetric(horizontal: 24.r),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SizedBox(height: 24.r),
                          // --- Header Section ---
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'COMPLIANCE CENTER',
                                      style: GoogleFonts.outfit(
                                        color:
                                            AppTheme.deepTeal.withOpacity(0.4),
                                        fontSize: 10.sp,
                                        fontWeight: FontWeight.w600,
                                        letterSpacing: 2,
                                      ),
                                    ),
                                    SizedBox(height: 4.r),
                                    Row(
                                      children: [
                                        Flexible(
                                          child: Text(
                                            currentEntity,
                                            style: GoogleFonts.outfit(
                                              color: AppTheme.deepTeal,
                                              fontSize: 18.sp,
                                              fontWeight: FontWeight.w600,
                                              letterSpacing: -0.5,
                                            ),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        SizedBox(width: 12.r),
                                        GestureDetector(
                                          onTap: () => Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (_) =>
                                                  const MyEntitiesScreen(),
                                            ),
                                          ),
                                          child: Container(
                                            padding: EdgeInsets.symmetric(
                                              horizontal: 10.r,
                                              vertical: 6.r,
                                            ),
                                            decoration: BoxDecoration(
                                              color: AppTheme.deepTeal
                                                  .withOpacity(0.05),
                                              borderRadius:
                                                  BorderRadius.circular(12.r),
                                              border: Border.all(
                                                color: AppTheme.deepTeal
                                                    .withOpacity(0.1),
                                              ),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(
                                                  LucideIcons.arrowLeftRight,
                                                  size: 12.ip,
                                                  color: AppTheme.deepTeal,
                                                ),
                                                SizedBox(width: 6.r),
                                                Text(
                                                  'SWITCH',
                                                  style: GoogleFonts.outfit(
                                                    fontSize: 10.sp,
                                                    fontWeight: FontWeight.w600,
                                                    color: AppTheme.deepTeal,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              SizedBox(width: 16.r),
                              Stack(
                                children: [
                                  Container(
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(14.r),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withOpacity(0.03),
                                          blurRadius: 10,
                                          offset: const Offset(0, 4),
                                        ),
                                      ],
                                    ),
                                    child: IconButton(
                                      onPressed: () =>
                                          _showNotificationPanel(context, ref),
                                      icon: HugeIcon(
                                        icon: HugeIcons
                                            .strokeRoundedNotification01,
                                        color: AppTheme.deepTeal,
                                        size: 20.ip,
                                      ),
                                    ),
                                  ),
                                  if (reminders
                                      .where((r) =>
                                          (currentEntity == 'All Entities' ||
                                              r.entityName == currentEntity) &&
                                          (r.status == TaskStatus.critical ||
                                              r.status == TaskStatus.overdue))
                                      .isNotEmpty)
                                    Positioned(
                                      right: 12,
                                      top: 12,
                                      child: Container(
                                        width: 8,
                                        height: 8,
                                        decoration: const BoxDecoration(
                                          color: Colors.red,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ],
                          ),
                          SizedBox(height: 32.r),
                          if (warningCerts.isNotEmpty) ...[
                            Container(
                              padding: EdgeInsets.all(16.r),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFEF2F2),
                                border: Border.all(color: const Color(0xFFFECACA)),
                                borderRadius: BorderRadius.circular(12.r),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(LucideIcons.alertCircle, color: const Color(0xFFDC2626), size: 24.r),
                                  SizedBox(width: 16.r),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('Attention Required', style: GoogleFonts.outfit(fontSize: 16.sp, fontWeight: FontWeight.w700, color: const Color(0xFF991B1B))),
                                        SizedBox(height: 4.r),
                                        Text('${warningCerts.length} certificates require renewal action.', style: GoogleFonts.outfit(fontSize: 14.sp, fontWeight: FontWeight.w500, color: const Color(0xFFB91C1C))),
                                        SizedBox(height: 8.r),
                                        ...warningCerts.map((c) => Padding(
                                          padding: EdgeInsets.only(bottom: 4.r),
                                          child: Text('• ${c.serviceName} expires in ${c.daysRemaining} days.', style: GoogleFonts.outfit(fontSize: 13.sp, color: const Color(0xFFB91C1C))),
                                        )),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            SizedBox(height: 16.r),
                          ],

                          // --- Signatures Required Section ---
                          Builder(
                            builder: (context) {
                              final List<Map<String, dynamic>> signatureDocs = [];
                              final docTypes = [
                                {'key': 'notice', 'label': 'Notice'},
                                {'key': 'shareholders', 'label': 'List Of Share Holders'},
                                {'key': 'directors', 'label': 'List Of Directors'},
                                {'key': 'notes', 'label': 'Notes To Account'},
                                {'key': 'temporary', 'label': 'Temporary Document'},
                                {'key': 'normal', 'label': 'Normal Document'},
                              ];

                              for (final task in pendingReminders) {
                                for (final dt in docTypes) {
                                  final docId = task.noticeDocument; // placeholder, need a better way to access dynamically or manually
                                  // Actually let's manually check each
                                  String? doc;
                                  String? replyDoc;
                                  if (dt['key'] == 'notice') { doc = task.noticeDocument; replyDoc = task.noticeReplyDocument; }
                                  if (dt['key'] == 'shareholders') { doc = task.shareholdersDocument; replyDoc = task.shareholdersReplyDocument; }
                                  if (dt['key'] == 'directors') { doc = task.directorsDocument; replyDoc = task.directorsReplyDocument; }
                                  if (dt['key'] == 'notes') { doc = task.notesDocument; replyDoc = task.notesReplyDocument; }
                                  if (dt['key'] == 'temporary') { doc = task.temporaryDocument; replyDoc = task.temporaryReplyDocument; }
                                  if (dt['key'] == 'normal') { doc = task.normalDocument; replyDoc = null; /* normal documents don't have reply documents usually, but let's just skip it if we only want signatures */ }

                                  // Only show if the document exists AND the client hasn't uploaded a reply yet
                                  // Actually wait, 'normal' documents are just for downloading. The web app didn't include them in the "Signatures Required" section.
                                  // Let's omit normal from the signature required section.
                                  
                                  if (doc != null && replyDoc == null && dt['key'] != 'normal') {
                                    signatureDocs.add({
                                      'task': task,
                                      'docKey': dt['key'],
                                      'docLabel': dt['label'],
                                      'fileId': doc,
                                    });
                                  }
                                }
                              }

                              if (signatureDocs.isEmpty) return const SizedBox.shrink();

                              return Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: EdgeInsets.all(24.r),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      border: Border.all(color: const Color(0xFFE2E8F0)),
                                      borderRadius: BorderRadius.circular(12.r),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withOpacity(0.05),
                                          blurRadius: 6,
                                          offset: const Offset(0, 4),
                                        ),
                                      ],
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Container(
                                              padding: EdgeInsets.all(8.r),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFF3E8FF),
                                                borderRadius: BorderRadius.circular(8.r),
                                              ),
                                              child: Icon(LucideIcons.penTool, color: const Color(0xFFC16BFF), size: 20.r),
                                            ),
                                            SizedBox(width: 12.r),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text('Signatures Required', style: GoogleFonts.outfit(fontSize: 18.sp, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A))),
                                                  Text('Please download, sign, and upload the following documents.', style: GoogleFonts.outfit(fontSize: 14.sp, color: const Color(0xFF64748B))),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                        SizedBox(height: 16.r),
                                        GridView.builder(
                                          shrinkWrap: true,
                                          physics: const NeverScrollableScrollPhysics(),
                                          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                            crossAxisCount: Responsive.isMobile(context) ? 1 : 2,
                                            crossAxisSpacing: 16.r,
                                            mainAxisSpacing: 16.r,
                                            mainAxisExtent: 140.r,
                                          ),
                                          itemCount: signatureDocs.length,
                                          itemBuilder: (context, index) {
                                            final doc = signatureDocs[index];
                                            final task = doc['task'] as ComplianceTask;
                                            return Container(
                                              padding: EdgeInsets.all(16.r),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFF8FAFC),
                                                border: Border.all(color: const Color(0xFFCBD5E1)),
                                                borderRadius: BorderRadius.circular(8.r),
                                              ),
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                children: [
                                                  Column(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      Text(
                                                        doc['docLabel'].toString().toUpperCase(),
                                                        style: GoogleFonts.outfit(fontSize: 11.sp, fontWeight: FontWeight.w800, color: const Color(0xFF475569), letterSpacing: 0.5),
                                                      ),
                                                      SizedBox(height: 4.r),
                                                      Text(
                                                        task.title,
                                                        style: GoogleFonts.outfit(fontSize: 15.sp, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A)),
                                                        maxLines: 1,
                                                        overflow: TextOverflow.ellipsis,
                                                      ),
                                                      SizedBox(height: 2.r),
                                                      Text(
                                                        task.entityName,
                                                        style: GoogleFonts.outfit(fontSize: 12.sp, color: const Color(0xFF64748B)),
                                                        maxLines: 1,
                                                        overflow: TextOverflow.ellipsis,
                                                      ),
                                                    ],
                                                  ),
                                                  Row(
                                                    children: [
                                                      Expanded(
                                                        child: OutlinedButton.icon(
                                                          icon: Icon(LucideIcons.download, size: 16.r, color: const Color(0xFF3B82F6)),
                                                          label: Text('Download', style: GoogleFonts.outfit(fontSize: 13.sp, fontWeight: FontWeight.w600, color: const Color(0xFF3B82F6))),
                                                          style: OutlinedButton.styleFrom(
                                                            padding: EdgeInsets.symmetric(vertical: 8.r),
                                                            backgroundColor: Colors.white,
                                                            side: const BorderSide(color: Color(0xFFCBD5E1)),
                                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6.r)),
                                                          ),
                                                          onPressed: () async {
                                                            final url = Uri.parse('$kBaseUrl/api/files/${doc['fileId']}');
                                                            if (await canLaunchUrl(url)) {
                                                              await launchUrl(url, mode: LaunchMode.externalApplication);
                                                            }
                                                          },
                                                        ),
                                                      ),
                                                      SizedBox(width: 12.r),
                                                      Expanded(
                                                        child: ElevatedButton.icon(
                                                          icon: Icon(LucideIcons.uploadCloud, size: 16.r, color: Colors.white),
                                                          label: Text('Upload Signed', style: GoogleFonts.outfit(fontSize: 13.sp, fontWeight: FontWeight.w600, color: Colors.white)),
                                                          style: ElevatedButton.styleFrom(
                                                            padding: EdgeInsets.symmetric(vertical: 8.r),
                                                            backgroundColor: const Color(0xFFF97316),
                                                            elevation: 0,
                                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6.r)),
                                                          ),
                                                          onPressed: () async {
                                                            final result = await FilePicker.platform.pickFiles(
                                                              type: FileType.custom,
                                                              allowedExtensions: ['pdf', 'png', 'jpg', 'jpeg'],
                                                            );
                                                            
                                                            if (result != null && result.files.single.path != null) {
                                                              // Show loading snackbar
                                                              ScaffoldMessenger.of(context).showSnackBar(
                                                                SnackBar(content: Text('Uploading ${doc['docLabel']}...'), duration: const Duration(seconds: 2)),
                                                              );
                                                              
                                                              final uid = ref.read(authStateProvider).value?.uid ?? '';
                                                              final success = await uploadClientReplyDocument(
                                                                taskId: task.id,
                                                                documentType: '${doc['docKey']}Reply',
                                                                filePath: result.files.single.path!,
                                                                fileName: result.files.single.name,
                                                                uid: uid,
                                                              );
                                                              
                                                              if (success) {
                                                                ref.invalidate(complianceRemindersProvider);
                                                                ScaffoldMessenger.of(context).showSnackBar(
                                                                  SnackBar(content: Text('${doc['docLabel']} uploaded successfully!'), backgroundColor: Colors.green),
                                                                );
                                                              } else {
                                                                ScaffoldMessenger.of(context).showSnackBar(
                                                                  SnackBar(content: Text('Failed to upload ${doc['docLabel']}'), backgroundColor: Colors.red),
                                                                );
                                                              }
                                                            }
                                                          },
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ],
                                              ),
                                            );
                                          },
                                        ),
                                      ],
                                    ),
                                  ),
                                  SizedBox(height: 16.r),
                                ],
                              );
                            },
                          ),

                          // --- Grid Layout ---
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                flex: 2,
                                child: _BentoHealthCard(
                                  score: score,
                                  status: healthStatus,
                                  message: healthMessage,
                                ),
                              ),
                              SizedBox(width: 16.r),
                              Expanded(
                                flex: 1,
                                child: _BentoSimpleStatCard(
                                  label: 'Pending',
                                  value: pendingCountStr,
                                  icon: LucideIcons.clock,
                                  color: AppTheme.activeOrange,
                                  onTap: () => _showPendingCompliancesPanel(
                                      context, ref),
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: 16.r),

                          // Row 2: Urgent Deadline (Wide)
                          _BentoDeadlineCard(
                            title: urgentReminder != null
                                ? urgentReminder.title
                                : 'All Compliances Met',
                            timeLeft: urgentReminder != null
                                ? urgentReminder.message
                                : 'Up to date',
                            date: urgentReminder != null
                                ? 'Due soon'
                                : 'No upcoming deadlines',
                            color: urgentReminder != null &&
                                    (urgentReminder.status ==
                                            TaskStatus.critical ||
                                        urgentReminder.status ==
                                            TaskStatus.overdue)
                                ? const Color.fromARGB(255, 223, 105, 75)
                                : AppTheme.deepTeal,
                            onTap: urgentReminder != null
                                ? () =>
                                    _showPendingCompliancesPanel(context, ref)
                                : null,
                          ),
                          SizedBox(height: 16.r),

                          // Startup Doctor Card
                          Container(
                            width: double.infinity,
                            decoration: BoxDecoration(
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.04),
                                  blurRadius: 24,
                                  offset: const Offset(0, 12),
                                ),
                              ],
                            ),
                            child: Material(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(32.r),
                              child: InkWell(
                                onTap: () async {
                                  final url =
                                      Uri.parse('https://aistartupdoctor.com/');
                                  if (await canLaunchUrl(url)) {
                                    await launchUrl(url,
                                        mode: LaunchMode.externalApplication);
                                  }
                                },
                                borderRadius: BorderRadius.circular(32.r),
                                child: Container(
                                  padding: EdgeInsets.all(26.r),
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(32.r),
                                    border: Border.all(
                                      color:
                                          AppTheme.deepTeal.withOpacity(0.08),
                                      width: 1.0.r,
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        padding: EdgeInsets.all(4.r),
                                        child: Image.asset(
                                          'assets/sdlogo.png',
                                          height: 56.ip,
                                          width: 56.ip,
                                          fit: BoxFit.contain,
                                        ),
                                      ),
                                      SizedBox(width: 16.r),
                                      Expanded(
                                        child: Text(
                                          'Check Your Realtime Health Score In Startup doctor',
                                          style: GoogleFonts.outfit(
                                            fontSize: 14.sp,
                                            fontWeight: FontWeight.w500,
                                            color: AppTheme.deepTeal,
                                          ),
                                        ),
                                      ),
                                      Icon(LucideIcons.arrowUpRight,
                                          color: AppTheme.corporateBlue,
                                          size: 20.ip),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                          SizedBox(height: 16.r),

                          // Timeline Filtered
                          _BentoTimelineCard(
                            items: timelineItems.isNotEmpty
                                ? timelineItems
                                : const [
                                    {
                                      'title': 'No pending tasks',
                                      'status': 'All clear',
                                      'type': 'Compliance',
                                    },
                                  ],
                          ),
                          SizedBox(height: 16.r),
                          _BentoRenewalsCard(certificates: filteredCerts),
                          SizedBox(
                              height: 120
                                  .r), // Added extra padding for bottom nav bar
                        ],
                      ),
                    ),
                  ),
          ),
        ));
  }
}

class _BentoHealthCard extends StatelessWidget {
  final double score;
  final String status;
  final String message;

  const _BentoHealthCard({
    required this.score,
    required this.status,
    required this.message,
  });

  Color get _statusColor {
    if (status == 'EXCELLENT') return Colors.greenAccent;
    if (status == 'WARNING') return AppTheme.activeOrange;
    if (status == 'CRITICAL') return Colors.redAccent;
    return AppTheme.accentCyan;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 215.r,
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppTheme.deepTeal, Color(0xFF1E293B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(32.r),
        border: Border.all(
          color: Colors.white.withOpacity(0.1),
          width: 1.0.r,
        ),
        boxShadow: [
          BoxShadow(
            color: AppTheme.deepTeal.withOpacity(0.12),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'HEALTH SCORE',
                      style: GoogleFonts.outfit(
                        color: Colors.white.withOpacity(0.4),
                        fontSize: 10.sp,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 2,
                      ),
                    ),
                    SizedBox(height: 4.r),
                    Text(
                      '${(score * 100).toInt()}%',
                      style: GoogleFonts.outfit(
                        color: Colors.white,
                        fontSize: 36.sp,
                        fontWeight: FontWeight.w600,
                        letterSpacing: -1,
                        height: 1.1,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: EdgeInsets.symmetric(
                  horizontal: 12.r,
                  vertical: 6.r,
                ),
                decoration: BoxDecoration(
                  color: _statusColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12.r),
                  border: Border.all(
                    color: _statusColor.withOpacity(0.2),
                  ),
                ),
                child: Text(
                  status,
                  style: GoogleFonts.outfit(
                    color: _statusColor,
                    fontSize: 9.sp,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1,
                  ),
                ),
              ),
            ],
          ),
          const Spacer(),
          Text(
            message,
            style: GoogleFonts.outfit(
              color: Colors.white.withOpacity(0.85),
              fontSize: 13.sp,
              fontWeight: FontWeight.w500,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

class _BentoSimpleStatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  const _BentoSimpleStatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 215.r,
      decoration: BoxDecoration(
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32.r),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(32.r),
          child: Container(
            padding: EdgeInsets.all(20.r),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(32.r),
              border: Border.all(
                color: AppTheme.deepTeal.withOpacity(0.08),
                width: 1.0.r,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: EdgeInsets.all(12.r),

                  child: Icon(icon, color: color, size: 22.ip),
                ),
                const Spacer(),
                Text(
                  value,
                  style: GoogleFonts.outfit(
                    fontSize: 32.sp,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.deepTeal,
                    letterSpacing: -0.5,
                    height: 1.1,
                  ),
                ),
                SizedBox(height: 2.r),
                Text(
                  label,
                  style: GoogleFonts.outfit(
                    fontSize: 12.sp,
                    color: Colors.grey[500],
                    fontWeight: FontWeight.w500,
                    letterSpacing: 0.2,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _BentoDeadlineCard extends StatelessWidget {
  final String title;
  final String timeLeft;
  final String date;
  final Color color;
  final VoidCallback? onTap;

  const _BentoDeadlineCard({
    required this.title,
    required this.timeLeft,
    required this.date,
    required this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32.r),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(32.r),
          child: Container(
            padding: EdgeInsets.all(26.r),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(32.r),
              border: Border.all(
                color: AppTheme.deepTeal.withOpacity(0.08),
                width: 1.0.r,
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  width: 64.r,
                  height: 64.r,

                  child: Center(
                    child: HugeIcon(
                      icon: HugeIcons.strokeRoundedCalendar02,
                      color: color,
                      size: 32.ip,
                    ),
                  ),
                ),
                SizedBox(width: 20.r),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.outfit(
                          fontSize: 15.sp,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.deepTeal,
                          letterSpacing: -0.5,
                          height: 1.2,
                        ),
                      ),
                      SizedBox(height: 4.r),
                      Text(
                        date,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.outfit(
                          fontSize: 12.sp,
                          color: Colors.grey[500],
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      SizedBox(height: 12.r),
                      Container(
                        padding:
                            EdgeInsets.symmetric(horizontal: 12.r, vertical: 8.r),
                        decoration: BoxDecoration(
                          color: color,
                          borderRadius: BorderRadius.circular(16.r),
                          boxShadow: [
                            BoxShadow(
                              color: color.withOpacity(0.25),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Text(
                          timeLeft,
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          style: GoogleFonts.outfit(
                            color: Colors.white,
                            fontSize: 10.sp,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                            height: 1.2,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _BentoToolCard extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _BentoToolCard({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24.r),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(24.r),
          child: Container(
            padding: EdgeInsets.symmetric(vertical: 20.r, horizontal: 16.r),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24.r),
              border: Border.all(
                color: AppTheme.deepTeal.withOpacity(0.08),
                width: 1.0.r,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: EdgeInsets.all(10.r),

                  child: Icon(icon, color: color, size: 22.ip),
                ),
                SizedBox(height: 16.r),
                Text(
                  label,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(
                    fontSize: 14.sp,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.deepTeal,
                    height: 1.2,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _BentoTimelineCard extends StatelessWidget {
  final List<Map<String, String>> items;

  const _BentoTimelineCard({required this.items});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(26.r),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32.r),
        border: Border.all(
          color: AppTheme.deepTeal.withOpacity(0.08),
          width: 1.0.r,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'UPCOMING TIMELINE',
            style: GoogleFonts.outfit(
              fontSize: 10.sp,
              fontWeight: FontWeight.w600,
              color: AppTheme.deepTeal.withOpacity(0.3),
              letterSpacing: 2,
            ),
          ),
          SizedBox(height: 24.r),
          ...items.asMap().entries.map((entry) {
            final item = entry.value;
            final isLast = entry.key == items.length - 1;
            return _TimelineItemRow(item: item, isLast: isLast);
          }),
        ],
      ),
    );
  }
}

class _TimelineItemRow extends StatefulWidget {
  final Map<String, String> item;
  final bool isLast;

  const _TimelineItemRow({required this.item, required this.isLast});

  @override
  State<_TimelineItemRow> createState() => _TimelineItemRowState();
}

class _TimelineItemRowState extends State<_TimelineItemRow> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              margin: EdgeInsets.only(top: 5.r),
              width: 10.r,
              height: 10.r,
              decoration: BoxDecoration(
                color: const Color.fromARGB(255, 68, 97, 176),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: const Color.fromARGB(255, 0, 0, 0).withOpacity(0.2),
                    blurRadius: 4,
                  ),
                ],
              ),
            ),
            SizedBox(width: 20.r),
            Expanded(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () {
                  setState(() {
                    _isExpanded = !_isExpanded;
                  });
                },
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.item['title']!,
                      maxLines: _isExpanded ? null : 1,
                      overflow: _isExpanded ? null : TextOverflow.ellipsis,
                      style: GoogleFonts.outfit(
                        fontSize: 15.sp,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.deepTeal,
                      ),
                    ),
                    SizedBox(height: 4.r),
                    Text(
                      widget.item['status']!,
                      style: GoogleFonts.outfit(
                        fontSize: 12.sp,
                        color: Colors.grey[500],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        if (!widget.isLast)
          Container(
            margin: EdgeInsets.only(left: 4.r, top: 6.r, bottom: 6.r),
            height: 24.r,
            width: 2.r,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppTheme.accentCyan.withOpacity(0.3),
                  Colors.transparent,
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
      ],
    );
  }
}

class _ReminderItem extends ConsumerWidget {
  final ComplianceTask reminder;

  const _ReminderItem({required this.reminder});

  void _showTaskDetailsBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(36)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            top: 32,
            left: 24,
            right: 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      reminder.title,
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: Colors.black87,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(LucideIcons.x, size: 16, color: Colors.black54),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: Color(0xFFEEEEEE))),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            reminder.message,
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey.shade700,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Entity: ${reminder.entityName}',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey.shade500,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              if (reminder.documents.isNotEmpty) ...[
                const Text(
                  'Attached Documents',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 16),
                ...reminder.documents.map((doc) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: InkWell(
                      onTap: () async {
                        final url = Uri.parse('$kBaseUrl/api/documents/${doc.id}');
                        if (await canLaunchUrl(url)) {
                          await launchUrl(url, mode: LaunchMode.externalApplication);
                        }
                      },
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              LucideIcons.fileText,
                              color: Colors.black54,
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    doc.type,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.black87,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    doc.filename,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey.shade500,
                                      fontWeight: FontWeight.w500,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            const Icon(
                              LucideIcons.download,
                              size: 18,
                              color: Colors.black54,
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
              ] else ...[
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: Column(
                      children: [
                        Icon(LucideIcons.fileMinus, size: 32, color: Colors.grey[300]),
                        const SizedBox(height: 12),
                        Text(
                          'No documents attached yet',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[500],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 40),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentEntity = ref.watch(selectedEntityProvider);

    return InkWell(
      onTap: () => _showTaskDetailsBottomSheet(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 12),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(bottom: BorderSide(color: Color(0xFFEEEEEE))),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          reminder.title,
                          style: const TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: Colors.black87,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        reminder.status == TaskStatus.completed
                            ? 'Completed'
                            : (reminder.status == TaskStatus.overdue || reminder.daysLeft < 0)
                                ? 'Overdue'
                                : '${reminder.daysLeft} days left',
                        style: TextStyle(
                          fontSize: 11,
                          color: reminder.status == TaskStatus.completed
                              ? Colors.green
                              : (reminder.status == TaskStatus.overdue || reminder.daysLeft < 0)
                                  ? Colors.red
                                  : Colors.grey.shade500,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    reminder.message,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade600,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (currentEntity == 'All Entities')
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        'Entity: ${reminder.entityName}',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey.shade500,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  if (reminder.daysLeft <= 3 && reminder.status != TaskStatus.completed) ...[
                    const SizedBox(height: 6),
                    Text(
                      'If not completed you Need To Pay Penalty',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: Colors.red.shade600,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BentoRenewalsCard extends ConsumerWidget {
  final List<CertificateModel> certificates;
  const _BentoRenewalsCard({required this.certificates});

  Color _getStatusColor(String status) {
    if (status == 'Active') return Colors.green;
    if (status == 'Renewal Upcoming') return Colors.grey;
    if (status == 'Due Soon' || status == 'Action Required') return Colors.orange;
    if (status == 'Critical') return Colors.red;
    if (status == 'Expired') return Colors.grey;
    return Colors.grey;
  }

  void _showRenewConfirmDialog(BuildContext context, WidgetRef ref, CertificateModel cert) {
    bool isSubmitting = false;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20.r)),
              title: Text('Renew Service', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 20.sp)),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Do you want to submit a renewal request for this service?', style: GoogleFonts.outfit(fontSize: 14.sp)),
                  SizedBox(height: 16.r),
                  Container(
                    padding: EdgeInsets.all(12.r),
                    decoration: BoxDecoration(color: Colors.grey[100], borderRadius: BorderRadius.circular(8.r)),
                    child: Column(
                      children: [
                        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                          Text('Service', style: GoogleFonts.outfit(color: Colors.grey[600], fontSize: 13.sp)),
                          Expanded(child: Text(cert.serviceName, textAlign: TextAlign.right, style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13.sp))),
                        ]),
                        SizedBox(height: 8.r),
                        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                          Text('Certificate No', style: GoogleFonts.outfit(color: Colors.grey[600], fontSize: 13.sp)),
                          Text(cert.certificateNumber, style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13.sp)),
                        ]),
                      ],
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: isSubmitting ? null : () => Navigator.pop(ctx),
                  child: Text('Cancel', style: GoogleFonts.outfit(color: Colors.grey[600], fontWeight: FontWeight.bold)),
                ),
                TextButton(
                  onPressed: isSubmitting ? null : () async {
                    setState(() => isSubmitting = true);
                    try {
                      final uid = ref.read(authStateProvider).value?.uid;
                      final res = await http.post(
                        Uri.parse('$kBaseUrl/api/certificates/${cert.id}/renew'),
                        headers: {'x-user-id': uid ?? ''},
                      );
                      setState(() => isSubmitting = false);
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Renewal request submitted!')));
                      ref.refresh(certificatesProvider);
                    } catch (e) {
                      setState(() => isSubmitting = false);
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to submit renewal')));
                    }
                  },
                  child: Text(isSubmitting ? 'Submitting...' : 'Submit Request', style: GoogleFonts.outfit(color: AppTheme.corporateBlue, fontWeight: FontWeight.bold)),
                ),
              ],
            );
          }
        );
      }
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: EdgeInsets.all(24.r),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Renewals & Expiry',
            style: GoogleFonts.outfit(
              fontSize: 18.sp,
              fontWeight: FontWeight.w600,
              color: AppTheme.deepTeal,
              letterSpacing: -0.5,
            ),
          ),
          SizedBox(height: 16.r),
          if (certificates.isEmpty)
            Padding(
              padding: EdgeInsets.symmetric(vertical: 24.r),
              child: Center(
                child: Text('No certificates found.', style: GoogleFonts.outfit(color: Colors.grey, fontSize: 14.sp)),
              ),
            )
          else
            ...certificates.map((cert) => Container(
              margin: EdgeInsets.only(bottom: 12.r),
              padding: EdgeInsets.all(16.r),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.withOpacity(0.2)),
                borderRadius: BorderRadius.circular(16.r),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          cert.serviceName,
                          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 15.sp, color: AppTheme.deepTeal),
                        ),
                      ),
                      Container(
                        padding: EdgeInsets.symmetric(horizontal: 8.r, vertical: 4.r),
                        decoration: BoxDecoration(
                          color: _getStatusColor(cert.renewalStatus).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6.r),
                        ),
                        child: Text(
                          cert.renewalStatus.toUpperCase(),
                          style: GoogleFonts.outfit(
                            fontSize: 10.sp,
                            fontWeight: FontWeight.bold,
                            color: _getStatusColor(cert.renewalStatus),
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 8.r),
                  Text('Cert No: ${cert.certificateNumber}', style: GoogleFonts.outfit(fontSize: 13.sp, color: Colors.grey[600])),
                  Text('Expires: ${cert.expiryDate.split("T")[0]}', style: GoogleFonts.outfit(fontSize: 13.sp, color: Colors.grey[600])),
                  Text('${cert.daysRemaining} Days Remaining', style: GoogleFonts.outfit(fontSize: 13.sp, fontWeight: FontWeight.bold, color: cert.daysRemaining < 0 ? Colors.red : Colors.grey[800])),
                  if (cert.renewalRequired && cert.renewalStatus != 'Renewal Processing') ...[
                    SizedBox(height: 10.r),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => _showRenewConfirmDialog(context, ref, cert),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.deepTeal,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.r)),
                        ),
                        child: Text('Renew Now', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11.sp)),
                      ),
                    ),
                  ] else if (cert.renewalStatus == 'Renewal Processing') ...[
                    SizedBox(height: 12.r),
                    Text('Renewal in Processing...', style: GoogleFonts.outfit(color: Colors.grey, fontStyle: FontStyle.italic)),
                  ],
                ],
              ),
            )),
        ],
      ),
    );
  }
}
