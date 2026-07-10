import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:convert';
import 'dart:ui';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/auth_provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../models/order_model.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import '../../core/constants/port.dart';
import '../../core/widgets/local_document_viewer.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/orders_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/notification_provider.dart';
import 'notification_sheet.dart';
import 'invoice_screen.dart';
import 'document_viewer_screen.dart';
import 'order_chat_screen.dart';
import '../profile/chat_support_screen.dart';
import 'incorp_form_screen.dart';
import 'dpiit_form_screen.dart';
import 'duns_form_screen.dart';
import 'trademark_form_screen.dart';
import 'itr_form_screen.dart';
import 'ce_rohs_form_screen.dart';
import 'llp_form_screen.dart';
import 'msme_form_screen.dart';
import 'gst_form_screen.dart';
import 'iso_form_screen.dart';
import 'fssai_form_screen.dart';
import 'dsc_form_screen.dart';
import 'opc_form_screen.dart';
import 'gst_compliance_form_screen.dart';
import 'mca_compliance_form_screen.dart';
import 'lei_form_screen.dart';
import 'bis_form_screen.dart';
import 'gst_cancellation_form_screen.dart';
import 'gst_filing_form_screen.dart';
import 'iec_form_screen.dart';
import 'patent_form_screen.dart';
import 'pf_form_screen.dart';
import 'proprietorship_form_screen.dart';
import 'tds_form_screen.dart';
import '../services/service_request_summary_sheet.dart';


class ServiceOrderDetailScreen extends ConsumerWidget {
  final ServiceOrder order;
  const ServiceOrderDetailScreen({super.key, required this.order});

