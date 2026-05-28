import 'package:crm_app/features/profile/my_entities_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_theme.dart';
import '../../models/order_model.dart';
import 'order_chat_screen.dart';
import 'service_order_detail_screen.dart';
import '../../providers/orders_provider.dart';
import '../../providers/auth_provider.dart';

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
    final ordersAsync = ref.watch(serviceOrdersProvider);
    var orders = ordersAsync.value ?? [];
    final isLoading = ordersAsync.isLoading && orders.isEmpty;

    final user = ref.watch(userProfileProvider).value;

    // Build entity list from database data
    final entities = orders.map((o) => o.entityName).toSet().toList()..sort();

    // Filter by selected entity
    final entityFiltered = _selectedEntity == null
        ? orders
        : orders.where((o) => o.entityName == _selectedEntity).toList();

    final activeList =
        entityFiltered.where((o) => o.status == ServiceStatus.active).toList();
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
                  IconButton(
                    onPressed: () {
                      ref.invalidate(serviceOrdersProvider);
                    },
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      shadowColor: Colors.black.withValues(alpha: 0.04),
                      elevation: 2,
                    ),
                    icon: const Icon(
                      LucideIcons.refreshCw,
                      size: 18,
                      color: AppTheme.deepTeal,
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
                                builder: (context) => const MyEntitiesScreen(),
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
                      initialValue: _selectedEntity,
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
              child: isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        valueColor:
                            AlwaysStoppedAnimation<Color>(AppTheme.deepTeal),
                      ),
                    )
                  : visibleList.isEmpty
                      ? _EmptyState(tab: _selectedTab)
                      : RefreshIndicator(
                          color: AppTheme.deepTeal,
                          onRefresh: () async {
                            ref.invalidate(serviceOrdersProvider);
                            // small delay to show the spinner
                            await Future.delayed(
                                const Duration(milliseconds: 500));
                          },
                          child: ListView.builder(
                            padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                            physics: const AlwaysScrollableScrollPhysics(
                                parent: BouncingScrollPhysics()),
                            itemCount: visibleList.length,
                            itemBuilder: (context, i) =>
                                _ServiceCard(order: visibleList[i]),
                          ),
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
    OrderStage.quotePending: 'Quote Pending',
    OrderStage.quoteAccepted: 'Quote Accepted',
    OrderStage.workAssigned: 'Work Assigned',
    OrderStage.documentRequested: 'Doc Requested',
    OrderStage.workInProgress: 'In Progress',
    OrderStage.completed: 'Completed',
  };

  ({Color bg, Color text}) get _badgeColors => switch (order.stage) {
        OrderStage.quotePending => (
            bg: const Color(0xFFEBF3FF),
            text: const Color(0xFF2563EB),
          ),
        OrderStage.quoteAccepted => (
            bg: const Color.fromARGB(255, 230, 240, 255),
            text: const Color.fromARGB(255, 20, 100, 200),
          ),
        OrderStage.workAssigned => (
            bg: const Color.fromARGB(255, 228, 244, 229),
            text: const Color.fromARGB(255, 18, 127, 74),
          ),
        OrderStage.documentRequested => (
            bg: const Color(0xFFFFF0F5),
            text: const Color(0xFFE11D48),
          ),
        OrderStage.workInProgress => (
            bg: const Color(0xFFFFF4E6),
            text: const Color(0xFFD97706),
          ),
        OrderStage.completed => (
            bg: const Color(0xFFF0FFF4),
            text: const Color(0xFF16A34A),
          ),
        OrderStage.reqReceived => (
            bg: const Color(0xFFF3E8FF),
            text: const Color(0xFF7E22CE),
          ),
        OrderStage.testing => (
            bg: const Color(0xFFE0F2FE),
            text: const Color(0xFF0284C7),
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
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ServiceOrderDetailScreen(order: order),
        ),
      ),
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
                // Internal Chat button — visible for active orders
                if (isActive) ...[
                  GestureDetector(
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => OrderChatScreen(
                          orderId: order.id,
                          serviceName: order.serviceType,
                          assignedExpert: order.assignedExpert,
                        ),
                      ),
                    ),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.corporateBlue.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: AppTheme.corporateBlue.withOpacity(0.3),
                        ),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          HugeIcon(
                            icon: HugeIcons.strokeRoundedBubbleChat,
                            size: 14,
                            color: AppTheme.corporateBlue,
                          ),
                          SizedBox(width: 4),
                          Text(
                            'Chat',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.corporateBlue,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () async {
                      if (order.expertPhone.isNotEmpty) {
                        final Uri launchUri = Uri(
                          scheme: 'tel',
                          path: order.expertPhone,
                        );
                        if (await canLaunchUrl(launchUri)) {
                          await launchUrl(launchUri);
                        }
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: Colors.green.withOpacity(0.3),
                        ),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            LucideIcons.phone,
                            size: 14,
                            color: Colors.green,
                          ),
                          SizedBox(width: 4),
                          Text(
                            'Call',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: Colors.green,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                Text(
                  order.status == ServiceStatus.notInitialized ? '-' : dateStr,
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
