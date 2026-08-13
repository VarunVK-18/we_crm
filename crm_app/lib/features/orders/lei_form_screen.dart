import 'package:crm_app/core/theme/app_theme.dart';
import 'package:crm_app/providers/auth_provider.dart';
import 'package:crm_app/core/constants/port.dart';
import 'package:crm_app/core/utils/error_handler.dart';
import 'package:crm_app/core/utils/file_picker_util.dart';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../../providers/draft_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;

import '../../core/constants/port.dart';
import '../../core/theme/app_theme.dart';
import '../../models/order_model.dart';
import '../../providers/auth_provider.dart';

class LeiFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const LeiFormScreen({super.key, required this.order});

  @override
  ConsumerState<LeiFormScreen> createState() => _LeiFormScreenState();
}

class _LeiFormScreenState extends ConsumerState<LeiFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Company Details
  final _companyNameController = TextEditingController();
  final _cinNumberController = TextEditingController();
  final _companyAddressController = TextEditingController();

  // Applicant Details
  final _applicantNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _businessPhoneController = TextEditingController();

  // Document
  String? _incorpCertPath;

  // Verification
  bool _isDeclared = false;

  @override
  void initState() {
    super.initState();
    _loadDraft();
  }

  @override
  void dispose() {
    _companyNameController.dispose();
    _cinNumberController.dispose();
    _companyAddressController.dispose();
    _applicantNameController.dispose();
    _emailController.dispose();
    _businessPhoneController.dispose();
    super.dispose();
  }

  Future<void> _loadDraft() async {
    final draftData = await ref.read(draftServiceProvider).loadDraft(widget.order.id, 'LeiFormScreen');
    if (draftData != null && mounted) {
      setState(() {
        _companyNameController.text = draftData['companyName'] ?? '';
        _cinNumberController.text = draftData['cinNumber'] ?? '';
        _companyAddressController.text = draftData['companyAddress'] ?? '';
        _applicantNameController.text = draftData['applicantName'] ?? '';
        _emailController.text = draftData['email'] ?? '';
        _businessPhoneController.text = draftData['businessPhone'] ?? '';
      });
    }
  }

  Future<void> _saveDraft() async {
    final draftData = {
      'companyName': _companyNameController.text,
      'cinNumber': _cinNumberController.text,
      'companyAddress': _companyAddressController.text,
      'applicantName': _applicantNameController.text,
      'email': _emailController.text,
      'businessPhone': _businessPhoneController.text,
    };
    await ref.read(draftServiceProvider).saveDraft(widget.order.id, 'LeiFormScreen', draftData);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Draft saved successfully!')),
      );
    }
  }

  Future<void> _pickDocument() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
        allowMultiple: false,
      );

      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        if (file.size > 2 * 1024 * 1024) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('File must be 2 MB or smaller.')),
            );
          }
          return;
        }

        setState(() {
          _incorpCertPath = file.path;
        });
      }
    } catch (e) {
      debugPrint('Error picking document: $e');
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    
    if (_incorpCertPath == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please upload the required Incorporation Certificate (Max 2 MB).')));
      return;
    }

    if (!_isDeclared) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please accept the declaration.')));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('${kBaseUrl}/api/orders/${widget.order.id}/submit-lei-form'),
      );
      request.headers['x-user-id'] = uid;

      final formData = {
        'companyName': _companyNameController.text.trim(),
        'cinNumber': _cinNumberController.text.trim(),
        'companyAddress': _companyAddressController.text.trim(),
        'applicantName': _applicantNameController.text.trim(),
        'email': _emailController.text.trim(),
        'businessPhone': _businessPhoneController.text.trim(),
      };

      request.fields['data'] = jsonEncode(formData);

      if (_incorpCertPath != null) {
        request.files.add(await http.MultipartFile.fromPath('incorpCert', _incorpCertPath!));
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        await ref.read(draftServiceProvider).clearDraft(widget.order.id, 'LeiFormScreen');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('LEI Application submitted successfully!')));
          Navigator.pop(context, true);
        }
      } else {
        throw Exception(jsonDecode(response.body)['message'] ?? 'Failed to submit form');
      }
    } catch (e) {
      if (mounted) {
        showGlobalError(e.toString());
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Text(title, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.deepTeal)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('LEI Code Application', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        actions: [
          TextButton.icon(
            onPressed: _saveDraft,
            icon: const Icon(Icons.save_outlined, color: Colors.white),
            label: Text('Save Draft', style: GoogleFonts.inter(color: Colors.white)),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _buildSectionHeader('1. Company Details'),
                  TextFormField(
                    controller: _companyNameController,
                    decoration: const InputDecoration(labelText: 'Company Name *', border: OutlineInputBorder()),
                    validator: (val) => val!.trim().isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _cinNumberController,
                    decoration: const InputDecoration(labelText: 'CIN Number *', border: OutlineInputBorder()),
                    textCapitalization: TextCapitalization.characters,
                    validator: (val) => val!.trim().isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _companyAddressController,
                    decoration: const InputDecoration(labelText: 'Company Address *', border: OutlineInputBorder()),
                    maxLines: 3,
                    validator: (val) => val!.trim().isEmpty ? 'Required' : null,
                  ),

                  _buildSectionHeader('2. Applicant Details'),
                  TextFormField(
                    controller: _applicantNameController,
                    decoration: const InputDecoration(labelText: "Applicant's Full Name *", border: OutlineInputBorder()),
                    validator: (val) => val!.trim().isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _emailController,
                    decoration: const InputDecoration(labelText: 'Business Email *', border: OutlineInputBorder()),
                    keyboardType: TextInputType.emailAddress,
                    validator: (val) => !val!.contains('@') ? 'Enter valid email' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _businessPhoneController,
                    decoration: const InputDecoration(labelText: 'Business Phone Number *', border: OutlineInputBorder()),
                    keyboardType: TextInputType.phone,
                    maxLength: 10,
                    validator: (val) => val!.trim().length != 10 ? 'Enter valid 10 digit number' : null,
                  ),

                  _buildSectionHeader('3. Company Documents'),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Incorporation Certificate * (Max 2 MB)', style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 13)),
                        const SizedBox(height: 8),
                        InkWell(
                          onTap: _pickDocument,
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(8)),
                            child: Row(
                              children: [
                                Icon(_incorpCertPath != null ? Icons.check_circle : Icons.upload_file, color: _incorpCertPath != null ? Colors.green : Colors.grey),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    _incorpCertPath != null ? _incorpCertPath!.split('/').last : 'Tap to upload document',
                                    style: GoogleFonts.inter(color: _incorpCertPath != null ? Colors.black87 : Colors.grey, fontSize: 13),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  _buildSectionHeader('4. Declaration'),
                  CheckboxListTile(
                    title: const Text('I Agree'),
                    subtitle: const Text('I hereby declare that all information provided is true and correct to the best of my knowledge.'),
                    value: _isDeclared,
                    onChanged: (val) => setState(() => _isDeclared = val ?? false),
                    controlAffinity: ListTileControlAffinity.leading,
                    contentPadding: EdgeInsets.zero,
                  ),

                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _submitForm,
                      style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                      child: const Text('Submit Application', style: TextStyle(fontSize: 16)),
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }
}
