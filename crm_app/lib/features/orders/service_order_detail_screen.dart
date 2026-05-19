import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../models/order_model.dart';
import '../../core/utils/whatsapp_utils.dart';

class ServiceOrderDetailScreen extends StatelessWidget {
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
  Widget build(BuildContext context) {
    final completedSteps = order.steps.where((s) => s.isCompleted).length;
    final totalSteps = order.steps.length;
    final progress = order.progressValue;

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      // ── WhatsApp FAB ─────────────────────────────────────────────────────
      floatingActionButton: order.expertPhone.isNotEmpty
          ? FloatingActionButton.extended(
              onPressed: () => openWhatsApp(
                phone: '918072286963',
                message:
                    'Hi ${order.assignedExpert}, I have a query about my ${order.serviceType} service (${order.id}).',
              ),
              backgroundColor: const Color(0xFF25D366),
              icon: const Icon(LucideIcons.messageCircle,
                  color: Colors.white, size: 18),
              label: const Text(
                'Chat on WhatsApp',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                ),
              ),
            )
          : null,
      body: AnnotatedRegion<SystemUiOverlayStyle>(
        value: SystemUiOverlayStyle.light,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            // ── Hero Header ──────────────────────────────────────────────────
            SliverAppBar(
              expandedHeight: 220,
              pinned: true,
              stretch: true,
              elevation: 0,
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
                          padding: const EdgeInsets.fromLTRB(24, 56, 24, 24),
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

                const SizedBox(height: 32),

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
                            color: Colors.green, size: 20),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // ── WhatsApp Expert Card ──────────────────────────────────────
                if (order.expertPhone.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: GestureDetector(
                      onTap: () => openWhatsApp(
                        phone: '918072286963',
                        message:
                            'Hi ${order.assignedExpert}, I have a query about my ${order.serviceType} service (${order.id}).',
                      ),
                      child: Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF1DA851), Color(0xFF25D366)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF25D366)
                                  .withValues(alpha: 0.3),
                              blurRadius: 16,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(LucideIcons.messageCircle,
                                  color: Colors.white, size: 22),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Chat with Your Expert',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 15,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    order.assignedExpert,
                                    style: TextStyle(
                                      color:
                                          Colors.white.withValues(alpha: 0.8),
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Text(
                                'Open',
                                style: TextStyle(
                                  color: Color(0xFF25D366),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                const SizedBox(height: 80), // space for FAB
              ]),
            ),
          ],
        ),
      ),
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
              value: dateStr,
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
