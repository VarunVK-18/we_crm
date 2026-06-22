import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/theme/app_theme.dart';
import '../../models/user_model.dart';
import '../../models/order_model.dart';
import '../../providers/compliance_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/orders_provider.dart';
import '../services/registration_services_screen.dart';

class MyEntitiesScreen extends ConsumerWidget {
  const MyEntitiesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(userProfileProvider);
    final ordersAsync = ref.watch(serviceOrdersProvider);
    final orders = ordersAsync.value ?? [];

    final isLoading =
        userAsync.isLoading || (ordersAsync.isLoading && orders.isEmpty);

    // ── Real entities from the profile API (client_entities[]) ────────────
    final List<ClientEntity> clientEntities = List.from(userAsync.value?.clientEntities ?? []);

    // Create a map to ensure uniqueness by entityName
    final Map<String, ClientEntity> mergedEntities = {};
    for (final ce in clientEntities) {
      mergedEntities[ce.entityName.trim().toLowerCase()] = ce;
    }

    // Add entities found in orders that aren't in clientEntities yet
    for (final o in orders) {
      final name = o.entityName.trim().isNotEmpty && o.entityName.trim() != 'Default'
          ? o.entityName.trim()
          : o.companyName.trim();
      if (name.isNotEmpty && !mergedEntities.containsKey(name.toLowerCase())) {
        mergedEntities[name.toLowerCase()] = ClientEntity(
          entityName: name,
          entityType: 'Company', // fallback
          cin: '', pan: '', tan: '', gstin: '', iso: '', msme: '', fssai: '', coi: '', dsc: '',
          trademarkApplicationNumber: '', trademarkStatus: '', trademarkCertificate: '',
          patentApplicationNumber: '', patentStatus: '', patentNumber: '',
          copyrightRegistrationNumber: '', copyrightCertificate: '',
        );
      }
    }
    
    final finalEntities = mergedEntities.values.toList();

    // Enrich with active service count from checklists
    final entityCards = finalEntities.map((e) {
      final entityName = e.entityName.trim();
      final activeCount = orders
          .where((o) =>
              o.status == ServiceStatus.active &&
              (o.entityName.trim().toLowerCase() ==
                      entityName.toLowerCase() ||
                  o.companyName.trim().toLowerCase() ==
                      entityName.toLowerCase()))
          .length;
      return _EntityCardData(
        entity: e,
        serviceCount: activeCount,
      );
    }).toList();

    // Build the "All Entities" summary card
    final totalActive =
        orders.where((o) => o.status == ServiceStatus.active).length;

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppTheme.backgroundLight,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: AppTheme.deepTeal),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'My Entities',
          style: TextStyle(
            color: AppTheme.deepTeal,
            fontWeight: FontWeight.w900,
            fontSize: 20,
          ),
        ),
      ),
      body: isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(AppTheme.deepTeal),
              ),
            )
          : entityCards.isEmpty
              ? const _EntitiesEmptyState()
              : ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    // All Entities summary card
                    _AllEntitiesCard(
                      totalEntities: entityCards.length,
                      totalActiveServices: totalActive,
                    ),
                    const SizedBox(height: 16),
                    ...entityCards.map((c) => _EntityCard(data: c)),
                  ],
                ),
      floatingActionButton: entityCards.isNotEmpty
          ? FloatingActionButton.extended(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const RegistrationServicesScreen(),
                ),
              ),
              backgroundColor: AppTheme.deepTeal,
              icon: const Icon(LucideIcons.plus, color: Colors.white),
              label: const Text(
                'Add Entity',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            )
          : null,
    );
  }
}

// ── Data holder ──────────────────────────────────────────────────────────────

class _EntityCardData {
  final ClientEntity entity;
  final int serviceCount;

  const _EntityCardData({required this.entity, required this.serviceCount});
}

// ── Helper: resolve icon and color from entityType ────────────────────────

IconData _iconForType(String type) {
  switch (type.toLowerCase()) {
    case 'llp':
      return LucideIcons.cpu;
    case 'partnership':
      return LucideIcons.users;
    case 'proprietorship':
    case 'sole proprietorship':
      return LucideIcons.user;
    case 'opc':
    case 'one person company':
      return LucideIcons.userCheck;
    case 'ngo':
    case 'section 8':
      return LucideIcons.heart;
    case 'trust':
      return LucideIcons.shield;
    default:
      return LucideIcons.building2; // Private Limited, Public, etc.
  }
}

