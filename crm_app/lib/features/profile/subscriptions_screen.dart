import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/theme/app_theme.dart';

class SubscriptionsScreen extends StatelessWidget {
  const SubscriptionsScreen({super.key});

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
          'My Subscriptions',
          style: TextStyle(
            color: AppTheme.deepTeal,
            fontWeight: FontWeight.w900,
            fontSize: 20,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Current Plan',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: AppTheme.deepTeal,
              ),
            ),
            const SizedBox(height: 16),
            _buildPlanCard(),
            const SizedBox(height: 48),
            const Text(
              'Billing History',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: AppTheme.deepTeal,
              ),
            ),
            const SizedBox(height: 16),
            _buildHistoryItem(
              service: 'MCA Compliance Package',
              id: 'INV-4521',
              amount: '₹45,000',
              date: '12 Mar 2024',
            ),
            _buildHistoryItem(
              service: 'Private Limited Incorporation',
              id: 'INV-4480',
              amount: '₹12,500',
              date: '10 Feb 2024',
            ),
            _buildHistoryItem(
              service: 'Professional Tax Reg.',
              id: 'INV-4412',
              amount: '₹2,500',
              date: '05 Jan 2024',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlanCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: AppTheme.deepTeal,
        borderRadius: BorderRadius.circular(32),
        image: DecorationImage(
          image: const NetworkImage('https://www.transparenttextures.com/patterns/carbon-fibre.png'),
          opacity: 0.1,
          repeat: ImageRepeat.repeat,
          onError: (exception, stackTrace) {
            debugPrint('Failed to load background texture: $exception');
          },
        ),
        boxShadow: [
          BoxShadow(
            color: AppTheme.deepTeal.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'PREMIUM COMPLIANCE',
                style: TextStyle(
                  color: Colors.white,
                  letterSpacing: 1.5,
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                ),
              ),
              Icon(LucideIcons.crown, color: Colors.amber.shade400, size: 24),
            ],
          ),
          const SizedBox(height: 32),
          const Text(
            'Wealth Empires\nGold Plan',
            style: TextStyle(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.w900,
              height: 1.1,
            ),
          ),
          const SizedBox(height: 32),
          Row(
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('STATUS', style: TextStyle(color: Colors.white60, fontSize: 10, fontWeight: FontWeight.bold)),
                  SizedBox(height: 4),
                  Text('Active', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(width: 48),
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('EXPIRES', style: TextStyle(color: Colors.white60, fontSize: 10, fontWeight: FontWeight.bold)),
                  SizedBox(height: 4),
                  Text('31 Mar 2025', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryItem({
    required String service,
    required String id,
    required String amount,
    required String date,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(LucideIcons.fileText, color: AppTheme.deepTeal, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  service,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    color: AppTheme.deepTeal,
                  ),
                ),
                Text(
                  '$id • $date',
                  style: TextStyle(color: Colors.grey.shade500, fontSize: 11),
                ),
              ],
            ),
          ),
          Text(
            amount,
            style: const TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 15,
              color: AppTheme.deepTeal,
            ),
          ),
        ],
      ),
    );
  }
}
