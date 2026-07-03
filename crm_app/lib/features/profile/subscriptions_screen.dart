import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/checklist_provider.dart';
import '../../models/checklist_model.dart';
import '../../models/order_model.dart';
import '../../providers/subscription_provider.dart';
import '../../providers/compliance_provider.dart';
import '../../providers/auth_provider.dart';
import '../orders/invoice_screen.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hugeicons/hugeicons.dart';

class SubscriptionsScreen extends ConsumerWidget {
  const SubscriptionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final checklistsAsync = ref.watch(myChecklistsProvider);
    final subscriptionsAsync = ref.watch(mySubscriptionsProvider);
    final selectedEntity = ref.watch(selectedEntityProvider);
    final user = ref.watch(userProfileProvider).value;
    final managerPhone = user?.manager?['phone'] as String? ?? '+918000000000';

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
            subscriptionsAsync.when(
              data: (subscriptions) {
                final filteredSubscriptions = subscriptions.where((s) {
                  if (selectedEntity == 'All Entities') return true;
                  // If entityName is empty, show it everywhere as a fallback.
                  if (s.entityName.isEmpty) return true;
                  return s.entityName.toLowerCase() == selectedEntity.trim().toLowerCase();
                }).toList();

                final activePlans = filteredSubscriptions.where((s) => s.status == 'Active' || s.status == 'Pending').toList();
                final expiringPlans = filteredSubscriptions.where((s) => s.status == 'Expiring Soon').toList();
                final expiredPlans = filteredSubscriptions.where((s) => s.status == 'Expired').toList();
                final renewedPlans = filteredSubscriptions.where((s) => s.status == 'Renewed').toList();

                if (filteredSubscriptions.isEmpty) {
                  return Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      color: AppTheme.deepTeal,
                      borderRadius: BorderRadius.circular(32),
                    ),
                    child: const Center(
                      child: Text(
                        'No Plans Found',
                        style: TextStyle(color: Colors.white70, fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ),
                  );
                }

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (activePlans.isNotEmpty) ...[
                      const Text('ACTIVE PLANS', style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      ...activePlans.map((sub) => Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: _buildPlanCard(sub.planName, sub.status, sub.expiryDate),
                      )).toList(),
                    ],
                    if (expiringPlans.isNotEmpty) ...[
                      const Text('EXPIRING SOON', style: TextStyle(color: Colors.orange, fontSize: 12, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      ...expiringPlans.map((sub) => Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: _buildPlanCard(sub.planName, sub.status, sub.expiryDate, onRenew: () async {
                          final confirm = await showDialog<bool>(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: const Text('Renew Subscription'),
                              content: const Text('Are you sure you want to renew this subscription for another year?'),
                              actions: [
                                TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                                TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Renew')),
                              ],
                            ),
                          );
                          if (confirm == true) {
                            if (user?.id != null) {
                              final success = await renewSubscription(user!.id, sub.id);
                              if (success) {
                                ref.invalidate(mySubscriptionsProvider);
                              }
                            }
                          }
                        }),
                      )).toList(),
                    ],
                    if (expiredPlans.isNotEmpty) ...[
                      const Text('EXPIRED PLANS', style: TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      ...expiredPlans.map((sub) => Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: _buildPlanCard(sub.planName, sub.status, sub.expiryDate, isExpired: true, onRenew: () async {
                          final confirm = await showDialog<bool>(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: const Text('Reactivate Subscription'),
                              content: const Text('Are you sure you want to reactivate this subscription?'),
                              actions: [
                                TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                                TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Reactivate')),
                              ],
                            ),
                          );
                          if (confirm == true) {
                            if (user?.id != null) {
                              final success = await renewSubscription(user!.id, sub.id);
                              if (success) {
                                ref.invalidate(mySubscriptionsProvider);
                              }
                            }
                          }
                        }),
                      )).toList(),
                    ],
                    if (renewedPlans.isNotEmpty) ...[
                      const Text('PREVIOUS PLANS (RENEWED)', style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      ...renewedPlans.map((sub) => Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: _buildPlanCard(sub.planName, sub.status, sub.expiryDate, isExpired: true),
                      )).toList(),
                    ],
                  ],
                );
              },
              loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.deepTeal)),
              error: (err, stack) => const Center(child: Text('Failed to load subscriptions')),
            ),
            const SizedBox(height: 48),
            Text(
              selectedEntity == 'All Entities' ? 'Completed Services' : 'Completed Services of $selectedEntity',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: AppTheme.deepTeal,
              ),
            ),
            const SizedBox(height: 16),
            
            checklistsAsync.when(
              data: (checklists) {
                final completed = checklists.where((c) {
                  if (c.status != ChecklistStatus.completed) return false;
                  if (selectedEntity == 'All Entities') return true;
                  return c.entityName.trim().toLowerCase() == selectedEntity.trim().toLowerCase();
                }).toList();
                
                if (completed.isEmpty) {
                  return Container(
                    padding: const EdgeInsets.all(32),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Column(
                      children: [
                        Icon(LucideIcons.checkCircle, size: 48, color: Colors.grey.shade300),
                        const SizedBox(height: 16),
                        Text(
                          'No completed services yet.',
                          style: TextStyle(
                            color: Colors.grey.shade500,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return Column(
                  children: completed.map((c) {
                    final dateStr = c.updatedAt != null
                        ? DateFormat('dd MMM yyyy').format(c.updatedAt!)
                        : 'Unknown Date';
                        
                    final amountStr = c.dealClosedAmount != null
                        ? NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0).format(c.dealClosedAmount)
                        : 'Paid';

                    String invoiceId = c.id.length > 6 ? c.id.substring(c.id.length - 6).toUpperCase() : c.id;
                    if (c.customServiceId.isNotEmpty) {
                      final numberPart = c.customServiceId.replaceAll(RegExp(r'[^0-9]'), '');
                      final year = (c.createdAt ?? c.updatedAt ?? DateTime.now()).toLocal().year.toString();
                      invoiceId = 'WE$year$numberPart';
                    } else if (c.createdAt != null || c.updatedAt != null) {
                      final dt = (c.createdAt ?? c.updatedAt!).toLocal();
                      final yy = dt.year.toString().substring(2);
                      final mm = dt.month.toString().padLeft(2, '0');
                      final dd = dt.day.toString().padLeft(2, '0');
                      final hh = dt.hour.toString().padLeft(2, '0');
                      final min = dt.minute.toString().padLeft(2, '0');
                      invoiceId = 'WE$yy$mm$dd$hh$min';
                    }

                    final closed = c.dealClosedAmount ?? 0.0;
                    final paid = c.advanceAmountPaid ?? 0.0;
                    final isPaymentPending = closed > paid;

                    return _buildHistoryItem(
                      service: c.serviceName.isEmpty ? 'Service Package' : c.serviceName,
                      id: invoiceId,
                      amount: amountStr,
                      date: dateStr,
                      isPaymentPending: isPaymentPending,
                      onTap: () {
                        if (isPaymentPending) {
                          showDialog(
                            context: context,
                            builder: (context) => AlertDialog(
                              title: Text('Payment Pending', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: AppTheme.deepTeal)),
                              content: Text('This service has a pending payment. Please contact your manager or complete the payment to access your invoice.', style: GoogleFonts.outfit(color: Colors.grey.shade700)),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.pop(context),
                                  child: Text('Cancel', style: GoogleFonts.outfit(color: Colors.grey, fontWeight: FontWeight.bold)),
                                ),
                                TextButton.icon(
                                  onPressed: () async {
                                    final url = Uri.parse('tel:$managerPhone');
                                    if (await canLaunchUrl(url)) {
                                      await launchUrl(url);
                                    }
                                  },
                                  icon: const HugeIcon(icon: HugeIcons.strokeRoundedCallOutgoing03, color: AppTheme.deepTeal, size: 18),
                                  label: Text('Call Manager', style: GoogleFonts.outfit(color: AppTheme.deepTeal, fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                          );
                          return;
                        }
                        // Pass mock ServiceOrder to InvoiceScreen
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => InvoiceScreen(
                              order: ServiceOrder(
                                id: c.id,
                                clientUid: '',
                                entityName: 'Wealth Empires Client',
                                serviceType: c.serviceName.isEmpty ? 'Service Package' : c.serviceName,
                                companyName: 'Wealth Empires Client',
                                status: ServiceStatus.complete,
                                stage: OrderStage.completed,
                                steps: const [],
                                requestedDocuments: const [],
                                finalDocuments: const [],
                                assignedExpert: 'Support Team',
                                expertPhone: '',
                                customServiceId: c.customServiceId,
                                createdAt: c.createdAt ?? c.updatedAt ?? DateTime.now(),
                                dealClosedAmount: c.dealClosedAmount ?? 0.0,
                              ),
                            ),
                          ),
                        );
                      },
                    );
                  }).toList(),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.deepTeal)),
              error: (err, stack) => const Center(child: Text('Failed to load completed services')),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlanCard(String planName, String status, DateTime expiryDate, {bool isExpired = false, VoidCallback? onRenew}) {
    final expiryStr = DateFormat('dd MMM yyyy').format(expiryDate);
    
    String planLabel = 'PREMIUM COMPLIANCE';
    var planIcon = HugeIcons.strokeRoundedCrown03;
    
    final lowerPlan = planName.toLowerCase();
    if (lowerPlan.contains('startup')) {
      planLabel = 'BASIC COMPLIANCE';
      planIcon = HugeIcons.strokeRoundedAward01;
    } else if (lowerPlan.contains('corporate')) {
      planLabel = 'ELITE COMPLIANCE';
      planIcon = HugeIcons.strokeRoundedCrown03;
    } else {
      planLabel = 'PREMIUM COMPLIANCE';
      planIcon = HugeIcons.strokeRoundedCrown03;
    }
    
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
            color: isExpired ? Colors.black12 : AppTheme.deepTeal.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Opacity(
        opacity: isExpired ? 0.6 : 1.0,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                planLabel,
                style: const TextStyle(
                  color: Colors.white,
                  letterSpacing: 1.5,
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                ),
              ),
              HugeIcon(icon: planIcon, color: Colors.amber.shade400, size: 24),
            ],
          ),
          const SizedBox(height: 32),
          Text(
            'Wealth Empires\n$planName',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.w900,
              height: 1.1,
            ),
          ),
          const SizedBox(height: 32),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'STATUS',
                    style: TextStyle(
                      color: Colors.white60,
                      fontSize: 10,
                      letterSpacing: 1.2,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    status,
                    style: TextStyle(
                      color: isExpired ? Colors.white70 : Colors.greenAccent,
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    isExpired ? 'EXPIRED ON' : 'EXPIRES',
                    style: TextStyle(
                      color: Colors.white60,
                      fontSize: 10,
                      letterSpacing: 1.2,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    expiryStr,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ],
          ),
          if (onRenew != null) ...[
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: ElevatedButton(
                onPressed: onRenew,
                style: ElevatedButton.styleFrom(
                  backgroundColor: status == 'Expiring Soon' ? Colors.orange : Colors.white,
                  foregroundColor: status == 'Expiring Soon' ? Colors.white : AppTheme.deepTeal,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: Text(
                  status == 'Expired' ? 'Reactivate' : 'Renew Now',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ],
      ),
      ),
    );
  }

  IconData _getServiceIcon(String serviceName) {
    final name = serviceName.toLowerCase();
    if (name.contains('gst') || name.contains('tax')) return LucideIcons.fileText;
    if (name.contains('dsc') || name.contains('digital signature')) return LucideIcons.key;
    if (name.contains('msme') || name.contains('shop')) return LucideIcons.store;
    if (name.contains('patent') || name.contains('copyright')) return LucideIcons.award;
    if (name.contains('trademark')) return LucideIcons.stamp;
    if (name.contains('company') || name.contains('incorporation') || name.contains('llp') || name.contains('opc')) return LucideIcons.building2;
    if (name.contains('fssai') || name.contains('iso') || name.contains('compliance')) return LucideIcons.shieldCheck;
    if (name.contains('pf') || name.contains('esi') || name.contains('labor')) return LucideIcons.briefcase;

    return LucideIcons.fileText;
  }

  Widget _buildHistoryItem({
    required String service,
    required String id,
    required String amount,
    required String date,
    required bool isPaymentPending,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
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
              child: Icon(_getServiceIcon(service), color: AppTheme.deepTeal, size: 20),
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
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Row(
                  children: [
                    Text(
                      isPaymentPending ? 'Pending Payment' : 'Download',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: isPaymentPending ? Colors.red.withOpacity(0.8) : AppTheme.deepTeal.withOpacity(0.6),
                      ),
                    ),
                    const SizedBox(width: 4),
                    if (!isPaymentPending)
                      Icon(
                        LucideIcons.download,
                        size: 12,
                        color: AppTheme.deepTeal.withOpacity(0.6),
                      ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
