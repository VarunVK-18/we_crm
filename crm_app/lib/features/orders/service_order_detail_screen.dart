import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:convert';
import 'package:lucide_icons_flutter/lucide_icons.dart';
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
import 'director_details_form_screen.dart';
import 'dpiit_form_screen.dart';

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
    final unreadCount = ref.watch(notificationProvider).where((n) => !n.isRead).length;
    final completedSteps = order.steps.where((s) => s.isCompleted).length;
    final totalSteps = order.steps.length;
    final progress = order.progressValue;

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
                    assignedExpert: order.assignedExpert,
                  ),
                ),
              ),
              backgroundColor: AppTheme.deepTeal,
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
                      icon: const Icon(LucideIcons.bell, color: Colors.white, size: 20),
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
                              // Status chip
                              _StatusChip(status: order.status),
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

                // Info row
                _InfoRow(order: order),

                const SizedBox(height: 24),
                
                if (order.status == ServiceStatus.active && 
                    order.serviceType == 'Private Limited Incorporation' && 
                    (order.details['directors'] == null || (order.details['directors'] is List && (order.details['directors'] as List).isEmpty) || (order.details['directors'] is String && (order.details['directors'] as String).isEmpty) || order.details['directors'] == '[]')) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.blue.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.blue.withOpacity(0.3)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(LucideIcons.alertCircle, color: Colors.blue, size: 20),
                              SizedBox(width: 8),
                              Text('Action Required', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          const Text('Please complete the director details to proceed with the registration.', style: TextStyle(fontSize: 13, color: Colors.black87)),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => DirectorDetailsFormScreen(order: order)),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.corporateBlue,
                              minimumSize: const Size(double.infinity, 44),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: const Text('Complete Director Details', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],

                // ── DPIIT Service Action Required ────────────────────────────────
                if (order.status == ServiceStatus.active && 
                    order.serviceType.contains('DPIIT') && 
                    order.actionRequired) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.orange.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.orange.withOpacity(0.3)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(LucideIcons.alertTriangle, color: Colors.orange.shade700, size: 20),
                              const SizedBox(width: 8),
                              Text('Action Required', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.orange.shade700)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          const Text('Please provide the required details to start the DPIIT Registration process.', style: TextStyle(fontSize: 13, color: Colors.black87)),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => DpiitFormScreen(order: order)),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.orange.shade600,
                              minimumSize: const Size(double.infinity, 44),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: const Text('Action required to start process', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],

                if (order.notes.isNotEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.amber.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.amber.withOpacity(0.3)),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(LucideIcons.info, color: Colors.amber, size: 20),
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
                    child: _StepTimeline(steps: order.steps),
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
                                style:
                                    TextStyle(fontSize: 12, color: Colors.grey),
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

                // Requested Documents
                if (order.requestedDocuments.isNotEmpty &&
                    order.status != ServiceStatus.complete)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: _RequestedDocumentsSection(order: order),
                  ),

                if (order.status == ServiceStatus.complete) ...[
                  const SizedBox(height: 32),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: _FinalDeliverySection(order: order),
                  ),
                ],

                if (order.serviceType == 'Private Limited Incorporation' && 
                    order.details['directors'] != null && 
                    order.details['directors'] != '[]' &&
                    order.details['directors'] is String && 
                    order.details['directors'] != 'submitted') ...[
                  const SizedBox(height: 32),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: _DirectorDetailsSection(order: order),
                  ),
                ],

                const SizedBox(height: 80), // space for FAB
              ]),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Requested Documents Section ──────────────────────────────────────────────

class _RequestedDocumentsSection extends ConsumerWidget {
  final ServiceOrder order;
  const _RequestedDocumentsSection({required this.order});