  static const _stageLabels = {
    OrderStage.reqReceived: 'Requirement Received',
    OrderStage.workAssigned: 'Work Assigned',
    OrderStage.workInProgress: 'Work In Progress',
    OrderStage.testing: 'Under Review',
    OrderStage.completed: 'Completed',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final order = ref.watch(serviceOrdersProvider).value?.firstWhere((o) => o.id == this.order.id, orElse: () => this.order) ?? this.order;
    
    final unreadCount =
        ref.watch(notificationProvider).where((n) => !n.isRead).length;
    final completedSteps = order.steps.where((s) => s.isCompleted).length;
    final totalSteps = order.steps.length;
    final progress = order.progressValue;

    final user = ref.watch(userProfileProvider).value;
    final userManager = user?.manager;
    final clientManagerName = userManager?['name']?.toString() ?? 'Support Team';
    final clientManagerPhone = userManager?['phone']?.toString() ?? '+918000000000';
    
    final bool isObjectId = order.assignedExpert.length == 24 && RegExp(r'^[0-9a-fA-F]+$').hasMatch(order.assignedExpert);
    final expertName = (isObjectId || order.assignedExpert == 'To be assigned') ? 'To be assigned' : order.assignedExpert;
    final expertPhone = (order.expertPhone.isEmpty || order.expertPhone == order.assignedExpert) ? clientManagerPhone : order.expertPhone;

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      // ── Internal Chat FAB ────────────────────────────────────────────────
      floatingActionButton: order.status == ServiceStatus.active
          ? FloatingActionButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => OrderChatScreen(
                    orderId: order.id,
                    serviceName: order.serviceType,
                    assignedExpert: expertName,
                  ),
                ),
              ),
              backgroundColor: AppTheme.deepTeal,
              shape: const CircleBorder(),
              child: const Icon(LucideIcons.messageSquare, color: Colors.white),
            )
          : null,
      body: AnnotatedRegion<SystemUiOverlayStyle>(
        value: SystemUiOverlayStyle.light,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            // ── Hero Header ──────────────────────────────────────────────────
            SliverAppBar(
              expandedHeight: 235,
              pinned: true,
              stretch: true,
              elevation: 0,
              actions: [
                Stack(
                  alignment: Alignment.center,
                  children: [
                    IconButton(
                      onPressed: () {
                        ref.read(notificationProvider.notifier).markAllAsRead();
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (context) => const NotificationSheet(),
                        );
                      },
                      icon: const Icon(LucideIcons.bell,
                          color: Colors.white, size: 20),
                    ),
                    if (unreadCount > 0)
                      Positioned(
                        right: 8,
                        top: 12,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.orange,
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            '$unreadCount',
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
                const SizedBox(width: 8),
              ],
              backgroundColor: Colors.black,
              systemOverlayStyle: SystemUiOverlayStyle
                  .light, // Forces white status bar icons for this black header
              leading: IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(LucideIcons.arrowLeft,
                    color: Colors.white, size: 20),
              ),
              flexibleSpace: LayoutBuilder(
                builder: (context, constraints) {
                  final top = constraints.biggest.height;
                  final isCollapsed = top <=
                      kToolbarHeight + MediaQuery.paddingOf(context).top + 20;

                  return FlexibleSpaceBar(
                    titlePadding:
                        const EdgeInsets.only(left: 48, bottom: 16, right: 16),
                    title: AnimatedOpacity(
                      duration: const Duration(milliseconds: 200),
                      opacity: isCollapsed ? 1.0 : 0.0,
                      child: Text(
                        order.serviceType,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    stretchModes: const [StretchMode.zoomBackground],
                    background: Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFF0F172A), Colors.black],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      child: SafeArea(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              // Status chip and Application ID
                              Row(
                                children: [
                                  _StatusChip(status: order.status),
                                  if (order.details != null && order.details!['applicationId'] != null)
                                    Padding(
                                      padding: const EdgeInsets.only(left: 8.0),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withOpacity(0.1),
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(color: Colors.white.withOpacity(0.2)),
                                        ),
                                        child: Row(
                                          children: [
                                            const Icon(LucideIcons.tag, color: Colors.white70, size: 12),
                                            const SizedBox(width: 4),
                                            Text(
                                              '${order.details!['applicationId']}',
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 11,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(
                                order.serviceType,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -0.5,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                order.companyName,
                                style: TextStyle(
                                  color: Colors.white.withOpacity(0.65),
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 16),
                              // Progress bar
                              ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: LinearProgressIndicator(
                                  value: progress,
                                  backgroundColor:
                                      Colors.white.withOpacity(0.12),
                                  valueColor:
                                      const AlwaysStoppedAnimation<Color>(
                                          Colors.greenAccent),
                                  minHeight: 5,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                '$completedSteps of $totalSteps steps completed',
                                style: TextStyle(
                                  color: Colors.white.withOpacity(0.55),
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ), // Closes Container (background)
                  ); // Closes FlexibleSpaceBar
                },
              ),
            ),

            // ── Body ─────────────────────────────────────────────────────────
            SliverList(
              delegate: SliverChildListDelegate([
                const SizedBox(height: 24),

                if (order.isPaymentPending && order.status != ServiceStatus.complete) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      margin: const EdgeInsets.only(bottom: 24),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFFBEB),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFFEF3C7), width: 1.5),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.02),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(LucideIcons.alertTriangle, color: Color(0xFFD97706), size: 20),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Pending Payment Required',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w800,
                                        color: Color(0xFF92400E),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'The service has been completed successfully, but there is a pending payment of ₹${(order.dealClosedAmount - order.advanceAmountPaid).toStringAsFixed(0)}. Please contact support to settle the balance and unlock the progress steps.',
                                      style: const TextStyle(
                                        fontSize: 13,
                                        color: Color(0xFFB45309),
                                        height: 1.4,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Padding(
                            padding: const EdgeInsets.only(left: 32),
                            child: FilledButton.icon(
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => const ChatSupportScreen(),
                                  ),
                                );
                              },
                              icon: const Icon(LucideIcons.headset, size: 16),
                              label: Text('Contact Support (₹${(order.dealClosedAmount - order.advanceAmountPaid).toStringAsFixed(0)})'),
                              style: FilledButton.styleFrom(
                                backgroundColor: const Color(0xFFD97706),
                                foregroundColor: Colors.white,
                                textStyle: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],

                // Info row
                _InfoRow(order: order, expertName: expertName),

                const SizedBox(height: 24),


                if (order.notes.isNotEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.amber.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(16),
                        border:
                            Border.all(color: Colors.amber.withOpacity(0.3)),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(LucideIcons.info,
                              color: Colors.amber, size: 20),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Notes',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFFB45309),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  order.notes,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: Color(0xFF78350F),
                                    height: 1.4,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                ],

                if (order.details['directors'] != null && order.details['directors'] is List && (order.details['directors'] as List).isNotEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Director Details',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.deepTeal,
                            letterSpacing: -0.3,
                          ),
                        ),
                        const SizedBox(height: 12),
                        ...(order.details['directors'] as List).asMap().entries.map((entry) {
                          final idx = entry.key + 1;
                          final dir = entry.value is Map ? entry.value as Map : {};
                          final name = dir['directorName']?.toString() ?? dir['name']?.toString() ?? dir['fullName']?.toString() ?? 'Name not specified';
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(12),
                              onTap: () {
                                showModalBottomSheet(
                                  context: context,
                                  isScrollControlled: true,
                                  backgroundColor: Colors.transparent,
                                  builder: (context) {
                                    bool showAll = false;
                                    return StatefulBuilder(
                                      builder: (context, setState) {
                                        return Container(
                                          width: double.infinity,
                                          decoration: const BoxDecoration(
                                            color: Colors.white,
                                            borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
                                          ),
                                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
                                          child: Column(
                                            mainAxisSize: MainAxisSize.min,
                                            crossAxisAlignment: CrossAxisAlignment.stretch,
                                            children: [
                                              Center(
                                                child: Container(
                                                  width: 40,
                                                  height: 4,
                                                  decoration: BoxDecoration(
                                                    color: Colors.grey.shade300,
                                                    borderRadius: BorderRadius.circular(2),
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(height: 24),
                                              Text(
                                                'Director $idx Details',
                                                textAlign: TextAlign.center,
                                                style: const TextStyle(
                                                  fontSize: 20,
                                                  fontWeight: FontWeight.w900,
                                                  color: AppTheme.deepTeal,
                                                ),
                                              ),
                                              const SizedBox(height: 32),
                                              Padding(
                                                padding: const EdgeInsets.only(bottom: 16),
                                                child: Row(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Expanded(
                                                      flex: 2,
                                                      child: Text(
                                                        'NAME',
                                                        style: TextStyle(fontSize: 12, color: Colors.grey.shade600, height: 1.4),
                                                      ),
                                                    ),
                                                    const SizedBox(width: 12),
                                                    Expanded(
                                                      flex: 3,
                                                      child: Text(
                                                        name,
                                                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppTheme.deepTeal),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                              ...dir.entries.map((e) {
                                                if (['directorName', 'name', 'fullName', '_id'].contains(e.key)) return const SizedBox.shrink();
                                                
                                                final isBasicField = ['email', 'phone', 'phonenumber', 'mobile'].contains(e.key.toLowerCase());
                                                if (!showAll && !isBasicField) return const SizedBox.shrink();
                                                
                                                String valStr = e.value?.toString() ?? '';
                                                if (valStr.isEmpty) return const SizedBox.shrink();
                                                
                                                String formattedKey = e.key.replaceAllMapped(RegExp(r'([a-z])([A-Z])'), (match) => '${match.group(1)} ${match.group(2)}').toUpperCase();
                                                if (e.key.toLowerCase() == 'shareholding') {
                                                  formattedKey = 'SHARE HOLDING PERCENTAGE';
                                                  if (!valStr.contains('%')) {
                                                    valStr += '%';
                                                  }
                                                }
                                                
                                                return Padding(
                                                  padding: const EdgeInsets.only(bottom: 16),
                                                  child: Row(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      Expanded(
                                                        flex: 2,
                                                        child: Text(
                                                          formattedKey,
                                                          style: TextStyle(fontSize: 12, color: Colors.grey.shade600, height: 1.4),
                                                        ),
                                                      ),
                                                      const SizedBox(width: 12),
                                                      Expanded(
                                                        flex: 3,
                                                        child: Text(
                                                          valStr,
                                                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppTheme.deepTeal),
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                );
                                              }),
                                              if (!showAll && dir.keys.any((k) => !['directorName', 'name', 'fullName', '_id', 'email', 'phone', 'phonenumber', 'mobile'].contains(k.toLowerCase())))
                                                Padding(
                                                  padding: const EdgeInsets.only(top: 16),
                                                  child: Center(
                                                    child: TextButton.icon(
                                                      onPressed: () {
                                                        setState(() {
                                                          showAll = true;
                                                        });
                                                      },
                                                      icon: const Icon(LucideIcons.chevronDown, size: 16, color: AppTheme.corporateBlue),
                                                      label: const Text('View All Details', style: TextStyle(fontSize: 12, color: AppTheme.corporateBlue, fontWeight: FontWeight.w500, height: 1.4)),
                                                    ),
                                                  ),
                                                ),
                                              SizedBox(height: MediaQuery.of(context).padding.bottom + 16),
                                            ],
                                          ),
                                        );
                                      }
                                    );
                                  },
                                );
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: Colors.grey.withOpacity(0.2)),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(LucideIcons.user, size: 16, color: AppTheme.deepTeal),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        'Director $idx: $name',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.deepTeal,
                                        ),
                                      ),
                                    ),
                                    const Icon(LucideIcons.chevronRight, size: 16, color: Colors.grey),
                                  ],
                                ),
                              ),
                            ),
                          );
                        }),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ],

                Builder(
                  builder: (context) {
                    final customInputSteps = order.steps.where((s) => s.hasCustomInput && s.customInputValue.isNotEmpty).toList();

                    final progressContent = Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (order.dealClosedAmount > order.advanceAmountPaid && !order.isPaymentPending)
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 24).copyWith(bottom: 16),
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFFBEB),
                                border: Border.all(color: const Color(0xFFFDE68A)),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(Icons.warning_amber_rounded, color: Color(0xFFD97706)),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('Outstanding Balance Notice', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFB45309))),
                                        const SizedBox(height: 4),
                                        Text('You have a remaining balance of ₹${(order.dealClosedAmount - order.advanceAmountPaid).toStringAsFixed(0)}. Please note that the final deliverables will be locked upon service completion until the balance is settled.', style: const TextStyle(fontSize: 13, color: Color(0xFF92400E))),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        if (customInputSteps.isNotEmpty) ...[
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 24),
                            child: Container(
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.02),
                                    blurRadius: 15,
                                    offset: const Offset(0, 5),
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const Text(
                                        'Service Information',
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w900,
                                          color: AppTheme.deepTeal,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 16),
                                  ...customInputSteps.map((step) => Padding(
                                    padding: const EdgeInsets.only(bottom: 12),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          '${step.customInputLabel}:  ',
                                          style: const TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.black54,
                                          ),
                                        ),
                                        Expanded(
                                          child: step.customInputValue.isNotEmpty
                                              ? Align(
                                                  alignment: Alignment.centerLeft,
                                                  child: Container(
                                                    child: Text(
                                                      step.customInputValue,
                                                      style: const TextStyle(
                                                        fontSize: 13,
                                                        fontWeight: FontWeight.bold,
                                                        color: Color(0xFF0369a1),
                                                      ),
                                                    ),
                                                  ),
                                                )
                                              : Text(
                                                  'Awaiting details...',
                                                  style: TextStyle(
                                                    fontSize: 13,
                                                    color: Colors.grey.shade500,
                                                    fontStyle: FontStyle.italic,
                                                  ),
                                                ),
                                        ),
                                      ],
                                    ),
                                  )).toList(),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                        ],
                        // Section title
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Row(
                            children: [
                              const Text(
                                'Service Progress',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  color: AppTheme.deepTeal,
                                  letterSpacing: -0.3,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Container(
                                  height: 1,
                                  color: Colors.grey.withOpacity(0.1),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),
                        // Step-by-step timeline
                        if (order.steps.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 24),
                            child: _StepTimeline(order: order, steps: order.steps),
                          )
                        else
                          const _EmptySteps(),
                        const SizedBox(height: 40),
                        // Current stage chip
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.04),
                                  blurRadius: 15,
                                  offset: const Offset(0, 5),
                                ),
                              ],
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: AppTheme.deepTeal.withOpacity(0.08),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(LucideIcons.clipboardList,
                                      color: AppTheme.deepTeal, size: 20),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Current Stage',
                                        style: TextStyle(fontSize: 12, color: Colors.grey),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        _stageLabels[order.stage] ?? order.stage.name,
                                        style: const TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w800,
                                          color: AppTheme.deepTeal,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const Icon(LucideIcons.trendingUp,
                                    color: Color.fromARGB(255, 66, 126, 68), size: 20),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),

                        if (order.temporaryDocuments.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 24),
                            child: _TemporaryDocumentsSection(order: order),
                          ),
                        const SizedBox(height: 20),
                        // Requested Documents
                        if (order.requestedDocuments.isNotEmpty &&
                            order.status != ServiceStatus.complete)
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 24),
                            child: _RequestedDocumentsSection(order: order),
                          ),
                        if (order.status == ServiceStatus.complete && order.steps.isNotEmpty && order.steps.last.isCompleted) ...[
                          const SizedBox(height: 32),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 24),
                            child: _FinalDeliverySection(order: order),
                          ),
                        ],
                        if (order.serviceType == 'Private Limited Incorporation' &&
                            order.status != ServiceStatus.notInitialized &&
                            order.details['directors'] != null &&
                            order.details['directors'] != '[]' &&
                            (order.details['directors'] is String || order.details['directors'] is List) &&
                            order.details['directors'] != 'submitted') ...[
                          const SizedBox(height: 32),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 24),
                            child: _DirectorDetailsSection(order: order),
                          ),
                        ],
                        const SizedBox(height: 80), // space for FAB
                      ],
                    );

                    if (order.isPaymentPending && order.status == ServiceStatus.complete) {
                      return Stack(
                        alignment: Alignment.topCenter,
                        children: [
                          IgnorePointer(
                            child: ImageFiltered(
                              imageFilter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
                              child: Opacity(
                                opacity: 0.7,
                                child: progressContent,
                              ),
                            ),
                          ),
                          Container(
                            margin: const EdgeInsets.only(top: 40, left: 16, right: 16),
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(24),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.1),
                                  blurRadius: 20,
                                  offset: const Offset(0, 10),
                                ),
                              ],
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: Colors.orange.withOpacity(0.1),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(LucideIcons.alertTriangle, color: Colors.orange, size: 32),
                                ),
                                const SizedBox(height: 20),
                                const Text(
                                  'Final Payment Required',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                    color: AppTheme.deepTeal,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  'The service has been completed successfully. Please clear your pending balance of ₹${(order.dealClosedAmount - order.advanceAmountPaid).toStringAsFixed(0)}.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.grey.shade700,
                                    height: 1.5,
                                  ),
                                ),
                                const SizedBox(height: 24),
                                SizedBox(
                                  width: double.infinity,
                                  child: FilledButton.icon(
                                    onPressed: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => const ChatSupportScreen(),
                                        ),
                                      );
                                    },
                                    icon: const Icon(LucideIcons.headset, size: 18),
                                    label: const Text('Contact Support'),
                                    style: FilledButton.styleFrom(
                                      backgroundColor: AppTheme.deepTeal,
                                      padding: const EdgeInsets.symmetric(vertical: 16),
                                      textStyle: const TextStyle(fontWeight: FontWeight.w500),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      );
                    }

                    return progressContent;
                  },
                ),
              ]),
            ),
          ],
        ),
      ),
    );
  }
}


