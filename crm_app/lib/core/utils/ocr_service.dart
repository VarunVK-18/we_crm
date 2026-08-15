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
}

final ocrServiceProvider = Provider<OcrService>((ref) {
  final uid = ref.watch(authStateProvider).value?.uid ?? '';
  return OcrService(uid);
});