  Future<void> _uploadDocument(
      BuildContext context, WidgetRef ref, String docName) async {
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
            const SnackBar(content: Text('Warning: File is large. Max 2MB allowed')),
          );
          return;
        }

        if (!context.mounted) return;
        final shouldUpload = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Preview Document', style: TextStyle(color: AppTheme.deepTeal, fontWeight: FontWeight.bold)),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Selected: $fileName'),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  icon: const Icon(LucideIcons.eye, color: Colors.white, size: 18),
                  label: const Text('View Document', style: TextStyle(color: Colors.white)),
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.corporateBlue),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => LocalDocumentViewer(filePath: filePath),
                      ),
                    );
                  },
                ),
              ],
            ),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Cancel', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.deepTeal),
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Upload Safely', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        );

        if (shouldUpload != true) return;

        final uri = Uri.parse(
            '$kBaseUrl/api/checklists/${order.id}/upload-documents');

        final request = http.MultipartRequest('POST', uri);
        request.files
            .add(await http.MultipartFile.fromPath(docName, filePath));

        final uid = ref.read(authStateProvider).value?.uid;
        if (uid != null) {
          request.headers['x-user-id'] = uid;
        }

        final response = await request.send();
        final respStr = await response.stream.bytesToString();

        if (!context.mounted) return;

        if (response.statusCode == 200) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Document uploaded successfully')),
          );
          ref.invalidate(serviceOrdersProvider);
        } else {
          debugPrint("Upload failed: ${response.statusCode} - $respStr");
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed: $respStr')),
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

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
        ...order.requestedDocuments.where((doc) => !doc.name.startsWith('director_')).map((doc) {
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                  color: doc.isUploaded
                      ? Colors.green.withValues(alpha: 0.3)
                      : Colors.red.withValues(alpha: 0.3)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Row(
              children: [
                Icon(
                  doc.isUploaded
                      ? LucideIcons.fileCheck
                      : LucideIcons.fileWarning,
                  color: doc.isUploaded ? Colors.green : Colors.red,
                  size: 24,
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
                        doc.isUploaded ? 'Uploaded' : 'Action Required',
                        style: TextStyle(
                          color: doc.isUploaded ? Colors.green : Colors.red,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (doc.notes != null && doc.notes!.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.amber.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: Colors.amber.withOpacity(0.3)),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(LucideIcons.info, size: 12, color: Colors.amber),
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
                if (!doc.isUploaded)
                  ElevatedButton.icon(
                    onPressed: () => _uploadDocument(context, ref, doc.name),
                    icon: const Icon(LucideIcons.upload,
                        size: 14, color: Colors.white),
                    label: const Text('Upload',
                        style: TextStyle(color: Colors.white)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red.shade600,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8)),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 8),
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
  const _InfoRow({required this.order});

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
              value: order.assignedExpert,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _InfoTile(
              icon: LucideIcons.building2,
              label: 'Entity',
              value: order.entityName,
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
  final List<ServiceStep> steps;
  const _StepTimeline({required this.steps});

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
                  padding: EdgeInsets.only(bottom: isLast ? 0 : 16),
                  child: Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: isCompleted
                          ? Colors.green.withOpacity(0.04)
                          : Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: isCompleted
                            ? Colors.green.withOpacity(0.2)
                            : Colors.grey.withOpacity(0.08),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.03),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
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
                            if (isCompleted && step.completedAt != null) ...[
                              const SizedBox(width: 8),
                              Text(
                                DateFormat('dd MMM').format(step.completedAt!),
                                style: const TextStyle(
                                    fontSize: 10, color: Colors.grey),
                              ),
                            ],
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
                        if (isCompleted) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(LucideIcons.checkCircle2,
                                  size: 12, color: Colors.green),
                              const SizedBox(width: 4),
                              Text(
                                'Completed',
                                style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.green.shade600,
                                    fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                        ],
                      ],
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

        // Invoice Button
        Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.corporateBlue.withOpacity(0.3)),
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
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => InvoiceScreen(order: order),
                  ),
                );
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
                      child: const Icon(LucideIcons.receipt,
                          color: AppTheme.corporateBlue, size: 24),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Official Invoice',
                            style: TextStyle(
                                fontWeight: FontWeight.w700, fontSize: 14),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Tap to view and download',
                            style: TextStyle(
                                color: Colors.grey.shade600, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    const Icon(LucideIcons.download,
                        color: AppTheme.corporateBlue, size: 20),
                  ],
                ),
              ),
            ),
          ),
        ),

        // Final Documents
        ...order.finalDocuments.where((doc) => !doc.name.startsWith('director_')).map((doc) {
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
          
          final docs = order.requestedDocuments.where((d) => d.name.startsWith(directorPrefix)).toList();
          
          return Theme(
            data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
            child: Container(
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
              child: ExpansionTile(
                title: Text(
                  'Director ${index + 1}: ${dir['name'] ?? 'Unknown'}',
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppTheme.deepTeal),
                ),
                childrenPadding: const EdgeInsets.all(16),
                expandedCrossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildDetailRow('Father\'s Name', dir['fathersName']),
                  _buildDetailRow('Date of Birth', dir['dob']),
                  _buildDetailRow('Place of Birth', dir['placeOfBirth']),
                  _buildDetailRow('Educational Qual.', dir['educationalQualification']),
                  _buildDetailRow('Occupation', dir['occupation']),
                  const SizedBox(height: 16),
                  const Text('Documents', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: Colors.grey)),
                  const SizedBox(height: 8),
                  if (docs.isEmpty)
                    const Text('No documents uploaded', style: TextStyle(fontSize: 12, color: Colors.grey))
                  else
                    ...docs.map((d) => Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Row(
                            children: [
                              Icon(d.isUploaded ? LucideIcons.checkCircle2 : LucideIcons.xCircle, 
                                   color: d.isUploaded ? Colors.green : Colors.red, size: 14),
                              const SizedBox(width: 8),
                              Expanded(child: Text(d.name.replaceFirst(directorPrefix, ''), style: const TextStyle(fontSize: 12))),
                            ],
                          ),
                        )),
                ],
              ),
            ),
          );
        }),
      ],
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
            child: Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.w500)),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.deepTeal)),
          ),
        ],
      ),
    );
  }
}