// ─── Temporary Documents Section ──────────────────────────────────────────────

class _TemporaryDocumentsSection extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const _TemporaryDocumentsSection({required this.order});

  @override
  ConsumerState<_TemporaryDocumentsSection> createState() => _TemporaryDocumentsSectionState();
}

class _TemporaryDocumentsSectionState extends ConsumerState<_TemporaryDocumentsSection> {
  bool _isUploading = false;

  Future<void> _downloadDoc(String? docId, String docName) async {
    if (docId == null) return;
    try {
      final url = Uri.parse('$kBaseUrl/api/documents/$docId');
      if (await canLaunchUrl(url)) {
        await launchUrl(url, mode: LaunchMode.externalApplication);
      } else {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not open document')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Error downloading document')));
    }
  }

  Future<void> _uploadReply(String docId) async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
      );

      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        if (file.path == null) return;

        setState(() {
          _isUploading = true;
        });

        final uid = ref.read(authStateProvider).value?.uid;
        if (uid == null) throw Exception('Not authenticated');

        var request = http.MultipartRequest(
          'POST',
          Uri.parse('$kBaseUrl/api/checklists/${widget.order.id}/temporary-documents/$docId/reply'),
        );
        request.headers['x-user-id'] = uid;
        request.files.add(await http.MultipartFile.fromPath('reply_file', file.path!));

        final response = await request.send();
        final responseData = await response.stream.bytesToString();
        final data = jsonDecode(responseData);

        if (response.statusCode == 200 && data['success'] == true) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Reply uploaded successfully!')),
            );
          }
        } else {
          throw Exception(data['message'] ?? 'Failed to upload reply');
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUploading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 6,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Action Required',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Please review the documents below and provide a signed copy if needed.',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.black54,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: widget.order.temporaryDocuments.map((doc) {
                final isReplied = doc.status == 'replied';
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: Colors.grey.shade300),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(LucideIcons.fileText, color: Colors.grey.shade700, size: 20),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              doc.name,
                              style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 15, color: Colors.black87),
                            ),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: isReplied ? Colors.green.shade50 : Colors.yellow.shade100,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    isReplied ? LucideIcons.checkCircle2 : LucideIcons.moreHorizontal,
                                    size: 12,
                                    color: isReplied ? Colors.green.shade700 : Colors.black87,
                                  ),
                                  const SizedBox(width: 4),
                                  Flexible(
                                    child: Text(
                                      isReplied ? 'Replied' : 'Pending Review',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: isReplied ? Colors.green.shade700 : Colors.black87,
                                        fontWeight: FontWeight.w500,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                SizedBox(
                                  height: 38,
                                  child: OutlinedButton.icon(
                                    icon: const Icon(LucideIcons.download, size: 16, color: Colors.black87),
                                    label: const Text('View Original', style: TextStyle(color: Colors.black87, fontSize: 13)),
                                    onPressed: () => _downloadDoc(doc.documentId, doc.name),
                                    style: OutlinedButton.styleFrom(
                                      side: BorderSide(color: Colors.grey.shade300),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                                    ),
                                  ),
                                ),
                                if (isReplied && doc.replyDocumentId != null)
                                  SizedBox(
                                    height: 38,
                                    child: OutlinedButton.icon(
                                      icon: Icon(LucideIcons.download, size: 16, color: Colors.green.shade700),
                                      label: Text('View Reply', style: TextStyle(color: Colors.green.shade700, fontSize: 13)),
                                      onPressed: () => _downloadDoc(doc.replyDocumentId, 'Reply: ' + doc.name),
                                      style: OutlinedButton.styleFrom(
                                        side: BorderSide(color: Colors.green.shade200),
                                        backgroundColor: Colors.green.shade50,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                                      ),
                                    ),
                                  ),
                                if (!isReplied)
                                  _isUploading
                                      ? const SizedBox(
                                          width: 38,
                                          height: 38,
                                          child: Padding(
                                            padding: EdgeInsets.all(8.0),
                                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black87),
                                          ),
                                        )
                                      : SizedBox(
                                          height: 38,
                                          child: ElevatedButton.icon(
                                            icon: const Icon(LucideIcons.upload, size: 16, color: Colors.white),
                                            label: const Text('Reply', style: TextStyle(color: Colors.white, fontSize: 13)),
                                            onPressed: () => _uploadReply(doc.id),
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: const Color(0xFF0F172A),
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                                              elevation: 0,
                                            ),
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
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Requested Documents Section ──────────────────────────────────────────────

class _RequestedDocumentsSection extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const _RequestedDocumentsSection({required this.order});

  @override
  ConsumerState<_RequestedDocumentsSection> createState() => _RequestedDocumentsSectionSectionState();
}

class _RequestedDocumentsSectionSectionState extends ConsumerState<_RequestedDocumentsSection> {
  final Set<int> _uploadingDocs = {};
  final Set<int> _uploadedDocs = {};

  Future<void> _uploadDocument(String docName, int index) async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
      );

      if (result != null && result.files.single.path != null) {
        final filePath = result.files.single.path!;
        final fileName = result.files.single.name;
        final fileSize = result.files.single.size;

        if (fileSize > 2 * 1024 * 1024) {
          if (!context.mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Warning: File is large. Max 2MB allowed')),
          );
          return;
        }

        if (!context.mounted) return;
        final shouldUpload = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            backgroundColor: Colors.white,
            surfaceTintColor: Colors.transparent,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(LucideIcons.fileSearch, color: Colors.blue.shade700, size: 20),
                ),
                const SizedBox(width: 12),
                const Text('Review Document',
                    style: TextStyle(
                        fontSize: 18,
                        color: AppTheme.deepTeal, 
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.3)),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Selected File:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(LucideIcons.fileText, color: Colors.grey.shade600, size: 18),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          fileName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.black87),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                OutlinedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => LocalDocumentViewer(filePath: filePath),
                      ),
                    );
                  },
                  icon: const Icon(LucideIcons.eye, size: 16),
                  label: const Text('Preview Content'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.corporateBlue,
                    minimumSize: const Size(double.infinity, 44),
                    side: const BorderSide(color: AppTheme.corporateBlue, width: 1.5),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                  ),
                ),
              ],
            ),
            actionsPadding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                style: TextButton.styleFrom(
                  foregroundColor: Colors.grey.shade700,
                  textStyle: const TextStyle(fontWeight: FontWeight.w700),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(context, true),
                style: FilledButton.styleFrom(
                  backgroundColor: AppTheme.deepTeal,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  textStyle: const TextStyle(fontWeight: FontWeight.w800),
                ),
                child: const Text('Upload Document'),
              ),
            ],
          ),
        );

        if (shouldUpload != true) return;

        setState(() {
          _uploadingDocs.add(index);
        });

        final uri =
            Uri.parse('$kBaseUrl/api/checklists/${widget.order.id}/upload-documents');

        final request = http.MultipartRequest('POST', uri);
        request.fields['docName'] = docName;
        request.fields['docIndex'] = index.toString();
        request.files.add(await http.MultipartFile.fromPath('file', filePath));

        final uid = ref.read(authStateProvider).value?.uid;
        if (uid != null) {
          request.headers['x-user-id'] = uid;
        }

        final response = await request.send();
        final respStr = await response.stream.bytesToString();

        if (!context.mounted) return;

        if (response.statusCode == 200) {
          setState(() {
            _uploadingDocs.remove(index);
            _uploadedDocs.add(index);
          });
          
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (context) => AlertDialog(
              backgroundColor: Colors.white,
              surfaceTintColor: Colors.transparent,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Row(
                children: [
                  Icon(LucideIcons.checkCircle2, color: Colors.green),
                  SizedBox(width: 10),
                  Text('Success'),
                ],
              ),
              content: const Text('Successfully uploaded document.'),
              actions: [
                FilledButton(
                  onPressed: () => Navigator.pop(context),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.deepTeal,
                  ),
                  child: const Text('OK'),
                )
              ]
            )
          );
          ref.invalidate(serviceOrdersProvider);
        } else {
          setState(() {
            _uploadingDocs.remove(index);
          });
          debugPrint("Upload failed: ${response.statusCode} - $respStr");
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed: $respStr')),
          );
        }
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _uploadingDocs.remove(index);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Requested Documents',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: AppTheme.deepTeal,
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: 16),
        ...widget.order.requestedDocuments
            .where((doc) => !doc.name.startsWith('director_'))
            .toList()
            .asMap()
            .entries
            .map((entry) {
          final index = entry.key;
          final doc = entry.value;
          final isLocallyUploaded = doc.isUploaded || _uploadedDocs.contains(index);
          final isUploading = _uploadingDocs.contains(index);

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Row(
              children: [
                HugeIcon(
                  icon: isLocallyUploaded
                      ? HugeIcons.strokeRoundedTaskDone02
                      : HugeIcons.strokeRoundedTaskAdd02,
                  color: isLocallyUploaded ? Colors.green : const Color.fromARGB(255, 10, 2, 2),
                  size: 24.0,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        doc.name,
                        style: const TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 14),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        isLocallyUploaded ? 'Uploaded' : 'Action Required',
                        style: TextStyle(
                          color: isLocallyUploaded ? Colors.green : const Color.fromARGB(255, 244, 67, 54),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (doc.notes != null && doc.notes!.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.amber.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(
                                color: Colors.amber.withOpacity(0.3)),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(LucideIcons.info,
                                  size: 12, color: Colors.amber),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  'Note: ${doc.notes}',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.amber.shade900,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                if (!isLocallyUploaded)
                  isUploading
                      ? const SizedBox(
                          width: 32,
                          height: 32,
                          child: CircularProgressIndicator(strokeWidth: 3),
                        )
                      : FilledButton.icon(
                          onPressed: () => _uploadDocument(doc.name, index),
                          icon: const Icon(LucideIcons.uploadCloud, size: 14,color: Colors.white,),
                          label: const Text('Upload',
                              style: TextStyle(
                                  fontSize: 12, fontWeight: FontWeight.w600,color: Colors.white)),
                          style: FilledButton.styleFrom(
                            backgroundColor: const Color.fromARGB(255, 11, 6, 7),
                            foregroundColor: const Color.fromARGB(255, 0, 0, 0),
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                                side: BorderSide(
                                    color: const Color.fromARGB(255, 158, 157, 157), width: 1)),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 0),
                            minimumSize: const Size(0, 32),
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                        ),
              ],
            ),
          );
        }),
      ],
    );
  }
}

