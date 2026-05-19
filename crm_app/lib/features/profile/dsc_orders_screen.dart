import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/theme/app_theme.dart';

class DSCOrdersScreen extends StatelessWidget {
  const DSCOrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
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
          'DSC Registrations',
          style: TextStyle(
            color: AppTheme.deepTeal,
            fontWeight: FontWeight.w900,
            fontSize: 20,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Text(
            'Active Applications',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: AppTheme.deepTeal,
            ),
          ),
          const SizedBox(height: 16),
          _buildDSCCard(
            name: 'KUMAR S',
            type: 'Class 3 (Signature + Encryption)',
            stage: 'Pending Verification',
            progress: 0.6,
            color: AppTheme.corporateBlue,
          ),
          const SizedBox(height: 32),
          const Text(
            'Completed',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: AppTheme.deepTeal,
            ),
          ),
          const SizedBox(height: 16),
          _buildDSCCard(
            name: 'ANITA REDDY',
            type: 'Class 3 (Signature Only)',
            stage: 'Certificate Issued',
            progress: 1.0,
            color: Colors.green,
            isCompleted: true,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        backgroundColor: AppTheme.deepTeal,
        icon: const Icon(LucideIcons.plus, color: Colors.white),
        label: const Text('Apply New DSC', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildDSCCard({
    required String name,
    required String type,
    required String stage,
    required double progress,
    required Color color,
    bool isCompleted = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
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
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(LucideIcons.user, color: color, size: 20),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.deepTeal,
                      ),
                    ),
                    Text(
                      type,
                      style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                    ),
                  ],
                ),
              ),
              if (isCompleted)
                const Icon(LucideIcons.checkCircle, color: Colors.green, size: 20),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                stage,
                style: TextStyle(
                  color: isCompleted ? Colors.green : AppTheme.deepTeal,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                '${(progress * 100).toInt()}%',
                style: TextStyle(color: Colors.grey.shade400, fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: Colors.grey.shade100,
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 6,
            ),
          ),
          if (!isCompleted) ...[
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () {},
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: AppTheme.deepTeal.withOpacity(0.2)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Text(
                  'Upload Pending Documents',
                  style: TextStyle(color: AppTheme.deepTeal, fontSize: 13, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
