import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;
import '../core/constants/port.dart';
import 'auth_provider.dart';

// ─── Model ──────────────────────────────────────────────────────────────────

class EntityDocRef {
  final String docId;
  final String docName;
  const EntityDocRef({required this.docId, required this.docName});
  bool get isEmpty => docId.isEmpty;
}

class EntityProfile {
  // Text fields
  final String entityName;
  final String pan;
  final String email;
  final String phone;
  final String address;
  final String cin;
  final String gstin;
  final String directorName;
  final String directorEmail;
  final String directorPhone;
  final String directorPan;
  final String directorDin;
  final String bankAccount;
  final String bankIfsc;
  final String bankName;

  // Document references
  final EntityDocRef panCardDoc;
  final EntityDocRef aadhaarDoc;
  final EntityDocRef incorpCertDoc;
  final EntityDocRef addressProofDoc;
  final EntityDocRef directorPanDoc;
  final EntityDocRef directorPhotoDoc;
  final EntityDocRef bankDoc;
  final EntityDocRef gstDoc;

  const EntityProfile({
    this.entityName = '',
    this.pan = '',
    this.email = '',
    this.phone = '',
    this.address = '',
    this.cin = '',
    this.gstin = '',
    this.directorName = '',
    this.directorEmail = '',
    this.directorPhone = '',
    this.directorPan = '',
    this.directorDin = '',
    this.bankAccount = '',
    this.bankIfsc = '',
    this.bankName = '',
    this.panCardDoc = const EntityDocRef(docId: '', docName: ''),
    this.aadhaarDoc = const EntityDocRef(docId: '', docName: ''),
    this.incorpCertDoc = const EntityDocRef(docId: '', docName: ''),
    this.addressProofDoc = const EntityDocRef(docId: '', docName: ''),
    this.directorPanDoc = const EntityDocRef(docId: '', docName: ''),
    this.directorPhotoDoc = const EntityDocRef(docId: '', docName: ''),
    this.bankDoc = const EntityDocRef(docId: '', docName: ''),
    this.gstDoc = const EntityDocRef(docId: '', docName: ''),
  });

  factory EntityProfile.fromMap(Map<String, dynamic> m) {
    return EntityProfile(
      entityName: m['entityName'] ?? '',
      pan: m['pan'] ?? '',
      email: m['email'] ?? '',
      phone: m['phone'] ?? '',
      address: m['address'] ?? '',
      cin: m['cin'] ?? '',
      gstin: m['gstin'] ?? '',
      directorName: m['directorName'] ?? '',
      directorEmail: m['directorEmail'] ?? '',
      directorPhone: m['directorPhone'] ?? '',
      directorPan: m['directorPan'] ?? '',
      directorDin: m['directorDin'] ?? '',
      bankAccount: m['bankAccount'] ?? '',
      bankIfsc: m['bankIfsc'] ?? '',
      bankName: m['bankName'] ?? '',
      panCardDoc: EntityDocRef(docId: m['panCardDocId'] ?? '', docName: m['panCardDocName'] ?? ''),
      aadhaarDoc: EntityDocRef(docId: m['aadhaarDocId'] ?? '', docName: m['aadhaarDocName'] ?? ''),
      incorpCertDoc: EntityDocRef(docId: m['incorpCertDocId'] ?? '', docName: m['incorpCertDocName'] ?? ''),
      addressProofDoc: EntityDocRef(docId: m['addressProofDocId'] ?? '', docName: m['addressProofDocName'] ?? ''),
      directorPanDoc: EntityDocRef(docId: m['directorPanDocId'] ?? '', docName: m['directorPanDocName'] ?? ''),
      directorPhotoDoc: EntityDocRef(docId: m['directorPhotoDocId'] ?? '', docName: m['directorPhotoDocName'] ?? ''),
      bankDoc: EntityDocRef(docId: m['bankDocId'] ?? '', docName: m['bankDocName'] ?? ''),
      gstDoc: EntityDocRef(docId: m['gstDocId'] ?? '', docName: m['gstDocName'] ?? ''),
    );
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

class EntityCacheService {
  /// Fetch the entity profile from backend
  Future<EntityProfile> fetchProfile(String uid) async {
    try {
      final response = await http.get(
        Uri.parse('$kBaseUrl/api/entity-profile'),
        headers: {'x-user-id': uid},
      ).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final raw = data['profile'];
        if (raw is Map<String, dynamic>) {
          return EntityProfile.fromMap(raw);
        }
      }
    } catch (_) {}
    return const EntityProfile();
  }

  /// Save text fields to the entity profile (only non-empty values)
  Future<void> saveTextFields(String uid, Map<String, String> fields) async {
    try {
      // Remove empty values — backend also ignores them, but skip the round-trip
      final body = <String, String>{};
      for (final e in fields.entries) {
        if (e.value.isNotEmpty) body[e.key] = e.value;
      }
      if (body.isEmpty) return;
      await http.put(
        Uri.parse('$kBaseUrl/api/entity-profile'),
        headers: {'x-user-id': uid, 'Content-Type': 'application/json'},
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 10));
    } catch (_) {}
  }

  /// Upload/replace a document in the entity profile.
  /// [docKey] is one of: panCard, aadhaar, incorpCert, addressProof,
  ///                     directorPan, directorPhoto, bank, gst
  /// Returns the new [docId] on success, or empty string on failure.
  Future<Map<String, String>> uploadDocument({
    required String uid,
    required String docKey,
    required String filePath,
    required String fileName,
  }) async {
    try {
      final request = http.MultipartRequest(
        'PUT',
        Uri.parse('$kBaseUrl/api/entity-profile/document/$docKey'),
      );
      request.headers['x-user-id'] = uid;
      request.files.add(await http.MultipartFile.fromPath('file', filePath, filename: fileName));
      final streamed = await request.send().timeout(const Duration(seconds: 30));
      final body = await streamed.stream.bytesToString();
      if (streamed.statusCode == 200) {
        final data = jsonDecode(body) as Map<String, dynamic>;
        return {
          'docId': data['docId']?.toString() ?? '',
          'docName': data['docName']?.toString() ?? '',
        };
      }
    } catch (_) {}
    return {'docId': '', 'docName': ''};
  }
}

// ─── Providers ───────────────────────────────────────────────────────────────

final entityCacheServiceProvider = Provider<EntityCacheService>((ref) {
  return EntityCacheService();
});

/// Fetches the entity profile once per session (cached by Riverpod)
final entityProfileProvider = FutureProvider<EntityProfile>((ref) async {
  final uid = ref.watch(authStateProvider).value?.uid;
  if (uid == null) return const EntityProfile();
  return ref.read(entityCacheServiceProvider).fetchProfile(uid);
});
