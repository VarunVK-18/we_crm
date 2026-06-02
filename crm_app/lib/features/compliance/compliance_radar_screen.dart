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

class ComplianceRadarScreen extends ConsumerWidget {
  const ComplianceRadarScreen({super.key});

  void _showNotificationPanel(BuildContext context, WidgetRef ref) {
    final selectedEntity = ref.read(selectedEntityProvider);
    final reminders = ref.read(complianceRemindersProvider).value ?? [];
    final filteredReminders = reminders
        .where((r) =>
            selectedEntity == 'All Entities' || r.entityName == selectedEntity)
        .toList();

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
                    const Text(
                      'Service Alerts',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.deepTeal,
                        letterSpacing: -0.5,
                      ),
                    ),
                    Text(
                      'Action required for your entities',
                      style: TextStyle(
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
                            style: TextStyle(
                              color: Colors.grey[400],
                              fontWeight: FontWeight.w600,
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
    final pendingReminders = reminders
        .where((r) =>
            (selectedEntity == 'All Entities' ||
                r.entityName == selectedEntity) &&
            r.status != ReminderStatus.expired)
        .toList();

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
                    const Text(
                      'Pending Compliances',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.deepTeal,
                        letterSpacing: -0.5,
                      ),
                    ),
                    Text(
                      'Upcoming filings & actions required',
                      style: TextStyle(
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
                    ...pendingReminders.map(
                      (reminder) => _ReminderItem(reminder: reminder),
                    ),
                    if (pendingReminders.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 40),
                        child: Center(
                          child: Text(
                            'No pending compliances for this entity.',
                            style: TextStyle(
                              color: Colors.grey[400],
                              fontWeight: FontWeight.w600,
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
            r.status != ReminderStatus.expired)
        .toList();
    final pendingCountStr = pendingReminders.length.toString().padLeft(2, '0');

    // Calculate Health Score dynamically based on active/expired database reminders
    final totalForEntity = reminders
        .where((r) =>
            currentEntity == 'All Entities' || r.entityName == currentEntity)
        .length;
    final expiredCount = reminders
        .where((r) =>
            (currentEntity == 'All Entities' ||
                r.entityName == currentEntity) &&
            r.status == ReminderStatus.expired)
        .length;
    final score = totalForEntity == 0
        ? 1.0
        : (totalForEntity - expiredCount) / totalForEntity;
    final healthStatus = score >= 0.8
        ? 'EXCELLENT'
        : score >= 0.5
            ? 'WARNING'
            : 'CRITICAL';
    final healthMessage = score >= 0.8
        ? 'Your entity compliance health is safe.'
        : 'Action required: resolve expired/urgent items.';

    // Find the most urgent deadline dynamically
    final urgentReminder = pendingReminders.isEmpty
        ? null
        : pendingReminders.reduce((a, b) => a.daysLeft < b.daysLeft ? a : b);

    // Map upcoming items dynamically to the timeline card
    final timelineItems = pendingReminders
        .map((r) => {
              'title': currentEntity == 'All Entities'
                  ? '${r.serviceName} (${r.entityName})'
                  : r.serviceName,
              'status': r.message,
              'type': r.status == ReminderStatus.urgent ? 'Urgent' : 'Upcoming',
            })
        .toList();

    return AnnotatedRegion<SystemUiOverlayStyle>(
        value: SystemUiOverlayStyle.dark.copyWith(
          statusBarColor: Colors.transparent,
        ),
        child: Scaffold(
          backgroundColor: AppTheme.backgroundLight,
          body: SafeArea(
            child: isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      valueColor:
                          AlwaysStoppedAnimation<Color>(AppTheme.deepTeal),
                    ),
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
                                      style: TextStyle(
                                        color:
                                            AppTheme.deepTeal.withOpacity(0.4),
                                        fontSize: 10.sp,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 2,
                                      ),
                                    ),
                                    SizedBox(height: 4.r),
                                    Row(
                                      children: [
                                        Flexible(
                                          child: Text(
                                            currentEntity,
                                            style: TextStyle(
                                              color: AppTheme.deepTeal,
                                              fontSize: 18.sp,
                                              fontWeight: FontWeight.w900,
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
                                                  style: TextStyle(
                                                    fontSize: 10.sp,
                                                    fontWeight: FontWeight.w900,
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
                                          r.status == ReminderStatus.urgent)
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
                                ? urgentReminder.serviceName
                                : 'All Compliances Met',
                            timeLeft: urgentReminder != null
                                ? urgentReminder.message
                                : 'Up to date',
                            date: urgentReminder != null
                                ? 'Due soon'
                                : 'No upcoming deadlines',
                            color: urgentReminder != null &&
                                    urgentReminder.status ==
                                        ReminderStatus.urgent
                                ? const Color.fromARGB(255, 223, 105, 75)
                                : AppTheme.deepTeal,
                            onTap: urgentReminder != null 
                                ? () => _showPendingCompliancesPanel(context, ref) 
                                : null,
                          ),
                          SizedBox(height: 16.r),

                          // Row 3: Tools (Grid Row)
                          Row(
                            children: [
                              Expanded(
                                child: _BentoToolCard(
                                  label: 'Name Check',
                                  icon: LucideIcons.search,
                                  color: AppTheme.corporateBlue,
                                  onTap: () => Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) =>
                                          const NameCheckScreen(),
                                    ),
                                  ),
                                ),
                              ),
                              SizedBox(width: 16.r),
                              Expanded(
                                child: _BentoToolCard(
                                  label: 'GST Portal',
                                  icon: LucideIcons.fileText,
                                  color: AppTheme.activeOrange,
                                  onTap: () {},
                                ),
                              ),
                            ],
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
                          SizedBox(height: 32.r),
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
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.4),
                        fontSize: 10.sp,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2,
                      ),
                    ),
                    SizedBox(height: 4.r),
                    Text(
                      '${(score * 100).toInt()}%',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 36.sp,
                        fontWeight: FontWeight.w900,
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
                  color: AppTheme.accentCyan.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12.r),
                  border: Border.all(
                    color: AppTheme.accentCyan.withOpacity(0.2),
                  ),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    color: AppTheme.accentCyan,
                    fontSize: 9.sp,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1,
                  ),
                ),
              ),
            ],
          ),
          const Spacer(),
          Text(
            message,
            style: TextStyle(
              color: Colors.white.withOpacity(0.85),
              fontSize: 13.sp,
              fontWeight: FontWeight.w600,
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
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(16.r),
                  ),
                  child: Icon(icon, color: color, size: 22.ip),
                ),
                const Spacer(),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 32.sp,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.deepTeal,
                    letterSpacing: -0.5,
                    height: 1.1,
                  ),
                ),
                SizedBox(height: 2.r),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12.sp,
                    color: Colors.grey[500],
                    fontWeight: FontWeight.w800,
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
            decoration: BoxDecoration(
              color: color.withOpacity(0.08),
              borderRadius: BorderRadius.circular(20.r),
            ),
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
            flex: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 15.sp,
                    fontWeight: FontWeight.w900,
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
                  style: TextStyle(
                    fontSize: 12.sp,
                    color: Colors.grey[500],
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(width: 12.r),
          Flexible(
            flex: 2,
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 12.r, vertical: 8.r),
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
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 10.sp,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.5,
                  height: 1.2,
                ),
              ),
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
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  child: Icon(icon, color: color, size: 22.ip),
                ),
                SizedBox(height: 16.r),
                Text(
                  label,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14.sp,
                    fontWeight: FontWeight.w900,
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
            style: TextStyle(
              fontSize: 10.sp,
              fontWeight: FontWeight.w900,
              color: AppTheme.deepTeal.withOpacity(0.3),
              letterSpacing: 2,
            ),
          ),
          SizedBox(height: 24.r),
          ...items.asMap().entries.map((entry) {
            final item = entry.value;
            final isLast = entry.key == items.length - 1;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      width: 10.r,
                      height: 10.r,
                      decoration: BoxDecoration(
                        color: const Color.fromARGB(255, 68, 97, 176),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: const Color.fromARGB(255, 0, 0, 0)
                                .withOpacity(0.2),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                    ),
                    SizedBox(width: 20.r),
                    Expanded(
                      child: Text(
                        item['title']!,
                        style: TextStyle(
                          fontSize: 15.sp,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.deepTeal,
                        ),
                      ),
                    ),
                    Text(
                      item['status']!,
                      style: TextStyle(
                        fontSize: 12.sp,
                        color: Colors.grey[500],
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
                if (!isLast)
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
          }),
        ],
      ),
    );
  }
}

class _ReminderItem extends ConsumerWidget {
  final ComplianceReminder reminder;

  const _ReminderItem({required this.reminder});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentEntity = ref.watch(selectedEntityProvider);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.withOpacity(0.08)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: reminder.color.withOpacity(0.08),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(
              reminder.status == ReminderStatus.expired
                  ? LucideIcons.alertTriangle
                  : LucideIcons.calendarClock,
              color: reminder.color,
              size: 20,
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  reminder.serviceName,
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                    color: AppTheme.deepTeal,
                    letterSpacing: -0.3,
                  ),
                ),
                if (currentEntity == 'All Entities')
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      reminder.entityName,
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey[500],
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                const SizedBox(height: 2),
                Text(
                  reminder.message.toUpperCase(),
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 10,
                    color: reminder.color,
                    letterSpacing: 1.2,
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () {
              Navigator.pop(context); // Close panel
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                useSafeArea: true,
                backgroundColor: Colors.transparent,
                builder: (context) => ServiceRequestSummarySheet(
                  packageName: reminder.serviceName,
                ),
              );
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: AppTheme.deepTeal,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.deepTeal.withOpacity(0.2),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Text(
                'Renew',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
