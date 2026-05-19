class DscOrder {
  final String id;
  final String clientUid;
  final String name;
  final String type;
  final String stage;
  final double progress;
  final bool isCompleted;

  const DscOrder({
    required this.id,
    required this.clientUid,
    required this.name,
    required this.type,
    required this.stage,
    required this.progress,
    required this.isCompleted,
  });

  factory DscOrder.fromMap(Map<String, dynamic> data, String id) {
    return DscOrder(
      id: id,
      clientUid: data['clientUid']?.toString() ?? '',
      name: data['name']?.toString() ?? '',
      type: data['type']?.toString() ?? '',
      stage: data['stage']?.toString() ?? '',
      progress: (data['progress'] ?? 0.0).toDouble(),
      isCompleted: data['isCompleted'] == true,
    );
  }

  Map<String, dynamic> toMap() => {
    'clientUid': clientUid,
    'name': name,
    'type': type,
    'stage': stage,
    'progress': progress,
    'isCompleted': isCompleted,
  };
}
