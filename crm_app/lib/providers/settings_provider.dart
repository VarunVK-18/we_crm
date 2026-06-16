import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import '../core/constants/port.dart';
import 'auth_provider.dart';

/// Company settings including GST/CGST tax rates
class CompanySettings {
  final double gstPercentage;
  final double cgstPercentage;

  const CompanySettings({
    this.gstPercentage = 18.0,
    this.cgstPercentage = 9.0,
  });

  factory CompanySettings.fromJson(Map<String, dynamic> json) {
    return CompanySettings(
      gstPercentage: (json['gst_percentage'] ?? json['default_filing_tax'] ?? 18).toDouble(),
      cgstPercentage: (json['cgst_percentage'] ?? 9).toDouble(),
    );
  }

  double get sgstPercentage => cgstPercentage; // SGST = CGST
}

final companySettingsProvider = FutureProvider<CompanySettings>((ref) async {
  final uid = ref.watch(authStateProvider).value?.uid;
  if (uid == null) return const CompanySettings();

  try {
    final response = await http.get(
      Uri.parse('$kBaseUrl/api/settings'),
      headers: {'x-user-id': uid},
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true && data['settings'] != null) {
        return CompanySettings.fromJson(data['settings']);
      }
    }
  } catch (e) {
    // Return defaults on error
  }

  return const CompanySettings();
});
