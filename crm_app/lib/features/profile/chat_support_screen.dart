import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/theme/app_theme.dart';
import '../orders/order_chat_screen.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/constants/port.dart';
import '../../providers/auth_provider.dart';

class ChatSupportScreen extends ConsumerWidget {
  const ChatSupportScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(userProfileProvider).value;
    String supportPhone = '918072286963';
    
    if (user != null && user.manager != null && user.manager!['phone'] != null) {
      String phone = user.manager!['phone'].toString().replaceAll(RegExp(r'[^\d+]'), '');
      if (phone.length == 10) {
        phone = '91$phone';
      }
      if (phone.isNotEmpty) supportPhone = phone;
    }

    String waPhone = supportPhone.replaceAll('+', '');

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
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
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppTheme.deepTeal.withOpacity(0.05),
                shape: BoxShape.circle,
              ),
              child: const HugeIcon(
                icon: HugeIcons.strokeRoundedCustomerSupport,
                size: 48,
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
            const SizedBox(height: 32),
            _buildSupportAction(
              icon: HugeIcons.strokeRoundedBubbleChat,
              title: 'Live Chat',
              subtitle: 'Connect with a support agent instantly',
              color: AppTheme.corporateBlue,
              onTap: () async {
                if (user != null) {
                  // Show loading indicator
                  showDialog(
                    context: context,
                    barrierDismissible: false,
                    builder: (ctx) => const Center(child: CircularProgressIndicator(color: AppTheme.corporateBlue)),
                  );

                  try {
                    final response = await http.post(
                      Uri.parse('$kBaseUrl/api/chat/support/initiate'),
                      headers: {'Content-Type': 'application/json'},
                      body: jsonEncode({'userId': user.id}),
                    );

                    // Dismiss loading
                    if (context.mounted) Navigator.pop(context);

                    if (response.statusCode == 200) {
                      final data = jsonDecode(response.body);
                      final orderId = data['orderId'];
                      
                      if (context.mounted) {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => OrderChatScreen(
                              orderId: orderId,
                              serviceName: 'Live Chat Support',
                              assignedExpert: 'Support Team',
                            ),
                          ),
                        );
                      }
                    } else {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: ${response.statusCode} - ${response.body}')));
                      }
                    }
                  } catch (e) {
                    if (context.mounted) Navigator.pop(context);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                    }
                  }
                }
              },
            ),
            const SizedBox(height: 16),
            _buildSupportAction(
              icon: HugeIcons.strokeRoundedCallOutgoing04,
              title: 'Call Support',
              subtitle: 'Speak directly with our consultants',
              color: AppTheme.corporateBlue,
              onTap: () => launchUrl(Uri.parse('tel:${supportPhone.startsWith('+') ? supportPhone : '+$supportPhone'}')),
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
            _buildFAQCard(
              context,
              'How long does DSC registration take?',
              'DSC registration typically takes 1-2 business days after all necessary documents are verified and processed.',
            ),
            _buildFAQCard(
              context,
              'Can I change my company name after search?',
              'If the name hasn\'t been formally registered yet, you can do a new name search. If already registered, a formal name change process with MCA must be initiated.',
            ),
            _buildFAQCard(
              context,
              'What documents are needed for GST filing?',
              'You will generally need your PAN card, Aadhaar card, business registration proof, bank statements, and relevant sales/purchase invoices.',
            ),
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
                      ? Icon(icon, color: color, size: 28)
                      : HugeIcon(icon: icon, color: color, size: 28),
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

  Widget _buildFAQCard(BuildContext context, String question, String answer) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Theme(
          data: Theme.of(context).copyWith(
            dividerColor: Colors.transparent,
            splashColor: Colors.transparent,
            highlightColor: Colors.transparent,
            hoverColor: Colors.transparent,
          ),
          child: ExpansionTile(
            iconColor: Colors.grey.shade400,
            collapsedIconColor: Colors.grey.shade400,
            tilePadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            childrenPadding:
                const EdgeInsets.only(left: 16, right: 16, bottom: 16),
            title: Text(
              question,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 14,
                color: AppTheme.deepTeal,
              ),
            ),
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  answer,
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 13,
                    height: 1.5,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
