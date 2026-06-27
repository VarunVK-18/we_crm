import 'dart:convert';
import 'package:flutter/material.dart';
import '../../providers/draft_provider.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;

import '../../core/constants/port.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/validation_utils.dart';
import '../../models/order_model.dart';
import '../../providers/auth_provider.dart';

class Director360FormData {
  final TextEditingController fullNameController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController phoneController = TextEditingController();

  final FocusNode emailFocus = FocusNode();
  final FocusNode phoneFocus = FocusNode();

  String? photoPath;
  String? aadhaarPath;
  String? panPath;
  String? dinApprovalPath;

  Map<String, dynamic> toJson() {
    return {
      'fullName': fullNameController.text,
      'email': emailController.text,
      'phone': phoneController.text,
    };
  }

  void dispose() {
    fullNameController.dispose();
    emailController.dispose();
    phoneController.dispose();
    emailFocus.dispose();
    phoneFocus.dispose();
  }
}

class Compliance360FormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const Compliance360FormScreen({super.key, required this.order});

  @override
  ConsumerState<Compliance360FormScreen> createState() => _Compliance360FormScreenState();
}

class _Compliance360FormScreenState extends ConsumerState<Compliance360FormScreen> {
  final _companyNameController = TextEditingController();
  final _companyEmailController = TextEditingController();
  final _companyPhoneController = TextEditingController();

  final FocusNode _companyEmailFocus = FocusNode();
  final FocusNode _companyPhoneFocus = FocusNode();
  final ScrollController _scrollController = ScrollController();

  String? _incorpCertPath;
  String? _companyPanPath;
  String? _aoaPath;
  String? _moaPath;

