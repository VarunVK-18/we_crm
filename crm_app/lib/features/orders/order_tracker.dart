import 'package:crm_app/features/profile/my_entities_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:dropdown_button2/dropdown_button2.dart';
import '../../core/theme/app_theme.dart';
import '../../models/order_model.dart';
import 'order_chat_screen.dart';
import 'service_order_detail_screen.dart';
import '../../providers/orders_provider.dart';
import '../../core/widgets/we_loader.dart';
import '../../providers/notification_provider.dart';
import '../../providers/compliance_provider.dart';
import 'notification_sheet.dart';
import 'package:flutter_svg/flutter_svg.dart';

// ─── Tab definition ───────────────────────────────────────────────────────────

enum _ServiceTab { active, complete, notInitialized, history }

const _tabLabels = {
  _ServiceTab.active: 'Active',
  _ServiceTab.complete: 'Complete',
  _ServiceTab.notInitialized: 'Pending Registration',
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
  String _activeFilter = 'All';
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final ordersAsync = ref.watch(serviceOrdersProvider);
    var orders = ordersAsync.value ?? [];
    final isLoading = ordersAsync.isLoading && orders.isEmpty;
    final totalNotificationsCount = ref.watch(notificationProvider).length;

    final selectedEntity = ref.watch(selectedEntityProvider);

    // Build entity list using entityName (canonical key matching selectedEntityProvider)
    // Falls back to companyName if entityName is missing or equals 'Default'
    final entities = orders
        .map((o) {
          final en = o.entityName.trim();
          return (en.isNotEmpty && en != 'Default') ? en : o.companyName.trim();
        })
        .where((c) => c.isNotEmpty)
        .toSet()
        .toList()
        ..sort();

    // Prevent Dropdown assertion crash if selectedEntity is not yet in the list
    if (selectedEntity != 'All Entities' && !entities.contains(selectedEntity)) {
      entities.add(selectedEntity);
      entities.sort();
    }

    // Filter by selected entity — compare against both entityName and companyName
    // so we catch any mismatch in the data gracefully
    final entityFilteredRaw = selectedEntity == 'All Entities'
        ? orders
        : orders.where((o) {
            final en = o.entityName.trim();
            final cn = o.companyName.trim();
            return en.toLowerCase() == selectedEntity.toLowerCase() ||
                cn.toLowerCase() == selectedEntity.toLowerCase();
          }).toList();

    final entityFiltered = List<ServiceOrder>.from(entityFilteredRaw)
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

    final fullActiveList =
        entityFiltered.where((o) => o.status == ServiceStatus.active).toList();

    var activeList = fullActiveList;
    if (_activeFilter == 'Action Required') {
      activeList = activeList.where((o) => o.isReallyActionRequired).toList();
    } else if (_activeFilter == 'In Progress') {
      activeList = activeList.where((o) => !o.isReallyActionRequired).toList();
    }

    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      activeList = activeList
          .where((o) =>
              o.serviceType.toLowerCase().contains(q) ||
              o.entityName.toLowerCase().contains(q) ||
              o.companyName.toLowerCase().contains(q))
          .toList();
    }

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
      _ServiceTab.active: fullActiveList.length,
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
                  Stack(
                    children: [
                      IconButton(
                        onPressed: () {
                          // Clear notifications locally first for instant feedback
                          ref.read(notificationProvider.notifier).markAllAsRead();
                          showModalBottomSheet(
                            context: context,
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                            builder: (context) => const NotificationSheet(),
                          );
                        },
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(color: Colors.grey.shade200, width: 2.0),
                          ),
                          shadowColor: Colors.black.withValues(alpha: 0.06),
                          elevation: 2,
                        ),
                        icon: const Icon(
                          LucideIcons.bell,
                          size: 18,
                          color: AppTheme.deepTeal,
                        ),
                      ),
                      if (totalNotificationsCount > 0)
                        Positioned(
                          right: 4,
                          top: 4,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Colors.orange,
                              shape: BoxShape.circle,
                            ),
                            child: Text(
                              '$totalNotificationsCount',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                height: 1,
                              ),
                            ),
                          ),
                        ),
                    ],
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
                  border: Border.all(color: Colors.grey.shade200, width: 2.0),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 10,
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
                    DropdownButtonFormField2<String>(
                      isExpanded: true,
                      valueListenable: ValueNotifier(selectedEntity),
                      decoration: InputDecoration(
                        contentPadding: const EdgeInsets.symmetric(
                          vertical: 12,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      hint: const Text(
                        'All Entities',
                        style: TextStyle(fontSize: 14, color: Colors.grey),
                      ),
                      iconStyleData: const IconStyleData(
                        icon: Icon(
                          LucideIcons.chevronDown,
                          size: 18,
                          color: Colors.grey,
                        ),
                      ),
                      dropdownStyleData: DropdownStyleData(
                        elevation: 2,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.black26, width: 0.5),
                        ),
                      ),
                      menuItemStyleData: const MenuItemStyleData(
                        padding: EdgeInsets.symmetric(horizontal: 14),
                      ),
                      selectedItemBuilder: (BuildContext context) {
                        return [
                          const Text(
                            'All Entities',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w400),
                          ),
                          ...entities.map((e) => Text(
                                e,
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w400),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              )),
                        ];
                      },
                      items: [
                        DropdownItem<String>(
                          value: 'All Entities',
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'All Entities',
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w400),
                              ),
                              if (selectedEntity == 'All Entities')
                                const Icon(LucideIcons.check, size: 16, color: AppTheme.deepTeal),
                            ],
                          ),
                        ),
                        ...entities.map(
                          (e) => DropdownItem<String>(
                            value: e,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    e,
                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w400),
                                    maxLines: 3,
                                    overflow: TextOverflow.visible,
                                  ),
                                ),
                                if (selectedEntity == e)
                                  const Padding(
                                    padding: EdgeInsets.only(left: 8.0),
                                    child: Icon(LucideIcons.check, size: 16, color: AppTheme.deepTeal),
                                  ),
                              ],
                            ),
                          ),
                        ),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          ref.read(selectedEntityProvider.notifier).state = val;
                        }
                      },
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
                          border: Border.all(color: isSelected ? Colors.transparent : Colors.grey.shade200, width: 2.0),
                          boxShadow: [
                            BoxShadow(
                              color: isSelected
                                  ? AppTheme.deepTeal.withValues(alpha: 0.3)
                                  : Colors.black.withValues(alpha: 0.06),
                              blurRadius: isSelected ? 10 : 6,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Text(
                          '${_tabLabels[tab]}  ${count == 0 ? '0' : count.toString().padLeft(2, '0')}',
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

            if (_selectedTab == _ServiceTab.active)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        height: 42,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(25),
                          border: Border.all(color: Colors.grey.shade200, width: 2.0),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.06),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: TextField(
                          onChanged: (val) => setState(() => _searchQuery = val),
                          style: const TextStyle(fontSize: 13, color: AppTheme.deepTeal),
                          decoration: const InputDecoration(
                            hintText: 'Search services...',
                            hintStyle: TextStyle(fontSize: 13, color: Colors.grey),
                            prefixIcon: Icon(LucideIcons.search, size: 16, color: Colors.grey),
                            border: InputBorder.none,
                            focusedBorder: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            errorBorder: InputBorder.none,
                            disabledBorder: InputBorder.none,
                            contentPadding: EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      height: 42,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(25),
                        border: Border.all(color: Colors.grey.shade200, width: 2.0),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.06),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _activeFilter,
                          icon: const Icon(LucideIcons.chevronDown, size: 16, color: Colors.grey),
                          style: const TextStyle(fontSize: 13, color: AppTheme.deepTeal, fontWeight: FontWeight.w700),
                          items: const [
                            DropdownMenuItem(value: 'All', child: Text('All Active')),
                            DropdownMenuItem(value: 'Action Required', child: Text('Action Required')),
                            DropdownMenuItem(value: 'In Progress', child: Text('In Progress')),
                          ],
                          onChanged: (val) {
                            if (val != null) setState(() => _activeFilter = val);
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 16),

            // ── Service List or Empty State ─────────────────────────────────
            Expanded(
              child: isLoading
                  ? const Center(
                      child: WeLoader(size: 24),
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
                            padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
                            physics: const AlwaysScrollableScrollPhysics(),
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
    OrderStage.reqReceived: 'Request Received',
    OrderStage.testing: 'Testing',
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
          border: Border.all(color: Colors.grey.shade200, width: 2.0),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
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
                          Expanded(
                            child: Text(
                              order.entityName,
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey.shade500,
                              ),
                              overflow: TextOverflow.ellipsis,
                              maxLines: 1,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    if (order.isReallyActionRequired && isActive)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.orange.shade100,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.orange.shade300, width: 0.5),
                        ),
                        child: Text(
                          'Action Required',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: Colors.orange.shade900,
                          ),
                        ),
                      )
                    else
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
                          (order.serviceType == 'Private Limited Incorporation' && order.status == ServiceStatus.notInitialized) 
                              ? 'Registration Under Review' 
                              : (_stageLabels[order.stage] ?? ''),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: badgeColors.text,
                          ),
                        ),
                      ),
                  ],
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
                const SizedBox(width: 6),
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
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppTheme.corporateBlue.withOpacity(0.1),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppTheme.corporateBlue.withOpacity(0.3),
                        ),
                      ),
                      child: const HugeIcon(
                        icon: HugeIcons.strokeRoundedBubbleChat,
                        size: 16,
                        color: AppTheme.corporateBlue,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
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
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.1),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Colors.green.withOpacity(0.3),
                        ),
                      ),
                      child: const Icon(
                        LucideIcons.phone,
                        size: 16,
                        color: Colors.green,
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
                  const SizedBox(width: 4),
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
    final (Widget iconWidget, String message) = switch (tab) {
      _ServiceTab.active => (
          HugeIcon(icon: HugeIcons.strokeRoundedTask01, size: 52, color: Colors.grey.shade400),
          'No active services found',
        ),
      _ServiceTab.complete => (
          SvgPicture.asset(
            'assets/icons/party_popper.svg',
            width: 52,
            height: 52,
            colorFilter: ColorFilter.mode(Colors.grey.shade400, BlendMode.srcIn),
          ),
          'No completed services yet',
        ),
      _ServiceTab.notInitialized => (
          HugeIcon(icon: HugeIcons.strokeRoundedHourglass, size: 52, color: Colors.grey.shade400),
          'No pending services',
        ),
      _ServiceTab.history => (
          HugeIcon(icon: HugeIcons.strokeRoundedClock01, size: 52, color: Colors.grey.shade400),
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
            child: iconWidget,
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
