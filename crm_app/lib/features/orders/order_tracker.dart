import 'package:crm_app/features/profile/my_entities_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'notification_sheet.dart';
import '../../providers/notification_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../models/order_model.dart';
import '../../core/utils/whatsapp_utils.dart';
import 'service_order_detail_screen.dart';
import 'invoice_screen.dart';

// ─── Mock Data ───────────────────────────────────────────────────────────────
// Replace _mockOrders with a Firestore/Riverpod stream when backend is ready.

final _mockOrders = <ServiceOrder>[
  ServiceOrder(
    id: 'ORD-001',
    clientUid: 'mock',
    entityName: 'Balaji',
    serviceType: 'Private Limited Incorporation',
    companyName: 'Balaji Enterprises Pvt Ltd',
    status: ServiceStatus.active,
    stage: OrderStage.workInProgress,
    assignedExpert: 'Rohan Mehra',
    expertPhone: '918072286963',
    createdAt: DateTime(2026, 3, 10),
    steps: const [
      ServiceStep(
        title: 'Documents Collected',
        description:
            'Identity proof, address proof, and director declarations received.',
        isCompleted: true,
      ),
      ServiceStep(
        title: 'Name Approval (RUN)',
        description:
            'Company name submitted to MCA for reservation. Approval received.',
        isCompleted: true,
      ),
      ServiceStep(
        title: 'Filing of SPICe+ Form',
        description:
            'Drafting and filing the SPICe+ form with MCA portal is in progress.',
        isCompleted: false,
      ),
      ServiceStep(
        title: 'Government Approval',
        description:
            'Awaiting Certificate of Incorporation from the Registrar of Companies.',
        isCompleted: false,
      ),
      ServiceStep(
        title: 'Document Delivery',
        description:
            'COI, PAN, and TAN will be delivered to your registered email.',
        isCompleted: false,
      ),
    ],
  ),
  ServiceOrder(
    id: 'ORD-002',
    clientUid: 'mock',
    entityName: 'Balaji',
    serviceType: 'GST Registration',
    companyName: 'Balaji Enterprises Pvt Ltd',
    status: ServiceStatus.active,
    stage: OrderStage.workAssigned,
    assignedExpert: 'Priya Sharma',
    expertPhone: '918072286963',
    createdAt: DateTime(2026, 4, 1),
    steps: const [
      ServiceStep(
        title: 'Application Initiated',
        description: 'GST registration application has been initiated.',
        isCompleted: true,
      ),
      ServiceStep(
        title: 'Documents Under Review',
        description: 'Business documents are being verified by our team.',
        isCompleted: false,
      ),
      ServiceStep(
        title: 'GST Application Filing',
        description: 'Filing Form REG-01 on the GST portal.',
        isCompleted: false,
      ),
      ServiceStep(
        title: 'ARN Generation',
        description: 'Application Reference Number will be shared with you.',
        isCompleted: false,
      ),
      ServiceStep(
        title: 'GSTIN Issued',
        description: 'Your unique GST Identification Number will be delivered.',
        isCompleted: false,
      ),
    ],
  ),
  ServiceOrder(
    id: 'ORD-003',
    clientUid: 'mock',
    entityName: 'Tech Solutions',
    serviceType: 'TDS Filing (Q4 2025-26)',
    companyName: 'Tech Solutions LLP',
    status: ServiceStatus.active,
    stage: OrderStage.testing,
    assignedExpert: 'Amit Joshi',
    expertPhone: '918072286963',
    createdAt: DateTime(2026, 4, 5),
    steps: const [
      ServiceStep(
        title: 'Data Collection',
        description: 'Salary and payment data collected from client.',
        isCompleted: true,
      ),
      ServiceStep(
        title: 'TDS Challan Payment',
        description: 'TDS amount deposited via NSDL portal.',
        isCompleted: true,
      ),
      ServiceStep(
        title: 'Return Preparation',
        description: 'Form 24Q/26Q prepared based on the data.',
        isCompleted: true,
      ),
      ServiceStep(
        title: 'Filing Verification',
        description: 'Final return is under review before submission.',
        isCompleted: false,
      ),
      ServiceStep(
        title: 'Acknowledgement',
        description: 'Filed return acknowledgement will be shared with you.',
        isCompleted: false,
      ),
    ],
  ),
  ServiceOrder(
    id: 'ORD-004',
    clientUid: 'mock',
    entityName: 'Balaji',
    serviceType: 'DSC Registration',
    companyName: 'Balaji Enterprises Pvt Ltd',
    status: ServiceStatus.complete,
    stage: OrderStage.completed,
    assignedExpert: 'Rohan Mehra',
    expertPhone: '918072286963',
    createdAt: DateTime(2026, 2, 15),
    steps: const [
      ServiceStep(
        title: 'Application Submitted',
        description: 'DSC application submitted with identity proof.',
        isCompleted: true,
      ),
      ServiceStep(
        title: 'Verification Done',
        description: 'Identity verification completed successfully.',
        isCompleted: true,
      ),
      ServiceStep(
        title: 'DSC Issued',
        description: 'Digital Signature Certificate issued and delivered.',
        isCompleted: true,
      ),
    ],
  ),
  ServiceOrder(
    id: 'ORD-005',
    clientUid: 'mock',
    entityName: 'Tech Solutions',
    serviceType: 'Annual ROC Filing',
    companyName: 'Tech Solutions LLP',
    status: ServiceStatus.complete,
    stage: OrderStage.completed,
    assignedExpert: 'Priya Sharma',
    expertPhone: '918072286963',
    createdAt: DateTime(2026, 1, 20),
    steps: const [
      ServiceStep(
        title: 'Financial Statements Prepared',
        description: 'Balance sheet and P&L prepared.',
        isCompleted: true,
      ),
      ServiceStep(
        title: 'Board Approval',
        description: 'Directors approved the financial statements.',
        isCompleted: true,
      ),
      ServiceStep(
        title: 'AOC-4 & MGT-7 Filed',
        description: 'Annual returns filed with MCA.',
        isCompleted: true,
      ),
    ],
  ),
  ServiceOrder(
    id: 'ORD-006',
    clientUid: 'mock',
    entityName: 'Balaji',
    serviceType: 'Trademark Registration',
    companyName: 'Balaji Enterprises Pvt Ltd',
    status: ServiceStatus.notInitialized,
    stage: OrderStage.reqReceived,
    assignedExpert: 'To be assigned',
    expertPhone: '918072286963',
    createdAt: DateTime(2026, 4, 12),
    steps: const [],
  ),
];

