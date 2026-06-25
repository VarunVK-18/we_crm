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
import '../orders/invoice_screen.dart';

class SubscriptionsScreen extends ConsumerWidget {
  const SubscriptionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final checklistsAsync = ref.watch(myChecklistsProvider);
    final subscriptionsAsync = ref.watch(mySubscriptionsProvider);
    final selectedEntity = ref.watch(selectedEntityProvider);

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
                        'No Active Plans',
                        style: TextStyle(color: Colors.white70, fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ),
                  );
                }
                return Column(
                  children: filteredSubscriptions.map((sub) => Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: _buildPlanCard(sub.planName, sub.status, sub.expiryDate),
                  )).toList(),
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
                    if (c.updatedAt != null) {
                      final yy = c.updatedAt!.year.toString().substring(2);
                      final mm = c.updatedAt!.month.toString().padLeft(2, '0');
                      final dd = c.updatedAt!.day.toString().padLeft(2, '0');
                      final hh = c.updatedAt!.hour.toString().padLeft(2, '0');
                      final min = c.updatedAt!.minute.toString().padLeft(2, '0');
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
                              title: const Text('Payment Pending'),
                              content: const Text('This service has a pending payment. Please contact your manager or complete the payment to access your invoice.'),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.pop(context),
                                  child: const Text('OK', style: TextStyle(color: AppTheme.deepTeal)),
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
                                createdAt: c.updatedAt ?? DateTime.now(),
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

  Widget _buildPlanCard(String planName, String status, DateTime expiryDate) {
    final expiryStr = DateFormat('dd MMM yyyy').format(expiryDate);
    
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
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('STATUS', style: TextStyle(color: Colors.white60, fontSize: 10, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(status, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(width: 48),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('EXPIRES', style: TextStyle(color: Colors.white60, fontSize: 10, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(expiryStr, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                ],
              ),
            ],
          ),
        ],
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
