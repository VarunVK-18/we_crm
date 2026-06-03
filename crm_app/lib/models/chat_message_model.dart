class ChatMessage {
  final String id;
  final String orderId;
  final String senderId;
  final String senderName;
  final String senderRole;
  final String content;
  final DateTime timestamp;
  final bool seen;

  ChatMessage({
    required this.id,
    required this.orderId,
    required this.senderId,
    required this.senderName,
    required this.senderRole,
    required this.content,
    required this.timestamp,
    this.seen = false,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    final sender = json['senderId'] as Map<String, dynamic>? ?? {};
    return ChatMessage(
      id: json['_id']?.toString() ?? '',
      orderId: json['orderId']?.toString() ?? '',
      senderId: sender['_id']?.toString() ?? json['senderId']?.toString() ?? '',
      senderName: sender['owner_name']?.toString() ?? 'User',
      senderRole: json['senderRole']?.toString() ?? 'client',
      content: json['content']?.toString() ?? '',
      timestamp: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'].toString()).toLocal()
          : DateTime.now(),
      seen: json['seen'] ?? false,
    );
  }
}
