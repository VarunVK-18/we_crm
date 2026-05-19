enum UserRole {
  customer,
}

class UserModel {
  final String id;
  final String name;
  final String email;
  final String phone;
  final UserRole role;
  final String companyName;
  final List<String> services;
  final DateTime? createdAt;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    this.companyName = '',
    this.services = const [],
    this.createdAt,
  });

  factory UserModel.fromMap(Map<String, dynamic> data, [String? id]) {
    // Handle MongoDB $oid structure for ID
    String extractedId = id ?? '';
    if (data['_id'] != null) {
      if (data['_id'] is Map && data['_id']['\$oid'] != null) {
        extractedId = data['_id']['\$oid'].toString();
      } else {
        extractedId = data['_id'].toString();
      }
    } else if (data['id'] != null) {
      extractedId = data['id'].toString();
    }

    // Handle MongoDB $date structure for createdAt
    DateTime? extractedDate;
    if (data['createdAt'] != null) {
      if (data['createdAt'] is Map && data['createdAt']['\$date'] != null) {
        extractedDate = DateTime.tryParse(data['createdAt']['\$date'].toString());
      } else {
        extractedDate = DateTime.tryParse(data['createdAt'].toString());
      }
    }

    return UserModel(
      id: extractedId,
      name: data['owner_name']?.toString() ?? data['name']?.toString() ?? 'User',
      email: data['email']?.toString() ?? '',
      phone: data['phone']?.toString() ?? '',
      companyName: data['company_name']?.toString() ?? '',
      services: data['services'] != null ? List<String>.from(data['services']) : [],
      role: UserRole.values.firstWhere(
        (e) => e.name == data['role']?.toString(),
        orElse: () => UserRole.customer,
      ),
      createdAt: extractedDate,
    );
  }

  bool get isCustomer => role == UserRole.customer;
}
