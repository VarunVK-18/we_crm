enum UserRole {
  customer,
}

class ClientEntity {
  final String entityName;
  final String entityType;
  final String cin;
  final String pan;
  final String tan;
  final String gstin;
  final String iso;
  final String msme;
  final String fssai;
  final String coi;
  final String dsc;
  final String trademarkApplicationNumber;
  final String trademarkStatus;
  final String trademarkCertificate;
  final String patentApplicationNumber;
  final String patentStatus;
  final String patentNumber;
  final String copyrightRegistrationNumber;
  final String copyrightCertificate;

  ClientEntity({
    required this.entityName,
    required this.entityType,
    required this.cin,
    required this.pan,
    required this.tan,
    required this.gstin,
    required this.iso,
    required this.msme,
    required this.fssai,
    required this.coi,
    required this.dsc,
    required this.trademarkApplicationNumber,
    required this.trademarkStatus,
    required this.trademarkCertificate,
    required this.patentApplicationNumber,
    required this.patentStatus,
    required this.patentNumber,
    required this.copyrightRegistrationNumber,
    required this.copyrightCertificate,
  });

  factory ClientEntity.fromMap(Map<String, dynamic> data) {
    return ClientEntity(
      entityName: data['entityName']?.toString() ?? '',
      entityType: data['entityType']?.toString() ?? '',
      cin: data['cin']?.toString() ?? '',
      pan: data['pan']?.toString() ?? '',
      tan: data['tan']?.toString() ?? '',
      gstin: data['gstin']?.toString() ?? '',
      iso: data['iso']?.toString() ?? '',
      msme: data['msme']?.toString() ?? '',
      fssai: data['fssai']?.toString() ?? '',
      coi: data['coi']?.toString() ?? '',
      dsc: data['dsc']?.toString() ?? '',
      trademarkApplicationNumber: data['trademarkApplicationNumber']?.toString() ?? '',
      trademarkStatus: data['trademarkStatus']?.toString() ?? '',
      trademarkCertificate: data['trademarkCertificate']?.toString() ?? '',
      patentApplicationNumber: data['patentApplicationNumber']?.toString() ?? '',
      patentStatus: data['patentStatus']?.toString() ?? '',
      patentNumber: data['patentNumber']?.toString() ?? '',
      copyrightRegistrationNumber: data['copyrightRegistrationNumber']?.toString() ?? '',
      copyrightCertificate: data['copyrightCertificate']?.toString() ?? '',
    );
  }
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
  final String profileImage;
  final Map<String, dynamic>? manager;
  final List<ClientEntity> clientEntities;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    this.companyName = '',
    this.services = const [],
    this.createdAt,
    this.profileImage = '',
    this.manager,
    this.clientEntities = const [],
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

    Map<String, dynamic>? extractedManager;
    if (data['client_manager'] != null && data['client_manager'] is Map) {
      extractedManager = {
        'name': data['client_manager']['owner_name']?.toString() ?? data['client_manager']['name']?.toString() ?? 'Support Team',
        'email': data['client_manager']['email']?.toString() ?? 'support@example.com',
        'phone': data['client_manager']['phone']?.toString() ?? '+918000000000',
      };
    } else if (data['assigned_to'] != null && data['assigned_to'] is Map) {
      extractedManager = {
        'name': data['assigned_to']['owner_name']?.toString() ?? data['assigned_to']['name']?.toString() ?? 'Support Team',
        'email': data['assigned_to']['email']?.toString() ?? 'support@example.com',
        'phone': data['assigned_to']['phone']?.toString() ?? '+918000000000',
      };
    }

    List<ClientEntity> extractedEntities = [];
    if (data['client_entities'] != null && data['client_entities'] is List) {
      extractedEntities = (data['client_entities'] as List)
          .map((e) => ClientEntity.fromMap(e as Map<String, dynamic>))
          .toList();
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
      profileImage: data['profile_image']?.toString() ?? '',
      manager: extractedManager,
      clientEntities: extractedEntities,
    );
  }

  bool get isCustomer => role == UserRole.customer;
}
