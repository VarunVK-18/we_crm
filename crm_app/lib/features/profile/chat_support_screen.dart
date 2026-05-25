import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/whatsapp_utils.dart';

class ChatSupportScreen extends StatelessWidget {
  const ChatSupportScreen({super.key});

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
          'Help Center',
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
          children: [
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: AppTheme.deepTeal.withOpacity(0.05),
                shape: BoxShape.circle,
              ),
              child: const HugeIcon(
                icon: HugeIcons.strokeRoundedCustomerSupport,
                size: 64,
                color: AppTheme.deepTeal,
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'How can we help you?',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: AppTheme.deepTeal,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Our team is available Mon-Sat (9 AM - 7 PM) to assist you with your business needs.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 14,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 48),
            _buildSupportAction(
              icon: HugeIcons.strokeRoundedBubbleChat,
              title: 'Chat on WhatsApp',
              subtitle: 'Connect with a support agent instantly',
              color: const Color(0xFF25D366),
              onTap: () => openWhatsApp(
                context: context,
                phone: '918072286963',
                message: 'Hi Wealth Empires Support, I need help with...',
              ),
            ),
            const SizedBox(height: 16),
            _buildSupportAction(
              icon: HugeIcons.strokeRoundedCallOutgoing04,
              title: 'Call Support',
              subtitle: 'Speak directly with our consultants',
              color: AppTheme.corporateBlue,
              onTap: () {}, // Would use url_launcher for tel: link
            ),
            const SizedBox(height: 48),
            const Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Frequently Asked Questions',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.deepTeal,
                ),
              ),
            ),
            const SizedBox(height: 16),
            _buildFAQCard('How long does DSC registration take?'),
            _buildFAQCard('Can I change my company name after search?'),
            _buildFAQCard('What documents are needed for GST filing?'),
          ],
        ),
      ),
    );
  }

  Widget _buildSupportAction({
    required dynamic icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: icon is IconData
                      ? Icon(icon, color: color, size: 24)
                      : HugeIcon(icon: icon, color: color, size: 24),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.deepTeal,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: TextStyle(
                          color: Colors.grey.shade500,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  LucideIcons.chevronRight,
                  color: Colors.grey.shade300,
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFAQCard(String question) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              question,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 14,
                color: AppTheme.deepTeal,
              ),
            ),
          ),
          Icon(LucideIcons.chevronDown, color: Colors.grey.shade400, size: 16),
        ],
      ),
    );
  }
}