// ─── Info Row ────────────────────────────────────────────────────────────────

class _InfoRow extends StatelessWidget {
  final ServiceOrder order;
  final String expertName;
  const _InfoRow({required this.order, required this.expertName});

  @override
  Widget build(BuildContext context) {
    final dateStr = DateFormat('dd MMM yyyy').format(order.createdAt);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Row(
        children: [
          Expanded(
            child: _InfoTile(
              icon: LucideIcons.user,
              label: 'Expert',
              value: expertName,
            ),
          ),

          const SizedBox(width: 12),
          Expanded(
            child: _InfoTile(
              icon: LucideIcons.calendar,
              label: 'Started',
              value:
                  order.status == ServiceStatus.notInitialized ? '-' : dateStr,
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _InfoTile(
      {required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: AppTheme.corporateBlue),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
          const SizedBox(height: 2),
          Text(
            value,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: AppTheme.deepTeal,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Step Timeline ───────────────────────────────────────────────────────────

class _StepTimeline extends StatelessWidget {
  final ServiceOrder order;
  final List<ServiceStep> steps;
  const _StepTimeline({required this.order, required this.steps});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(steps.length, (i) {
        final step = steps[i];
        final isLast = i == steps.length - 1;
        final isCompleted = step.isCompleted;

        // Determine connector color: green if the NEXT step is done, grey otherwise
        final connectorDone =
            !isLast && steps[i + 1].isCompleted || isCompleted;

        return IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Left: dot + connector line
              SizedBox(
                width: 36,
                child: Column(
                  children: [
                    // Dot
                    Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isCompleted ? Colors.green : Colors.white,
                        border: Border.all(
                          color:
                              isCompleted ? Colors.green : Colors.grey.shade300,
                          width: 2,
                        ),
                        boxShadow: isCompleted
                            ? [
                                BoxShadow(
                                  color: Colors.green.withOpacity(0.25),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                )
                              ]
                            : [],
                      ),
                      child: Icon(
                        isCompleted ? LucideIcons.check : LucideIcons.circle,
                        size: 13,
                        color:
                            isCompleted ? Colors.white : Colors.grey.shade400,
                      ),
                    ),
                    // Connector line (hidden for last)
                    if (!isLast)
                      Expanded(
                        child: Container(
                          width: 2,
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          decoration: BoxDecoration(
                            color: connectorDone
                                ? Colors.green.withOpacity(0.4)
                                : Colors.grey.shade200,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                  ],
                ),
              ),

              const SizedBox(width: 14),

              // Right: step content card
              Expanded(
                child: Padding(
                  padding: EdgeInsets.only(bottom: isLast ? 0 : 36),
                  child: InkWell(
                    onTap: (_shouldShowFillForm(step, order) && 
                        !isCompleted && 
                        order.stage != OrderStage.reqReceived && 
                        order.status == ServiceStatus.active)
                        ? () => _routeToForm(context, order)
                        : null,
                    borderRadius: BorderRadius.circular(18),
                    child: Container(
                      padding: const EdgeInsets.all(0),
                      decoration: BoxDecoration(
                        color: Colors.transparent,


                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  step.title,
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w800,
                                    color: isCompleted
                                        ? Colors.green.shade700
                                        : AppTheme.deepTeal,
                                  ),
                                ),
                              ),
                              // Removed top timestamp to match web (bottom only)
                            ],
                          ),
                          if (step.description.isNotEmpty) ...[
                            const SizedBox(height: 6),
                            Text(
                              step.description,
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey.shade600,
                                height: 1.4,
                              ),
                            ),
                          ],
                          if (step.hasCustomInput) ...[
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                const Icon(LucideIcons.info, size: 13, color: AppTheme.corporateBlue),
                                const SizedBox(width: 4),
                                Text(
                                  '${step.customInputLabel}: ',
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
                                ),
                                if (step.customInputValue.isNotEmpty)
                                  Container(
                                    child: Text(
                                      step.customInputValue,
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color.fromARGB(255, 0, 0, 0)),
                                    ),
                                  )
                                else
                                  Text(
                                    'Awaiting details...',
                                    style: TextStyle(fontSize: 11, color: Colors.grey.shade500, fontStyle: FontStyle.italic),
                                  ),
                              ],
                            ),
                          ],
                          if (isCompleted) ...[
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(LucideIcons.checkCircle2,
                                    size: 12, color: Colors.green),
                                const SizedBox(width: 4),
                                Text(
                                  'Completed on',
                                  style: TextStyle(
                                      fontSize: 11,
                                      color: Colors.green.shade600,
                                      fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(width: 6),
                                if (step.completedAt != null || order.createdAt != null)
                                  Text(
                                    DateFormat('dd MMM yyyy, hh:mm a').format(step.completedAt ?? order.createdAt ?? DateTime.now()),
                                    style: TextStyle(
                                        fontSize: 11,
                                        color: Colors.green.shade600,
                                        fontWeight: FontWeight.w700),
                                  ),
                              ],
                            ),
                          ] else if (_shouldShowFillForm(step, order) && order.stage != OrderStage.reqReceived) ...[
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Icon(LucideIcons.mousePointerClick,
                                    size: 14, color: order.status == ServiceStatus.active ? AppTheme.corporateBlue : Colors.grey),
                                const SizedBox(width: 4),
                                Text(
                                  order.status == ServiceStatus.active ? 'Tap to complete form' : 'Action Locked (Pending Assignment)',
                                  style: TextStyle(
                                      fontSize: 11,
                                      color: order.status == ServiceStatus.active ? AppTheme.corporateBlue : Colors.grey,
                                      fontWeight: FontWeight.w800),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}

// ─── Empty Steps ─────────────────────────────────────────────────────────────

class _EmptySteps extends StatelessWidget {
  const _EmptySteps();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
      child: Center(
        child: Column(
          children: [
            Icon(LucideIcons.listTodo,
                size: 48, color: Colors.grey.withOpacity(0.3)),
            const SizedBox(height: 12),
            Text(
              'Steps will appear once your service is processed.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Status Chip ─────────────────────────────────────────────────────────────

class _StatusChip extends StatelessWidget {
  final ServiceStatus status;
  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      ServiceStatus.active => ('Active', Colors.greenAccent),
      ServiceStatus.complete => ('Completed', Colors.lightBlueAccent),
      ServiceStatus.notInitialized => ('Not Initialized', Colors.orangeAccent),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.4)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}

// ─── Final Delivery Section ───────────────────────────────────────────────────

class _FinalDeliverySection extends StatelessWidget {
  final ServiceOrder order;
  const _FinalDeliverySection({required this.order});

  Future<void> _downloadDocument(
      BuildContext context, String documentId, String documentName) async {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => DocumentViewerScreen(
          documentId: documentId,
          documentName: documentName,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Final Deliverables',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: AppTheme.deepTeal,
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: 16),

        // Final Documents
        ...order.finalDocuments
            .where((doc) => !doc.name.startsWith('director_'))
            .map((doc) {
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.green.withOpacity(0.3)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () =>
                    _downloadDocument(context, doc.documentId, doc.name),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.green.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(LucideIcons.fileCheck2,
                            color: Colors.green, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              doc.name,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w700, fontSize: 14),
                            ),
                            if (doc.expiryDate != null) ...[
                              const SizedBox(height: 4),
                              Text(
                                'Expires: ${DateFormat('dd MMM yyyy').format(doc.expiryDate!)}',
                                style: TextStyle(
                                    color: Colors.red.shade400,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const Icon(LucideIcons.download,
                          color: Colors.green, size: 20),
                    ],
                  ),
                ),
              ),
            ),
          );
        }),

      ],
    );
  }
}

class _DirectorDetailsSection extends StatelessWidget {
  final ServiceOrder order;
  const _DirectorDetailsSection({required this.order});

  @override
  Widget build(BuildContext context) {
    List<dynamic> directors = [];
    try {
      if (order.details['directors'] is String) {
        directors = jsonDecode(order.details['directors']);
      } else {
        directors = order.details['directors'] ?? [];
      }
    } catch (e) {
      directors = [];
    }

    if (directors.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Director Details',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: AppTheme.deepTeal,
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: 16),
        ...directors.asMap().entries.map((entry) {
          final index = entry.key;
          final dir = entry.value;
          final directorPrefix = 'director_${index + 1}_';

          final docs = order.requestedDocuments
              .where((d) => d.name.startsWith(directorPrefix))
              .toList();

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () {
                  _showDirectorDetailsSheet(context, index, dir, docs, directorPrefix);
                },
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppTheme.corporateBlue.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(LucideIcons.user, color: AppTheme.corporateBlue, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Director ${index + 1}',
                              style: const TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Text(
                                  dir['name'] ?? 'Unknown',
                                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppTheme.deepTeal),
                                ),
                                if (index == 0 && (dir['isAuthSignatory'] == 'Yes' || dir['isAuthorized'] == 'Yes')) ...[
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: Colors.blue.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(4),
                                      border: Border.all(color: Colors.blue.withOpacity(0.3)),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(LucideIcons.checkCircle2, size: 10, color: Colors.blue[700]),
                                        const SizedBox(width: 4),
                                        Text('Authorized Signatory', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.blue[700])),
                                      ],
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                      const Icon(LucideIcons.chevronRight, color: Colors.grey, size: 20),
                    ],
                  ),
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  void _showDirectorDetailsSheet(BuildContext context, int index, dynamic dir, List<dynamic> docs, String directorPrefix) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Director ${index + 1}: ${dir['name'] ?? 'Unknown'}',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: AppTheme.deepTeal,
              ),
            ),
            const SizedBox(height: 24),
            _buildDetailRow('Father\'s Name', dir['fathersName']),
            _buildDetailRow('Date of Birth', dir['dob']),
            _buildDetailRow('Place of Birth', dir['placeOfBirth']),
            _buildDetailRow('Educational Qual.', dir['educationalQualification']),
            _buildDetailRow('Occupation', dir['occupation']),
            const SizedBox(height: 24),
            const Text(
              'Documents',
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 16,
                color: AppTheme.deepTeal,
              ),
            ),
            const SizedBox(height: 12),
            if (docs.isEmpty)
              const Text('No documents uploaded', style: TextStyle(fontSize: 14, color: Colors.grey))
            else
              ...docs.map((d) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Icon(
                            d.isUploaded
                                ? LucideIcons.checkCircle2
                                : LucideIcons.xCircle,
                            color: d.isUploaded ? Colors.green : Colors.red,
                            size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                            child: Text(
                                d.name.replaceFirst(directorPrefix, ''),
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500))),
                      ],
                    ),
                  )),
            SizedBox(height: MediaQuery.of(context).padding.bottom + 16),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String? value) {
    if (value == null || value.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label,
                style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.w500)),
          ),
          Expanded(
            child: Text(value,
                style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.deepTeal)),
          ),
        ],
      ),
    );
  }
}

