import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/compliance_provider.dart';
import '../services/registration_services_screen.dart';

// --- Mock Data ---
class _Entity {
  final String name;
  final String companyName;
  final String type;
  final int serviceCount;
  final IconData icon;
  final Color color;

  const _Entity({
    required this.name,
    required this.companyName,
    required this.type,
    required this.serviceCount,
    required this.icon,
    required this.color,
  });
}

const _mockEntities = [
  _Entity(
    name: 'Balaji',
    companyName: 'Balaji Enterprises Pvt Ltd',
    type: 'Private Limited',
    serviceCount: 4,
    icon: LucideIcons.building2,
    color: Color(0xFF6366F1),
  ),
  _Entity(
    name: 'Tech Solutions',
    companyName: 'Tech Solutions LLP',
    type: 'LLP',
    serviceCount: 3,
    icon: LucideIcons.cpu,
    color: Color(0xFF10B981),
  ),
];

class MyEntitiesScreen extends ConsumerWidget {
  const MyEntitiesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
      body: _mockEntities.isEmpty
          ? const _EntitiesEmptyState()
          : ListView.builder(
              padding: const EdgeInsets.all(24),
              itemCount: _mockEntities.length,
              itemBuilder: (context, index) =>
                  _EntityCard(entity: _mockEntities[index]),
            ),
      floatingActionButton: _mockEntities.isNotEmpty
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
  final _Entity entity;
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
          border: Border.all(
            color: isSelected ? AppTheme.accentCyan : Colors.transparent,
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: isSelected 
                  ? AppTheme.accentCyan.withOpacity(0.1) 
                  : Colors.black.withOpacity(0.04),
              blurRadius: 20,
              offset: const Offset(0, 10),
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
              const Icon(LucideIcons.checkCircle2, color: AppTheme.accentCyan, size: 24)
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