Color _colorForType(String type) {
  switch (type.toLowerCase()) {
    case 'llp':
      return AppTheme.corporateBlue;
    case 'partnership':
      return const Color(0xFF10B981);
    case 'proprietorship':
    case 'sole proprietorship':
      return const Color(0xFFF59E0B);
    case 'opc':
    case 'one person company':
      return const Color(0xFF8B5CF6);
    case 'ngo':
    case 'section 8':
    case 'trust':
      return const Color(0xFFEC4899);
    default:
      return const Color(0xFF6366F1); // Private Limited, Public
  }
}

// ── All Entities summary card ─────────────────────────────────────────────

class _AllEntitiesCard extends ConsumerWidget {
  final int totalEntities;
  final int totalActiveServices;

  const _AllEntitiesCard({
    required this.totalEntities,
    required this.totalActiveServices,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedEntity = ref.watch(selectedEntityProvider);
    final isSelected = selectedEntity == 'All Entities';
    const color = Color.fromARGB(255, 0, 0, 4);

    return InkWell(
      onTap: () {
        ref.read(selectedEntityProvider.notifier).state = 'All Entities';
        Navigator.pop(context);
      },
      borderRadius: BorderRadius.circular(24),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: isSelected
                  ? AppTheme.deepTeal.withOpacity(0.1)
                  : Colors.black.withOpacity(0.05),
              blurRadius: isSelected ? 24 : 16,
              spreadRadius: 0,
              offset: Offset(0, isSelected ? 12 : 8),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(LucideIcons.layoutGrid, color: color, size: 28),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'All Entities',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.deepTeal,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: color.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          'Portfolio',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: color,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        '$totalEntities Entities · $totalActiveServices Active',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade500,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (isSelected)
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(LucideIcons.check,
                    color: color, size: 20),
              )
            else
              Icon(LucideIcons.chevronRight, color: Colors.grey.shade300),
          ],
        ),
      ),
    );
  }
}

// ── Individual entity card ─────────────────────────────────────────────────

class _EntityCard extends ConsumerWidget {
  final _EntityCardData data;

  const _EntityCard({required this.data});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final entity = data.entity;
    final entityName = entity.entityName.trim();
    final entityType = entity.entityType.isNotEmpty ? entity.entityType : 'Company';
    final color = _colorForType(entityType);
    final icon = _iconForType(entityType);

    // Selected state uses entityName (canonical key)
    final selectedEntity = ref.watch(selectedEntityProvider);
    final isSelected = selectedEntity == entityName;

    return InkWell(
      onTap: () {
        // Store entityName as the canonical selector key
        ref.read(selectedEntityProvider.notifier).state = entityName;
        Navigator.pop(context);
      },
      borderRadius: BorderRadius.circular(24),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: isSelected
                  ? AppTheme.deepTeal.withOpacity(0.1)
                  : Colors.black.withOpacity(0.05),
              blurRadius: isSelected ? 24 : 16,
              spreadRadius: 0,
              offset: Offset(0, isSelected ? 12 : 8),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    entityName,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.deepTeal,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: color.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          entityType,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: color,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        '${data.serviceCount} Active Services',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade500,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (isSelected)
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(LucideIcons.check, color: color, size: 20),
              )
            else
              Icon(LucideIcons.chevronRight, color: Colors.grey.shade300),
          ],
        ),
      ),
    );
  }
}


// ── Empty State ────────────────────────────────────────────────────────────

class _EntitiesEmptyState extends StatelessWidget {
  const _EntitiesEmptyState();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: AppTheme.deepTeal.withOpacity(0.05),
              shape: BoxShape.circle,
            ),
            child: Icon(
              LucideIcons.building2,
              size: 80,
              color: AppTheme.deepTeal.withOpacity(0.2),
            ),
          ),
          const SizedBox(height: 32),
          const Text(
            'No Registered Entities',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: AppTheme.deepTeal,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'You haven\'t registered any companies yet. Start your registration process today.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 15,
              color: Colors.grey.shade500,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 48),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const RegistrationServicesScreen(),
                ),
              ),
              icon: const Icon(LucideIcons.rocket, size: 18),
              label: const Text('Start Registration'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.deepTeal,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 20),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
