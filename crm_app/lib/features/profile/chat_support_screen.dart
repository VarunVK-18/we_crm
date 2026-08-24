// ignore_for_file: deprecated_member_use, unused_local_variable, unused_import, unused_element_parameter
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/theme/app_theme.dart';
import '../orders/order_chat_screen.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/auth_provider.dart';
import '../../providers/orders_provider.dart';

class ChatSupportScreen extends ConsumerStatefulWidget {
  const ChatSupportScreen({super.key});

  @override
  ConsumerState<ChatSupportScreen> createState() => _ChatSupportScreenState();
}

class _ChatSupportScreenState extends ConsumerState<ChatSupportScreen> {
void _showCompletedServices(BuildContext context) {
    final completedOrders = ref.read(completeOrdersProvider);

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Container(
          constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.7),
          padding: const EdgeInsets.symmetric(vertical: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Select a Service',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.deepTeal,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.grey),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                child: Text(
                  'Choose a completed service to continue your chat history or ask new questions.',
                  style: TextStyle(color: Colors.grey, fontSize: 14),
                ),
              ),
              const SizedBox(height: 16),
              if (completedOrders.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                  child: Center(
                    child: Text(
                      'No completed services found. For ongoing services, please use the Service Tracker.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey, fontSize: 15),
                    ),
                  ),
                )
              else
                Flexible(
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: completedOrders.length,
                    separatorBuilder: (c, i) => const Divider(height: 1),
                    itemBuilder: (c, i) {
                      final order = completedOrders[i];
                      return ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
                        leading: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppTheme.corporateBlue.withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(LucideIcons.checkCircle, color: AppTheme.corporateBlue, size: 20),
                        ),
                        title: Text(
                          order.serviceType,
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                        ),
                        subtitle: Text(
                          order.entityName,
                          style: const TextStyle(fontSize: 13, color: Colors.grey),
                        ),
                        trailing: const Icon(LucideIcons.chevronRight, size: 20, color: Colors.grey),
                        onTap: () {
                          Navigator.pop(ctx);
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => OrderChatScreen(
                                orderId: order.id,
                                serviceName: order.serviceType,
                                assignedExpert: order.assignedExpert,
                              ),
                            ),
                          );
                        },
                      );
                    },
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
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
        title: Text(
          'Help Center',
          style: GoogleFonts.outfit(
            color: AppTheme.deepTeal,
            fontWeight: FontWeight.w600,
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
                fontWeight: FontWeight.w600,
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
              onTap: () {
                if (user != null) {
                  _showCompletedServices(context);
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
                  fontWeight: FontWeight.w600,
                  color: AppTheme.deepTeal,
                ),
              ),
            ),
            const SizedBox(height: 16),
            // FAQ Content
            _buildFAQCard(context, 'What is Startup Doctor?', 'Startup Doctor is an all-in-one platform to manage your business compliances, legal documents, certifications, and important deadlines in one secure place.'),
            _buildFAQCard(context, 'What can I manage with Startup Doctor?', 'You can track GST, ITR, IP, licenses, certifications, subscriptions, statutory filings, and securely store all your business documents.'),
            _buildFAQCard(context, 'Will I receive reminders for compliance deadlines?', 'Yes. Startup Doctor sends timely reminders for upcoming filings, renewals, and compliance due dates to help you stay on track.'),
            _buildFAQCard(context, 'Is my business data secure?', 'Yes. Your documents and business information are protected using secure encryption and industry-standard security practices.'),
            _buildFAQCard(context, 'Can I access my documents anytime?', 'Yes. You can securely access your documents and compliance information anytime, anywhere from your Startup Doctor account.'),
            _buildFAQCard(context, 'How does Startup Doctor protect my business information?', 'Startup Doctor follows AICPA SOC, GDPR, and ISO standards to keep your business data secure.'),
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
                          fontWeight: FontWeight.w500,
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
              softWrap: true,
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
                  softWrap: true,
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
