// ─── Enums ─────────────────────────────────────────────────────────────────

enum OrderStage {
  reqReceived,
  workAssigned,
  workInProgress,
  testing,
  completed,
}

/// Status of the service from the management's perspective:
/// - [notInitialized] : Order created but work hasn't started
/// - [active]         : Work is actively in progress
/// - [complete]       : Service fully delivered
enum ServiceStatus { notInitialized, active, complete }

// ─── ServiceStep ────────────────────────────────────────────────────────────

class ServiceStep {
  final String title;
  final String description;
  final bool isCompleted;
  final DateTime? completedAt;

  const ServiceStep({
    required this.title,
    required this.description,
    required this.isCompleted,
    this.completedAt,
  });

  factory ServiceStep.fromMap(Map<String, dynamic> map) {
    return ServiceStep(
      title: map['title']?.toString() ?? '',
      description: map['description']?.toString() ?? '',
      isCompleted: map['isCompleted'] == true,
      completedAt: map['completedAt'] != null
          ? DateTime.tryParse(map['completedAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toMap() => {
    'title': title,
    'description': description,
    'isCompleted': isCompleted,
    'completedAt': completedAt?.toIso8601String(),
  };
}

// ─── ServiceOrder (primary model for My Services) ──────────────────────────

class ServiceOrder {
  final String id;
  final String clientUid;
  final String entityName;
  final String serviceType;
  final String companyName;
  final ServiceStatus status;
  final OrderStage stage;
  final List<ServiceStep> steps;
  final String assignedExpert;
  final String
  expertPhone; // WhatsApp-capable number with country code, e.g. 919876543210
  final DateTime createdAt;

  const ServiceOrder({
    required this.id,
    required this.clientUid,
    required this.entityName,
    required this.serviceType,
    required this.companyName,
    required this.status,
    required this.stage,
    required this.steps,
    required this.assignedExpert,
    required this.expertPhone,
    required this.createdAt,
  });

  factory ServiceOrder.fromMap(Map<String, dynamic> data, String id) {
    final rawSteps = data['steps'] as List<dynamic>? ?? [];

    return ServiceOrder(
      id: id,
      clientUid: data['clientUid']?.toString() ?? '',
      entityName: data['entityName']?.toString() ?? 'Default',
      serviceType: data['serviceType']?.toString() ?? '',
      companyName: data['companyName']?.toString() ?? '',
      status: ServiceStatus.values.firstWhere(
        (e) => e.name == data['status']?.toString(),
        orElse: () => ServiceStatus.notInitialized,
      ),
      stage: OrderStage.values.firstWhere(
        (e) => e.name == data['stage']?.toString(),
        orElse: () => OrderStage.reqReceived,
      ),
      steps: rawSteps
          .map((s) => ServiceStep.fromMap(s as Map<String, dynamic>))
          .toList(),
      assignedExpert: data['assignedExpert']?.toString() ?? 'To be assigned',
      expertPhone: data['expertPhone']?.toString() ?? '',
      createdAt: data['createdAt'] != null
          ? DateTime.tryParse(data['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  double get progressValue {
    if (steps.isEmpty) return 0.0;
    final done = steps.where((s) => s.isCompleted).length;
    return done / steps.length;
  }
}

// ─── Legacy OrderModel (kept for backward compatibility) ───────────────────

class OrderModel {
  final String id;
  final String clientName;
  final String companyName;
  final String serviceType;
  final OrderStage stage;
  final double progress;

  OrderModel({
    required this.id,
    required this.clientName,
    required this.companyName,
    required this.serviceType,
    required this.stage,
    required this.progress,
  });

  factory OrderModel.fromMap(Map<String, dynamic> data, String id) {
    return OrderModel(
      id: id,
      clientName: data['clientName'] ?? '',
      companyName: data['companyName'] ?? '',
      serviceType: data['serviceType'] ?? '',
      stage: OrderStage.values.firstWhere(
        (e) => e.name == data['stage'],
        orElse: () => OrderStage.reqReceived,
      ),
      progress: (data['progress'] ?? 0.0).toDouble(),
    );
  }
}
