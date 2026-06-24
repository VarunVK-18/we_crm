class ChecklistItemModel {
  final String label;
  final bool isChecked;

  ChecklistItemModel({required this.label, required this.isChecked});

  factory ChecklistItemModel.fromMap(Map<String, dynamic> data) {
    return ChecklistItemModel(
      label: data['label']?.toString() ?? '',
      isChecked: data['isChecked'] == true,
    );
  }
}

enum ChecklistStatus { pending, inProgress, completed }

class ChecklistModel {
  final String id;
  final String serviceName;
  final ChecklistStatus status;
  final List<ChecklistItemModel> items;
  final String notes;
  final DateTime? updatedAt;
  final double? dealClosedAmount;
  final String entityName;

  ChecklistModel({
    required this.id,
    required this.serviceName,
    required this.status,
    required this.items,
    this.notes = '',
    this.updatedAt,
    this.dealClosedAmount,
    this.entityName = '',
  });

  /// Progress as a value between 0.0 and 1.0
  double get progress {
    if (items.isEmpty) return 0.0;
    final checked = items.where((i) => i.isChecked).length;
    return checked / items.length;
  }

  /// Number of completed items
  int get completedCount => items.where((i) => i.isChecked).length;

  factory ChecklistModel.fromMap(Map<String, dynamic> data) {
    String id = '';
    final rawId = data['_id'];
    if (rawId is Map && rawId['\$oid'] != null) {
      id = rawId['\$oid'].toString();
    } else if (rawId != null) {
      id = rawId.toString();
    }

    ChecklistStatus status = ChecklistStatus.pending;
    final rawStatus = data['status']?.toString();
    if (rawStatus == 'in_progress') {
      status = ChecklistStatus.inProgress;
    } else if (rawStatus == 'completed') {
      status = ChecklistStatus.completed;
    }

    final rawItems = data['items'];
    final items = rawItems is List
        ? rawItems
            .map((i) => ChecklistItemModel.fromMap(i as Map<String, dynamic>))
            .toList()
        : <ChecklistItemModel>[];

    DateTime? updatedAt;
    if (data['updatedAt'] != null) {
      updatedAt = DateTime.tryParse(data['updatedAt'].toString());
    }

    final details = data['details'] as Map<String, dynamic>? ?? {};
    final entityName = (details['entityName'] ?? 
                        details['companyName'] ?? 
                        details['proposed_company_name'] ?? 
                        details['businessName'] ?? 
                        details['entity_name'] ?? 
                        data['entityName'] ?? 
                        data['companyName'] ?? 
                        '').toString();

    return ChecklistModel(
      id: id,
      serviceName: data['service_name']?.toString() ?? data['checklist_name']?.toString() ?? '',
      status: status,
      items: items,
      notes: data['notes']?.toString() ?? '',
      updatedAt: updatedAt,
      dealClosedAmount: (data['dealClosedAmount'] as num?)?.toDouble(),
      entityName: entityName,
    );
  }
}