  late final List<Director360FormData> _directors;
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    final assignedNumStr = widget.order.details['assignedNumberOfDirectors']?.toString();
    final numStr = assignedNumStr ?? widget.order.details['numberOfDirectors']?.toString() ?? '1';
    final int count = int.tryParse(numStr) ?? 1;
    _directors = List.generate(count, (_) => Director360FormData());
  }

  @override
  void dispose() {
    _companyNameController.dispose();
    _companyEmailController.dispose();
    _companyPhoneController.dispose();
    for (var d in _directors) {
      d.dispose();
    }
    _companyEmailFocus.dispose();
    _companyPhoneFocus.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _pickFile(Function(String?) onPicked) async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
      );
      if (result != null) {
        final path = result.files.single.path;
        if (path != null) {
          final size = await result.files.single.size;
          if (size > 10 * 1024 * 1024) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('File must be less than 10MB'), backgroundColor: Colors.red),
              );
            }
            return;
          }
          setState(() => onPicked(path));
        }
      }
    } catch (e) {
      debugPrint('Error picking file: $e');
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) {
      _scrollToTop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all required fields correctly.'), backgroundColor: Colors.red),
      );
      return;
    }

    if (_incorpCertPath == null || _companyPanPath == null || _aoaPath == null || _moaPath == null) {
      _scrollToTop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please upload all required company documents.'), backgroundColor: Colors.red),
      );
      return;
    }

    for (var i = 0; i < _directors.length; i++) {
      final d = _directors[i];
      if (d.photoPath == null || d.aadhaarPath == null || d.panPath == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Please upload required documents for Director ${i + 1}'), backgroundColor: Colors.red),
        );
        return;
      }
    }

    setState(() => _isLoading = true);

    try {
      final uri = Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-360-compliance-form');
      final request = http.MultipartRequest('POST', uri);

      final uid = ref.read(authStateProvider).value?.uid;
      if (uid != null) {
        request.headers['x-user-id'] = uid;
      }

      final Map<String, dynamic> formData = {
        'companyName': _companyNameController.text,
        'companyEmail': _companyEmailController.text,
        'companyPhone': _companyPhoneController.text,
        'directors': _directors.map((d) => d.toJson()).toList(),
      };

      request.fields['formData'] = jsonEncode(formData);

      request.files.add(await http.MultipartFile.fromPath('incorp_cert', _incorpCertPath!));
      request.files.add(await http.MultipartFile.fromPath('company_pan', _companyPanPath!));
      request.files.add(await http.MultipartFile.fromPath('aoa', _aoaPath!));
      request.files.add(await http.MultipartFile.fromPath('moa', _moaPath!));

      for (var i = 0; i < _directors.length; i++) {
        final d = _directors[i];
        if (d.photoPath != null) request.files.add(await http.MultipartFile.fromPath('dir_${i + 1}_photo', d.photoPath!));
        if (d.aadhaarPath != null) request.files.add(await http.MultipartFile.fromPath('dir_${i + 1}_aadhaar', d.aadhaarPath!));
        if (d.panPath != null) request.files.add(await http.MultipartFile.fromPath('dir_${i + 1}_pan', d.panPath!));
        if (d.dinApprovalPath != null) request.files.add(await http.MultipartFile.fromPath('dir_${i + 1}_din', d.dinApprovalPath!));
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Form submitted successfully!'), backgroundColor: Colors.green),
          );
          Navigator.pop(context, true);
        }
      } else {
        throw Exception('Failed to submit form: ${response.body}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _scrollToTop() {
    _scrollController.animateTo(0, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text(
          '360° Compliance Form',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 18),
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: Stack(
        children: [
          Form(
            key: _formKey,
            child: ListView(
              controller: _scrollController,
              padding: const EdgeInsets.only(bottom: 100),
              children: [
                _buildIntroHeader(),
                _buildCompanySection(),
                for (var i = 0; i < _directors.length; i++) _buildDirectorSection(i),
              ],
            ),
          ),
          if (_isLoading)
            Container(
              color: Colors.black54,
              child: const Center(child: CircularProgressIndicator(color: AppTheme.corporateBlue)),
            ),
        ],
      ),
      bottomSheet: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _submitForm,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(
              _isLoading ? 'Submitting...' : 'Submit Details',
              style: GoogleFonts.outfit(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildIntroHeader() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.corporateBlue.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.corporateBlue.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Please provide your details correctly, We can't change it later!",
            style: GoogleFonts.outfit(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppTheme.corporateBlue,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "We'll take care the rest, you'll receive all the communications in whatsapp or call regularly",
            style: GoogleFonts.outfit(
              fontSize: 14,
              color: Colors.grey[700],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompanySection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: AppTheme.deepTeal,
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Text(
              'Company Details',
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildTextField('Company Legal Name', _companyNameController, LucideIcons.building, isRequired: true),
                const SizedBox(height: 20),
                _buildTextField('Company Phone number', _companyPhoneController, LucideIcons.phone,
                    keyboardType: TextInputType.phone, focusNode: _companyPhoneFocus, isRequired: true),
                const SizedBox(height: 20),
                _buildTextField('Company Mail ID', _companyEmailController, LucideIcons.mail,
                    keyboardType: TextInputType.emailAddress, focusNode: _companyEmailFocus, isRequired: true),
                const SizedBox(height: 24),
                _buildFileUpload('Company Incorporation Certificate', _incorpCertPath, (p) => _incorpCertPath = p, isRequired: true),
                const SizedBox(height: 20),
                _buildFileUpload('Company PAN', _companyPanPath, (p) => _companyPanPath = p, isRequired: true),
                const SizedBox(height: 20),
                _buildFileUpload('Upload AOA', _aoaPath, (p) => _aoaPath = p, isRequired: true),
                const SizedBox(height: 20),
                _buildFileUpload('Upload MOA', _moaPath, (p) => _moaPath = p, isRequired: true),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDirectorSection(int index) {
    final d = _directors[index];
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: AppTheme.corporateBlue,
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Text(
              'Director ${index + 1} : Details',
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildTextField('Full Name', d.fullNameController, LucideIcons.user, isRequired: true),
                const SizedBox(height: 20),
                _buildTextField('Mobile Number (Registered in MCA)', d.phoneController, LucideIcons.phone,
                    keyboardType: TextInputType.phone, focusNode: d.phoneFocus, isRequired: true),
                const SizedBox(height: 20),
                _buildTextField('Mail ID (Registered in MCA)', d.emailController, LucideIcons.mail,
                    keyboardType: TextInputType.emailAddress, focusNode: d.emailFocus, isRequired: true),
                const SizedBox(height: 24),
                _buildFileUpload('Upload Photo', d.photoPath, (p) => d.photoPath = p, isRequired: true),
                const SizedBox(height: 20),
                _buildFileUpload('Upload Aadhaar', d.aadhaarPath, (p) => d.aadhaarPath = p, isRequired: true),
                const SizedBox(height: 20),
                _buildFileUpload('Upload PAN', d.panPath, (p) => d.panPath = p, isRequired: true),
                const SizedBox(height: 20),
                _buildFileUpload('Upload DIN Approval Letter', d.dinApprovalPath, (p) => d.dinApprovalPath = p, isRequired: false),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField(
    String label,
    TextEditingController controller,
    IconData icon, {
    bool isRequired = false,
    TextInputType keyboardType = TextInputType.text,
    FocusNode? focusNode,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RichText(
          text: TextSpan(
            text: label,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Colors.grey[700],
            ),
            children: [
              if (isRequired)
                const TextSpan(
                  text: ' *',
                  style: TextStyle(color: Colors.red),
                ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          focusNode: focusNode,
          keyboardType: keyboardType,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Colors.black,
          ),
          decoration: InputDecoration(
            prefixIcon: Icon(icon, size: 20, color: Colors.grey[400]),
            hintText: 'Enter ${label.replaceAll(' *', '')}',
            hintStyle: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w400,
              color: Colors.grey[400],
            ),
            filled: true,
            fillColor: Colors.grey[50],
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[200]!),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[200]!),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppTheme.corporateBlue),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
          validator: isRequired
              ? (value) {
                  if (value == null || value.trim().isEmpty) return 'This field is required';
                  if (label.contains('Phone') && !ValidationUtils.isValidPhone(value)) {
                    return 'Enter a valid 10-digit number';
                  }
                  if (label.contains('Mail ID') && !ValidationUtils.isValidEmail(value)) {
                    return 'Enter a valid email address';
                  }
                  return null;
                }
              : null,
        ),
      ],
    );
  }

  Widget _buildFileUpload(
    String label,
    String? currentPath,
    Function(String?) onPicked, {
    bool isRequired = false,
  }) {
    final fileName = currentPath?.split('/').last ?? 'Upload 1 supported file. Max 10 MB.';
    final isUploaded = currentPath != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RichText(
          text: TextSpan(
            text: label,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Colors.grey[700],
            ),
            children: [
              if (isRequired)
                const TextSpan(
                  text: ' *',
                  style: TextStyle(color: Colors.red),
                ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: () => _pickFile(onPicked),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
              color: isUploaded ? AppTheme.corporateBlue.withOpacity(0.05) : Colors.grey[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isUploaded ? AppTheme.corporateBlue.withOpacity(0.3) : Colors.grey[200]!,
                style: BorderStyle.solid,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  isUploaded ? LucideIcons.fileCheck : LucideIcons.upload,
                  size: 20,
                  color: isUploaded ? AppTheme.corporateBlue : Colors.grey[400],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    fileName,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: isUploaded ? FontWeight.w500 : FontWeight.w400,
                      color: isUploaded ? AppTheme.corporateBlue : Colors.grey[500],
                    ),
                  ),
                ),
                if (isUploaded)
                  InkWell(
                    onTap: () => setState(() => onPicked(null)),
                    child: const Icon(LucideIcons.x, size: 18, color: Colors.grey),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
