import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;

import '../../core/constants/port.dart';
import '../../core/theme/app_theme.dart';
import '../../models/order_model.dart';
import '../../providers/auth_provider.dart';
import '../../core/widgets/local_document_viewer.dart';

class DpiitFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const DpiitFormScreen({super.key, required this.order});

  @override
  ConsumerState<DpiitFormScreen> createState() => _DpiitFormScreenState();
}

class _DpiitFormScreenState extends ConsumerState<DpiitFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Form Fields
  String _orgDsc = 'Yes';
  final _websiteCtrl = TextEditingController();
  final _briefCtrl = TextEditingController();
  final _directorDetailsCtrl = TextEditingController();
  final _industryCtrl = TextEditingController();
  final _sectorCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _authDetailsCtrl = TextEditingController();
  final _employeesCtrl = TextEditingController();
  final _iprCtrl = TextEditingController();
  String _startupNature = 'Innovative';
  String _receivedFunds = 'No';
  String _receivedAwards = 'No';
  final _problemCtrl = TextEditingController();
  final _solutionCtrl = TextEditingController();
  final _uniquenessCtrl = TextEditingController();
  final _revenueCtrl = TextEditingController();

  bool _isVerified = false;

  // File Paths
  String? _incorpCertPath;
  String? _panPath;
  String? _logoPath;
  String? _pitchDeckPath;

  // 2MB Limit in bytes
  static const int maxFileSize = 2 * 1024 * 1024;

  @override
  void dispose() {
    _websiteCtrl.dispose();
    _briefCtrl.dispose();
    _directorDetailsCtrl.dispose();
    _industryCtrl.dispose();
    _sectorCtrl.dispose();
    _addressCtrl.dispose();
    _authDetailsCtrl.dispose();
    _employeesCtrl.dispose();
    _iprCtrl.dispose();
    _problemCtrl.dispose();
    _solutionCtrl.dispose();
    _uniquenessCtrl.dispose();
    _revenueCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickFile(String type, List<String> allowedExtensions) async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: allowedExtensions,
      );

      if (result != null && result.files.single.path != null) {
        final file = File(result.files.single.path!);
        final size = await file.length();

        if (size > maxFileSize) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'File size exceeds 2 MB. Please upload a smaller file.',
                  style: GoogleFonts.inter(),
                ),
                backgroundColor: Colors.red,
                behavior: SnackBarBehavior.floating,
              ),
            );
          }
          return;
        }

        setState(() {
          switch (type) {
            case 'incorp':
              _incorpCertPath = file.path;
              break;
            case 'pan':
              _panPath = file.path;
              break;
            case 'logo':
              _logoPath = file.path;
              break;
            case 'pitch':
              _pitchDeckPath = file.path;
              break;
          }
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error picking file: $e')),
        );
      }
    }
  }

  void _previewFile(String path, String title) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => LocalDocumentViewer(filePath: path),
      ),
    );
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please fill all required fields.'),
        backgroundColor: Colors.red,
      ));
      return;
    }

    if (!_isVerified) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please check the verification box at the end.'), backgroundColor: Colors.red),
      );
      return;
    }

    if (_incorpCertPath == null || _panPath == null || _logoPath == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please upload all mandatory documents (Incorp Cert, PAN, Logo).'), backgroundColor: Colors.orange),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');

      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/dpiit-form'),
      );

      request.headers['x-user-id'] = uid;

      // Attach text fields
      request.fields['orgDsc'] = _orgDsc;
      request.fields['website'] = _websiteCtrl.text;
      request.fields['brief'] = _briefCtrl.text;
      request.fields['directorDetails'] = _directorDetailsCtrl.text;
      request.fields['industry'] = _industryCtrl.text;
      request.fields['sector'] = _sectorCtrl.text;
      request.fields['address'] = _addressCtrl.text;
      request.fields['authDetails'] = _authDetailsCtrl.text;
      request.fields['employees'] = _employeesCtrl.text;
      request.fields['ipr'] = _iprCtrl.text;
      request.fields['startupNature'] = _startupNature;
      request.fields['receivedFunds'] = _receivedFunds;
      request.fields['receivedAwards'] = _receivedAwards;
      request.fields['problem'] = _problemCtrl.text;
      request.fields['solution'] = _solutionCtrl.text;
      request.fields['uniqueness'] = _uniquenessCtrl.text;
      request.fields['revenue'] = _revenueCtrl.text;

      // Attach files
      if (_incorpCertPath != null) request.files.add(await http.MultipartFile.fromPath('incorpCert', _incorpCertPath!));
      if (_panPath != null) request.files.add(await http.MultipartFile.fromPath('pan', _panPath!));
      if (_logoPath != null) request.files.add(await http.MultipartFile.fromPath('logo', _logoPath!));
      if (_pitchDeckPath != null) request.files.add(await http.MultipartFile.fromPath('pitchDeck', _pitchDeckPath!));

      final response = await request.send();
      if (response.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('DPIIT Form submitted successfully!'), backgroundColor: Colors.green),
          );
          Navigator.pop(context, true); // Return true to refresh parent
        }
      } else {
        throw Exception('Failed to submit form: ${response.statusCode}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Submission error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: Text(
          'DPIIT Service Form',
          style: GoogleFonts.outfit(color: AppTheme.deepTeal, fontWeight: FontWeight.w800),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppTheme.deepTeal),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              physics: const BouncingScrollPhysics(),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Please provide the required details for DPIIT Startup India Registration.',
                      style: GoogleFonts.inter(fontSize: 14, color: Colors.grey.shade600),
                    ),
                    const SizedBox(height: 24),

                    // Organization DSC
                    _buildLabel('Do you have Organization DSC? *'),
                    _buildDropdown(
                      value: _orgDsc,
                      items: ['Yes', 'No, I want one'],
                      onChanged: (v) => setState(() => _orgDsc = v!),
                    ),
                    const SizedBox(height: 16),

                    _buildTextField('Website link *', _websiteCtrl),
                    _buildTextField('Brief about Company *', _briefCtrl, maxLines: 3),
                    _buildTextField('Director details (Name, email ID, Mobile) *', _directorDetailsCtrl, maxLines: 2),
                    _buildTextField('Industry *', _industryCtrl),
                    _buildTextField('Sector *', _sectorCtrl),
                    _buildTextField('Official Address of the Company *', _addressCtrl, maxLines: 3),
                    _buildTextField('Authorization details (Name, PAN, mobile, email, designation) *', _authDetailsCtrl, maxLines: 3),
                    _buildTextField('Current number of employees *', _employeesCtrl, keyboardType: TextInputType.number),
                    _buildTextField('Applied for IPR? (Mention if any) *', _iprCtrl),

                    // Startup Nature
                    _buildLabel('Nature of startup *'),
                    _buildDropdown(
                      value: _startupNature,
                      items: ['Innovative', 'Scalable'],
                      onChanged: (v) => setState(() => _startupNature = v!),
                    ),
                    const SizedBox(height: 16),

                    // Funds & Awards
                    _buildLabel('Received any Funds? *'),
                    _buildDropdown(
                      value: _receivedFunds,
                      items: ['Yes', 'No'],
                      onChanged: (v) => setState(() => _receivedFunds = v!),
                    ),
                    const SizedBox(height: 16),

                    _buildLabel('Received any Awards? *'),
                    _buildDropdown(
                      value: _receivedAwards,
                      items: ['Yes', 'No'],
                      onChanged: (v) => setState(() => _receivedAwards = v!),
                    ),
                    const SizedBox(height: 16),

                    _buildTextField('What is the problem startup solving? *', _problemCtrl, maxLines: 4, maxLength: 400),
                    _buildTextField('How does your startup propose to solve the problem? *', _solutionCtrl, maxLines: 4, maxLength: 400),
                    _buildTextField('What uniqueness of solution? *', _uniquenessCtrl, maxLines: 4, maxLength: 400),
                    _buildTextField('Have your Startup generated revenue? (Mention last year revenue) *', _revenueCtrl, maxLines: 3, maxLength: 400),

                    const SizedBox(height: 24),
                    Text(
                      'Please verify the documents before uploading, later we can\'t change the application. (Max 2MB per file)',
                      style: GoogleFonts.inter(fontSize: 13, color: Colors.orange.shade800, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 16),

                    _buildFileUploadBox('Incorporation Certificate (PDF) *', 'incorp', _incorpCertPath, ['pdf']),
                    _buildFileUploadBox('Company PAN *', 'pan', _panPath, ['pdf', 'jpg', 'jpeg', 'png']),
                    _buildFileUploadBox('Company logo (JPEG) *', 'logo', _logoPath, ['jpg', 'jpeg']),
                    _buildFileUploadBox('Pitch deck (PDF)', 'pitch', _pitchDeckPath, ['pdf']),

                    const SizedBox(height: 24),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(
                          width: 24,
                          height: 24,
                          child: Checkbox(
                            value: _isVerified,
                            activeColor: AppTheme.corporateBlue,
                            onChanged: (v) => setState(() => _isVerified = v!),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'I here verify that above mentioned facts are true and correct to best of my knowledge and belief, and understood that later the modifications and changes might affect the process and leads to fresh application',
                            style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade700, height: 1.5),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton(
                        onPressed: _submitForm,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.corporateBlue,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text('Submit Details', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                      ),
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.deepTeal),
      ),
    );
  }

  Widget _buildTextField(
    String label,
    TextEditingController controller, {
    int maxLines = 1,
    TextInputType keyboardType = TextInputType.text,
    int? maxLength,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildLabel(label),
          TextFormField(
            controller: controller,
            maxLines: maxLines,
            maxLength: maxLength,
            keyboardType: keyboardType,
            style: GoogleFonts.inter(fontSize: 14),
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.black, width: 1.5)),
              contentPadding: const EdgeInsets.all(16),
            ),
            validator: (value) {
              if (label.contains('*') && (value == null || value.trim().isEmpty)) {
                return 'This field is required';
              }
              return null;
            },
          ),
        ],
      ),
    );
  }

  Widget _buildDropdown({required String value, required List<String> items, required void Function(String?) onChanged}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          items: items.map((e) => DropdownMenuItem(value: e, child: Text(e, style: GoogleFonts.inter(fontSize: 14)))).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildFileUploadBox(String label, String type, String? path, List<String> allowedExtensions) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildLabel(label),
          if (path == null)
            InkWell(
              onTap: () => _pickFile(type, allowedExtensions),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 20),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade300, style: BorderStyle.solid),
                ),
                child: Column(
                  children: [
                    Icon(LucideIcons.uploadCloud, color: AppTheme.corporateBlue.withOpacity(0.5)),
                    const SizedBox(height: 8),
                    Text('Tap to select file', style: GoogleFonts.inter(color: Colors.grey.shade600, fontSize: 13)),
                  ],
                ),
              ),
            )
          else
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.corporateBlue),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.fileText, color: AppTheme.corporateBlue, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      path.split('/').last.split('\\').last,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.deepTeal),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(LucideIcons.eye, color: AppTheme.corporateBlue, size: 20),
                    onPressed: () => _previewFile(path, label.replaceAll('*', '').trim()),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                  const SizedBox(width: 16),
                  IconButton(
                    icon: const Icon(LucideIcons.trash2, color: Colors.red, size: 20),
                    onPressed: () {
                      setState(() {
                        if (type == 'incorp') _incorpCertPath = null;
                        if (type == 'pan') _panPath = null;
                        if (type == 'logo') _logoPath = null;
                        if (type == 'pitch') _pitchDeckPath = null;
                      });
                    },
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
