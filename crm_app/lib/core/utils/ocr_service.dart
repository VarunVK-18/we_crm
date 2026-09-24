// ignore_for_file: deprecated_member_use
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: unnecessary_brace_in_string_interps
import 'dart:convert';
import 'package:http/http.dart' as http_pkg;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';
import '../constants/port.dart';

class OcrService {
  final String uid;

  OcrService(this.uid);

  Future<String?> extractId(String filePath, String docType) async {
    try {
      final request = http_pkg.MultipartRequest('POST', Uri.parse('$kBaseUrl/api/extract-ocr'));
      request.headers['x-user-id'] = uid;
      request.fields['docType'] = docType; // 'pan' or 'aadhaar'
      request.files.add(await http_pkg.MultipartFile.fromPath('document', filePath));

      final streamedResponse = await request.send().timeout(const Duration(seconds: 15));
      final response = await http_pkg.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data['extractedNumber'];
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<Map<String, dynamic>> validateDocument(String filePath, String fieldName) async {
    try {
      final request = http_pkg.MultipartRequest('POST', Uri.parse('$kBaseUrl/api/ocr/validate'));
      request.headers['x-user-id'] = uid;
      request.fields['fieldName'] = fieldName;
      request.files.add(await http_pkg.MultipartFile.fromPath('file', filePath));

      final streamedResponse = await request.send().timeout(const Duration(seconds: 25));
      final response = await http_pkg.Response.fromStream(streamedResponse);
      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': data['success'] ?? true, 'message': data['message'] ?? 'Validation passed'};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Invalid document.'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Failed to validate document. Please upload a clear and correct valid document.'};
    }
  }
}

final ocrServiceProvider = Provider<OcrService>((ref) {
  final uid = ref.watch(authStateProvider).value?.uid ?? '';
  return OcrService(uid);
});