bool _shouldShowFillForm(ServiceStep step, ServiceOrder order) {
  if (!step.isActionStep) return false;
  if (step.title != 'Client Form Filling') return true;
  final hasProvideDetails = order.steps.any((s) => s.title == 'Provide Necessary Details & Documents');
  return !hasProvideDetails;
}

void _routeToForm(BuildContext context, ServiceOrder order) {
  final WidgetRef? ref = null; // Note: In a real app, retrieve ref via context or ConsumerState

  if (order.serviceType.toLowerCase().contains('duns')) {
      Navigator.push(context, MaterialPageRoute(builder: (_) => DunsFormScreen(order: order)));
    } else if (order.serviceType.toLowerCase().contains('dpiit')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => DpiitFormScreen(order: order)));
  } else if (order.serviceType.toLowerCase().contains('opc') || order.serviceType.toLowerCase().contains('one person company')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => OpcFormScreen(order: order)));
  } else if (order.serviceType.toLowerCase().contains('private limited')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => IncorpFormScreen(order: order)));
  } else if (order.serviceType.toLowerCase().contains('trademark') || order.serviceType.toLowerCase().contains('trade mark')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => TrademarkFormScreen(order: order)));
  } else if (order.serviceType.toLowerCase().contains('llp')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => LlpFormScreen(order: order)));
  } else if (order.serviceType.toLowerCase().contains('msme')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => MsmeFormScreen(order: order)));
  } else if (order.serviceType.toLowerCase().contains('gst') && order.serviceType.toLowerCase().contains('compliance')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => GstComplianceFormScreen(order: order)));
  } else if (order.serviceType.toLowerCase().contains('gst cancellation')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => GstCancellationFormScreen(order: order)));
  } else if (order.serviceType.toLowerCase().contains('gst filing')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => GstFilingFormScreen(order: order)));
  } else if (order.serviceType.toLowerCase().contains('mca')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => McaComplianceFormScreen(order: order)));
  } else if (order.serviceType.toLowerCase().contains('gst')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => GstFormScreen(order: order)));
  } else if (order.serviceType.toLowerCase().contains('iso')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => IsoFormScreen(order: order)));
  } else if (order.serviceType.toLowerCase().contains('lei') || order.serviceType.toLowerCase().contains('lie')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => LeiFormScreen(order: order)));
  } else if (order.serviceType.toLowerCase().contains('bis')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => BisFormScreen(order: order)));
  } else if (order.serviceType.toLowerCase().contains('fssai')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => FssaiFormScreen(order: order)));
  } else if (order.serviceType.toLowerCase().contains('dsc') || order.serviceType.toLowerCase().contains('digital signature')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => DscFormScreen(order: order)));
  } else if (order.serviceType.toLowerCase().contains('proprietorship')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => ProprietorshipFormScreen(order: order)));
  } else if (order.serviceType.toLowerCase().contains('tds') || order.serviceType.toLowerCase().contains('pan')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => TdsFormScreen(order: order)));
  } else if (order.serviceType.toLowerCase().contains('itr')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => ItrFormScreen(order: order)));
  } else if (order.serviceType.toLowerCase().contains('ce') || order.serviceType.toLowerCase().contains('rohs')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => CeRohsFormScreen(order: order)));
  } else if (order.serviceType.toLowerCase().contains('pf')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => PfFormScreen(order: order)));
  } else if (order.serviceType.toLowerCase().contains('patent')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => PatentFormScreen(order: order)));
  } else if (order.serviceType.toLowerCase().contains('copyright')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => TrademarkFormScreen(order: order)));
  } else if (order.serviceType.toLowerCase() == 'import export code' || order.serviceType.toLowerCase() == 'iec registration' || order.serviceType.toLowerCase().contains('iec')) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => IecFormScreen(order: order)));

  } else {
    // Fallback if we haven't mapped the form yet
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Form for ${order.serviceType} is not implemented yet.')),
    );
  }
}
