import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
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
      if (ce.entityName.trim().isNotEmpty) {
        mergedEntities[ce.entityName.trim().toLowerCase()] = ce;
      }
    }

    // Fallback: If the user's primary companyName isn't in the list, add it automatically
    final primaryCompanyName = userAsync.value?.companyName?.trim() ?? '';
    if (primaryCompanyName.isNotEmpty && !mergedEntities.containsKey(primaryCompanyName.toLowerCase())) {
      mergedEntities[primaryCompanyName.toLowerCase()] = ClientEntity(
        entityName: primaryCompanyName,
        entityType: 'Company',
        cin: '', pan: '', tan: '', gstin: '', 
        iso: '', msme: '', fssai: '', coi: '', dsc: '',
        trademarkApplicationNumber: '', trademarkStatus: '', trademarkCertificate: '',
        patentApplicationNumber: '', patentStatus: '', patentNumber: '',
        copyrightRegistrationNumber: '', copyrightCertificate: '',
      );
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
          ? FloatingActionButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const RegistrationServicesScreen(),
                ),
              ),
              backgroundColor: AppTheme.deepTeal,
              shape: const CircleBorder(),
              child: const HugeIcon(icon: HugeIcons.strokeRoundedAddCircle, color: Colors.white, size: 24),
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

final List<IconData> _entityIcons = [
  LucideIcons.building2,
  LucideIcons.briefcase,
  LucideIcons.landmark,
  LucideIcons.store,
  LucideIcons.boxes,
  LucideIcons.gem,
  LucideIcons.factory,
  LucideIcons.album,
  LucideIcons.cpu,
  LucideIcons.network,
];

IconData _iconForEntity(String name) {
  final hash = name.trim().toLowerCase().codeUnits.fold<int>(0, (p, e) => p + e);
  return _entityIcons[hash % _entityIcons.length];
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
      borderRadius: BorderRadius.circular(20),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
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
              width: 48,
              height: 48,
              alignment: Alignment.center,
              child: const Icon(LucideIcons.layoutGrid, color: AppTheme.deepTeal, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'All Entities',
                    style: TextStyle(
                      fontSize: 15,
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
                          border: Border.all(color: AppTheme.deepTeal.withOpacity(0.3)),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'Portfolio',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.deepTeal,
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
                  color: AppTheme.deepTeal.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(LucideIcons.check,
                    color: AppTheme.deepTeal, size: 20),
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
    final icon = _iconForEntity(entityName);

    // Selected state uses entityName (canonical key)
    final selectedEntity = ref.watch(selectedEntityProvider);
    final isSelected = selectedEntity == entityName;

    return InkWell(
      onTap: () {
        // Store entityName as the canonical selector key
        ref.read(selectedEntityProvider.notifier).state = entityName;
        Navigator.pop(context);
      },
      borderRadius: BorderRadius.circular(20),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
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
              width: 48,
              height: 48,
              alignment: Alignment.center,
              child: Icon(icon, color: AppTheme.deepTeal, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    entityName,
                    style: const TextStyle(
                      fontSize: 15,
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
                          border: Border.all(color: AppTheme.deepTeal.withOpacity(0.3)),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          entityType,
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.deepTeal,
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
                  color: AppTheme.deepTeal.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(LucideIcons.check, color: AppTheme.deepTeal, size: 20),
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
