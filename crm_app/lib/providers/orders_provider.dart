import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/order_model.dart';
import 'auth_provider.dart';

/// Mock stream of [ServiceOrder] documents.
final serviceOrdersProvider = StreamProvider<List<ServiceOrder>>((ref) {
  final uid = ref.watch(authStateProvider).value?.uid;
  if (uid == null) return Stream.value([]);

  // Mock data for UI testing
  return Stream.value([
    ServiceOrder(
      id: 'mock_order_1',
      clientUid: uid,
      entityName: 'Proprietorship',
      serviceType: 'GST Registration',
      companyName: 'Wealth Empires Tech',
      status: ServiceStatus.active,
      stage: OrderStage.workInProgress,
      steps: [
        const ServiceStep(
          title: 'Requirement Gathering',
          description: 'Collecting all mandatory documents.',
          isCompleted: true,
        ),
        const ServiceStep(
          title: 'GST Portal Application',
          description: 'Submitting details to the GST portal.',
          isCompleted: false,
        ),
      ],
      assignedExpert: 'Rajesh Kumar',
      expertPhone: '918072286963',
      createdAt: DateTime.now().subtract(const Duration(days: 2)),
    ),
    ServiceOrder(
      id: 'mock_order_2',
      clientUid: uid,
      entityName: 'Company',
      serviceType: 'Trademark Registration',
      companyName: 'Acme Corp',
      status: ServiceStatus.notInitialized,
      stage: OrderStage.reqReceived,
      steps: [],
      assignedExpert: 'To be assigned',
      expertPhone: '',
      createdAt: DateTime.now().subtract(const Duration(days: 5)),
    ),
  ]);
});

/// Convenience derived providers for filtered lists.
final activeOrdersProvider = Provider<List<ServiceOrder>>((ref) {
  final orders = ref.watch(serviceOrdersProvider).value ?? [];
  return orders.where((o) => o.status == ServiceStatus.active).toList();
});

final completeOrdersProvider = Provider<List<ServiceOrder>>((ref) {
  final orders = ref.watch(serviceOrdersProvider).value ?? [];
  return orders.where((o) => o.status == ServiceStatus.complete).toList();
});

final notInitializedOrdersProvider = Provider<List<ServiceOrder>>((ref) {
  final orders = ref.watch(serviceOrdersProvider).value ?? [];
  return orders
      .where((o) => o.status == ServiceStatus.notInitialized)
      .toList();
});
