import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/theme/app_theme.dart';

class SupportTicketsScreen extends StatelessWidget {
  const SupportTicketsScreen({super.key});

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
          'Support Tickets',
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
          _buildActiveTicketCard(),
          const SizedBox(height: 32),
          const Text(
            'Previous Tickets',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: AppTheme.deepTeal,
            ),
          ),
          const SizedBox(height: 16),
          _buildHistoryTicket(
            id: 'TKT-1204',
            subject: 'Payment failed for GST service',
            status: 'Resolved',
            date: '10 Apr 2024',
            color: Colors.green,
          ),
          _buildHistoryTicket(
            id: 'TKT-1198',
            subject: 'Document upload error in MCA filing',
            status: 'Resolved',
            date: '05 Apr 2024',
            color: Colors.green,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        backgroundColor: AppTheme.deepTeal,
        icon: const Icon(LucideIcons.plus, color: Colors.white),
        label: const Text('New Ticket', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildActiveTicketCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: AppTheme.premiumGradient,
        borderRadius: BorderRadius.circular(24),
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
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'In Progress',
                  style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
              const Text(
                'ID: TKT-1245',
                style: TextStyle(color: Colors.white70, fontSize: 11),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text(
            'Incorrect GSTIN on Invoice',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Our team is reviewing the corrected documents you shared.',
            style: TextStyle(color: Colors.white70, fontSize: 13),
          ),
          const SizedBox(height: 24),
          const Divider(color: Colors.white24),
          const SizedBox(height: 16),
          Row(
            children: [
              const CircleAvatar(
                radius: 12,
                backgroundColor: Colors.white24,
                child: Icon(LucideIcons.user, size: 12, color: Colors.white),
              ),
              const SizedBox(width: 8),
              const Text(
                'Expert: Vikram Singh',
                style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
              ),
              const Spacer(),
              const Text(
                'Updated 2h ago',
                style: TextStyle(color: Colors.white60, fontSize: 11),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryTicket({
    required String id,
    required String subject,
    required String status,
    required String date,
    required Color color,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
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
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  subject,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    color: AppTheme.deepTeal,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$id • $date',
                  style: TextStyle(color: Colors.grey.shade500, fontSize: 11),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              status,
              style: TextStyle(
                color: color,
                fontSize: 11,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
