import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/theme/app_theme.dart';
import '../../models/order_model.dart';
import '../../providers/compliance_provider.dart';
import '../../providers/orders_provider.dart';
import '../services/registration_services_screen.dart';

class Entity {
  final String name;
  final String companyName;
  final String type;
  final int serviceCount;
  final IconData icon;
  final Color color;

  const Entity({
    required this.name,
    required this.companyName,
    required this.type,
    required this.serviceCount,
    required this.icon,
    required this.color,
  });
}

class MyEntitiesScreen extends ConsumerWidget {
  const MyEntitiesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersAsync = ref.watch(serviceOrdersProvider);
    final orders = ordersAsync.value ?? [];
    final isLoading = ordersAsync.isLoading && orders.isEmpty;

    // Group orders by companyName to dynamically extract entities
    final Map<String, List<ServiceOrder>> grouped = {};
    for (final order in orders) {
      if (order.companyName.isEmpty) continue;
      final String compName = order.companyName.trim();
      grouped.putIfAbsent(compName, () => []).add(order);
    }

    final entities = grouped.entries.map((entry) {
      final compName = entry.key;
      final compOrders = entry.value;
      final firstOrder = compOrders.first;

      // Determine type
      String type = 'Private Limited';
      if (compName.toLowerCase().contains('llp')) {
        type = 'LLP';
      } else if (compName.toLowerCase().contains('partnership')) {
        type = 'Partnership';
      }

      // Count active services
      final activeCount =
          compOrders.where((o) => o.status == ServiceStatus.active).length;

      return Entity(
        name: firstOrder.entityName.isNotEmpty
            ? firstOrder.entityName
            : compName.split(' ').first,
        companyName: compName,
        type: type,
        serviceCount: activeCount,
        icon: type == 'LLP' ? LucideIcons.cpu : LucideIcons.building2,
        color:
            type == 'LLP' ? AppTheme.corporateBlue : const Color.fromARGB(255, 141, 107, 234),
      );
    }).toList();

    final allEntitiesCard = Entity(
      name: 'All Entities',
      companyName: 'All Entities',
      type: 'Portfolio',
      serviceCount: orders.where((o) => o.status == ServiceStatus.active).length,
      icon: LucideIcons.layoutGrid,
      color: const Color.fromARGB(255, 0, 0, 4),
    );

    final finalEntities = [allEntitiesCard, ...entities];

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
          : entities.isEmpty
              ? const _EntitiesEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.all(24),
                  itemCount: finalEntities.length,
                  itemBuilder: (context, index) =>
                      _EntityCard(entity: finalEntities[index]),
                ),
      floatingActionButton: entities.isNotEmpty
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

class _EntityCard extends ConsumerWidget {
  final Entity entity;
  const _EntityCard({required this.entity});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedEntity = ref.watch(selectedEntityProvider);
    final isSelected = selectedEntity == entity.companyName;

    return InkWell(
      onTap: () {
        ref.read(selectedEntityProvider.notifier).state = entity.companyName;
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
                  ? AppTheme.deepTeal.withValues(alpha: 0.1)
                  : Colors.black.withValues(alpha: 0.05),
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
                color: entity.color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(entity.icon, color: entity.color, size: 28),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    entity.companyName,
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
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: entity.color.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          entity.type,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: entity.color,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        '${entity.serviceCount} Active Services',
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
                  color: entity.color.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(LucideIcons.check,
                    color: entity.color, size: 20),
              )
            else
              Icon(LucideIcons.chevronRight, color: Colors.grey.shade300),
          ],
        ),
      ),
    );
  }
}

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