// ─── Tab definition ───────────────────────────────────────────────────────────

enum _ServiceTab { active, complete, notInitialized, history }

const _tabLabels = {
  _ServiceTab.active: 'Active',
  _ServiceTab.complete: 'Complete',
  _ServiceTab.notInitialized: 'Not Initialized',
  _ServiceTab.history: 'History',
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

class OrderTrackerScreen extends ConsumerStatefulWidget {
  const OrderTrackerScreen({super.key});

  @override
  ConsumerState<OrderTrackerScreen> createState() => _OrderTrackerScreenState();
}

class _OrderTrackerScreenState extends ConsumerState<OrderTrackerScreen> {
  _ServiceTab _selectedTab = _ServiceTab.active;
  String? _selectedEntity;

  @override
  Widget build(BuildContext context) {
    // Build entity list from mock data
    final entities = _mockOrders.map((o) => o.entityName).toSet().toList()
      ..sort();

    // Filter by selected entity
    final entityFiltered = _selectedEntity == null
        ? _mockOrders
        : _mockOrders.where((o) => o.entityName == _selectedEntity).toList();

    final activeList = entityFiltered
        .where((o) => o.status == ServiceStatus.active)
        .toList();
    final completeList = entityFiltered
        .where((o) => o.status == ServiceStatus.complete)
        .toList();
    final notInitList = entityFiltered
        .where((o) => o.status == ServiceStatus.notInitialized)
        .toList();
    final historyList = entityFiltered
        .where((o) => o.status == ServiceStatus.complete)
        .toList();

    final counts = {
      _ServiceTab.active: activeList.length,
      _ServiceTab.complete: completeList.length,
      _ServiceTab.notInitialized: notInitList.length,
      _ServiceTab.history: historyList.length,
    };

    final visibleList = switch (_selectedTab) {
      _ServiceTab.active => activeList,
      _ServiceTab.complete => completeList,
      _ServiceTab.notInitialized => notInitList,
      _ServiceTab.history => historyList,
    };

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F9),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header ─────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Row(
                children: [
                  const Text(
                    'My Services',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.deepTeal,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () {
                      ref.read(notificationProvider.notifier).markAllAsRead();
                      showModalBottomSheet(
                        context: context,
                        backgroundColor: Colors.transparent,
                        isScrollControlled: true,
                        builder: (context) => const NotificationSheet(),
                      );
                    },
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.06),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Center(
                            child: HugeIcon(
                              icon: HugeIcons.strokeRoundedNotification03,
                              size: 20,
                              color: AppTheme.deepTeal,
                            ),
                          ),
                        ),
                        if (ref.watch(unreadNotificationCountProvider) > 0)
                          Positioned(
                            top: -2,
                            right: -2,
                            child: Container(
                              width: 18,
                              height: 18,
                              decoration: BoxDecoration(
                                color: Colors.black,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: Colors.white,
                                  width: 1.5,
                                ),
                              ),
                              child: Center(
                                child: Text(
                                  ref
                                      .watch(unreadNotificationCountProvider)
                                      .toString(),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // ── Entity Selector Card ────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text(
                          'Select Entity',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.deepTeal,
                          ),
                        ),
                        const Spacer(),
                        const Icon(
                          LucideIcons.eye,
                          size: 14,
                          color: AppTheme.corporateBlue,
                        ),
                        const SizedBox(width: 4),
                        GestureDetector(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => MyEntitiesScreen(),
                              ),
                            );
                          },
                          child: const Text(
                            'View Entity',
                            style: TextStyle(
                              fontSize: 13,
                              color: AppTheme.corporateBlue,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<String?>(
                      value: _selectedEntity,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: const Color(0xFFF4F6F9),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 12,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      hint: const Text(
                        'All Entities',
                        style: TextStyle(fontSize: 14, color: Colors.grey),
                      ),
                      icon: const Icon(
                        LucideIcons.chevronDown,
                        size: 18,
                        color: Colors.grey,
                      ),
                      items: [
                        const DropdownMenuItem<String?>(
                          value: null,
                          child: Text(
                            'All Entities',
                            style: TextStyle(fontSize: 14),
                          ),
                        ),
                        ...entities.map(
                          (e) => DropdownMenuItem<String?>(
                            value: e,
                            child: Text(
                              e,
                              style: const TextStyle(fontSize: 14),
                            ),
                          ),
                        ),
                      ],
                      onChanged: (val) => setState(() => _selectedEntity = val),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // ── Tab Chips ───────────────────────────────────────────────────
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              physics: const BouncingScrollPhysics(),
              child: Row(
                children: _ServiceTab.values.map((tab) {
                  final isSelected = _selectedTab == tab;
                  final count = counts[tab] ?? 0;
                  return Padding(
                    padding: const EdgeInsets.only(right: 10),
                    child: GestureDetector(
                      onTap: () => setState(() => _selectedTab = tab),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 18,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: isSelected ? AppTheme.deepTeal : Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: [
                            BoxShadow(
                              color: isSelected
                                  ? AppTheme.deepTeal.withValues(alpha: 0.3)
                                  : Colors.black.withValues(alpha: 0.04),
                              blurRadius: isSelected ? 10 : 6,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Text(
                          '${_tabLabels[tab]}  ${count.toString().padLeft(2, '0')}',
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                            color: isSelected
                                ? Colors.white
                                : Colors.grey.shade600,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 16),

            // ── Service List or Empty State ─────────────────────────────────
            Expanded(
              child: visibleList.isEmpty
                  ? _EmptyState(tab: _selectedTab)
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                      physics: const BouncingScrollPhysics(),
                      itemCount: visibleList.length,
                      itemBuilder: (context, i) =>
                          _ServiceCard(order: visibleList[i]),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Service Card ─────────────────────────────────────────────────────────────

class _ServiceCard extends StatelessWidget {
  final ServiceOrder order;
  const _ServiceCard({required this.order});

  static const _stageLabels = {
    OrderStage.reqReceived: 'Req. Received',
    OrderStage.workAssigned: 'Work Assigned',
    OrderStage.workInProgress: 'In Progress',
    OrderStage.testing: 'Under Review',
    OrderStage.completed: 'Completed',
  };

  ({Color bg, Color text}) get _badgeColors => switch (order.stage) {
    OrderStage.reqReceived => (
      bg: const Color(0xFFEBF3FF),
      text: const Color(0xFF2563EB),
    ),
    OrderStage.workAssigned => (
      bg: const Color.fromARGB(255, 228, 244, 229),
      text: const Color.fromARGB(255, 18, 127, 74),
    ),
    OrderStage.workInProgress => (
      bg: const Color(0xFFFFF4E6),
      text: const Color(0xFFD97706),
    ),
    OrderStage.testing => (
      bg: const Color.fromARGB(255, 232, 231, 179),
      text: const Color.fromARGB(255, 12, 12, 4),
    ),
    OrderStage.completed => (
      bg: const Color(0xFFF0FFF4),
      text: const Color(0xFF16A34A),
    ),
  };

  @override
  Widget build(BuildContext context) {
    final progress = order.progressValue;
    final completedSteps = order.steps.where((s) => s.isCompleted).length;
    final totalSteps = order.steps.length;
    final dateStr = DateFormat('dd MMM yyyy').format(order.createdAt);
    final badgeColors = _badgeColors;
    final isActive = order.status == ServiceStatus.active;
    final isComplete = order.status == ServiceStatus.complete;

    return GestureDetector(
      onTap: isActive
          ? () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => ServiceOrderDetailScreen(order: order),
              ),
            )
          : isComplete
          ? () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => InvoiceScreen(order: order)),
            )
          : null,
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 15,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top row
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        order.serviceType,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.deepTeal,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            LucideIcons.building2,
                            size: 12,
                            color: Colors.grey.shade500,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            order.entityName,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: badgeColors.bg,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _stageLabels[order.stage] ?? '',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: badgeColors.text,
                    ),
                  ),
                ),
              ],
            ),

            // Progress bar
            if (totalSteps > 0) ...[
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: progress,
                        backgroundColor: Colors.grey.shade100,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          order.status == ServiceStatus.complete
                              ? Colors.green
                              : AppTheme.deepTeal,
                        ),
                        minHeight: 5,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    '$completedSteps/$totalSteps steps',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey.shade500,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],

            const SizedBox(height: 14),

            // Bottom row: expert + WhatsApp + date + arrow
            Row(
              children: [
                CircleAvatar(
                  radius: 12,
                  backgroundColor: AppTheme.deepTeal.withValues(alpha: 0.1),
                  child: const HugeIcon(
                    icon: HugeIcons.strokeRoundedUser,
                    size: 14,
                    color: AppTheme.deepTeal,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    order.assignedExpert,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.deepTeal,
                      fontWeight: FontWeight.w600,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                // WhatsApp button — visible for active orders with a phone
                if (isActive && order.expertPhone.isNotEmpty) ...[
                  GestureDetector(
                    onTap: () => openWhatsApp(
                      phone: '918072286963',
                      message:
                          'Hi ${order.assignedExpert}, I have a query regarding my ${order.serviceType} service (${order.id}).',
                    ),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF128C7E).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: const Color(0xFF128C7E).withValues(alpha: 0.3),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Image.network(
                            'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
                            width: 14,
                            height: 14,
                            errorBuilder: (_, __, ___) => const HugeIcon(
                              icon: HugeIcons.strokeRoundedBubbleChat,
                              size: 14,
                              color: Color(0xFF128C7E),
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Text(
                            'Chat',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF128C7E),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                Text(
                  dateStr,
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade400),
                ),
                if (isActive || isComplete) ...[
                  const SizedBox(width: 6),
                  Icon(
                    LucideIcons.chevronRight,
                    size: 16,
                    color: Colors.grey.shade400,
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Empty State ──────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  final _ServiceTab tab;
  const _EmptyState({required this.tab});

  @override
  Widget build(BuildContext context) {
    final (icon, message) = switch (tab) {
      _ServiceTab.active => (
        HugeIcons.strokeRoundedTask01,
        'No active services found',
      ),
      _ServiceTab.complete => (
        HugeIcons.strokeRoundedTaskDone01,
        'No completed services yet',
      ),
      _ServiceTab.notInitialized => (
        HugeIcons.strokeRoundedHourglass,
        'No pending services',
      ),
      _ServiceTab.history => (
        HugeIcons.strokeRoundedClock01,
        'No order history found',
      ),
    };

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: Colors.grey.withValues(alpha: 0.06),
              shape: BoxShape.circle,
            ),
            child: HugeIcon(icon: icon, size: 52, color: Colors.grey.shade400),
          ),
          const SizedBox(height: 20),
          Text(
            message,
            style: TextStyle(
              fontSize: 15,
              color: Colors.grey.shade500,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
