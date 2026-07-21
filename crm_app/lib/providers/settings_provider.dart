import 'package:crm_app/core/utils/error_handler.dart';
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;
import '../core/constants/port.dart';
import 'auth_provider.dart';

class BankDetails {
  final String bankName;
  final String accountNumber;
  final String ifsc;
  final String branchName;

  const BankDetails({
    this.bankName = '',
    this.accountNumber = '',
    this.ifsc = '',
    this.branchName = '',
  });

  factory BankDetails.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const BankDetails();
    return BankDetails(
      bankName: json['bank_name']?.toString() ?? '',
      accountNumber: json['account_number']?.toString() ?? '',
      ifsc: json['ifsc']?.toString() ?? '',
      branchName: json['branch_name']?.toString() ?? '',
    );
  }
}

class CompanyDetails {
  final String companyName;
  final String gstin;
  final String phone;
  final String address;

  const CompanyDetails({
    this.companyName = '',
    this.gstin = '',
    this.phone = '',
    this.address = '',
  });

  factory CompanyDetails.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const CompanyDetails();
    return CompanyDetails(
      companyName: json['company_name']?.toString() ?? '',
      gstin: json['gstin']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
    );
  }
}

/// Company settings including GST/CGST tax rates
class CompanySettings {
  final double gstPercentage;
  final double cgstPercentage;
  final BankDetails bankDetails;
  final CompanyDetails companyDetails;

  const CompanySettings({
    this.gstPercentage = 18.0,
    this.cgstPercentage = 9.0,
    this.bankDetails = const BankDetails(),
    this.companyDetails = const CompanyDetails(),
  });

  factory CompanySettings.fromJson(Map<String, dynamic> json, Map<String, dynamic>? companyJson) {
    return CompanySettings(
      gstPercentage: (json['gst_percentage'] ?? json['default_filing_tax'] ?? 18).toDouble(),
      cgstPercentage: (json['cgst_percentage'] ?? 9).toDouble(),
      bankDetails: BankDetails.fromJson(json['bank_details'] as Map<String, dynamic>?),
      companyDetails: CompanyDetails.fromJson(companyJson),
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
        return CompanySettings.fromJson(data['settings'], data['company']);
      }
    }
  } catch (e) {
      showGlobalError(e);
    // Return defaults on error
  }

  return const CompanySettings();
});
