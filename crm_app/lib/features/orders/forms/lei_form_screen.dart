import 'package:crm_app/core/theme/app_theme.dart';
import 'package:crm_app/providers/auth_provider.dart';
import 'package:crm_app/core/constants/port.dart';
import 'package:crm_app/core/utils/error_handler.dart';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../../../core/widgets/entity_document_slot.dart';
import '../../../providers/draft_provider.dart';
import '../../../providers/entity_profile_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;
import '../../../models/order_model.dart';

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
  String _prefillIncorpCertDocId = '';
  String _prefillIncorpCertDocName = '';

  // Verification
  bool _isDeclared = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) { _autoFillFromProfile(); });
    _loadDraft();
    _loadEntityPrefill();
  }

  Future<void> _loadEntityPrefill() async {
    final uid = ref.read(authStateProvider).value?.uid;
    if (uid == null) return;
    final profile = await ref.read(entityCacheServiceProvider).fetchProfile(uid);
    if (!mounted) return;
    setState(() {
      if (_companyNameController.text.isEmpty && profile.entityName.isNotEmpty)
        _companyNameController.text = profile.entityName;
      if (_cinNumberController.text.isEmpty && profile.cin.isNotEmpty)
        _cinNumberController.text = profile.cin;
      if (_companyAddressController.text.isEmpty && profile.address.isNotEmpty)
        _companyAddressController.text = profile.address;
      if (_applicantNameController.text.isEmpty && profile.directorName.isNotEmpty)
        _applicantNameController.text = profile.directorName;
      if (_emailController.text.isEmpty && profile.email.isNotEmpty)
        _emailController.text = profile.email;
      if (_businessPhoneController.text.isEmpty && profile.phone.isNotEmpty)
        _businessPhoneController.text = profile.phone;
      if (!profile.incorpCertDoc.isEmpty && _incorpCertPath == null) {
        _prefillIncorpCertDocId = profile.incorpCertDoc.docId;
        _prefillIncorpCertDocName = profile.incorpCertDoc.docName;
      }
    });
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

  Future<bool> _onWillPop() async {
    final shouldPop = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Save as Draft?'),
                  content: const Text('Do you want to save your progress before exiting?'),
          actions: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                TextButton(
                  style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(60, 36)),
                  onPressed: () => Navigator.of(context).pop(true),
                  child: Text('Discard', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.red)),
                ),
                TextButton(
                  style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(60, 36)),
                  onPressed: () => Navigator.of(context).pop(false),
                  child: Text('Cancel', style: Theme.of(context).textTheme.bodyMedium),
                ),
                TextButton(
                  style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(80, 36)),
                  onPressed: () async {
                    await _saveDraft();
                    if (context.mounted) Navigator.of(context).pop(true);
                  },
                  child: Text('Save Draft', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.corporateBlue, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ],
        ),
    );
    return shouldPop ?? false;
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    
    final bool hasIncorpCert = _incorpCertPath != null || _prefillIncorpCertDocId.isNotEmpty;
    if (!hasIncorpCert) {
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
        if (_prefillIncorpCertDocId.isNotEmpty && _incorpCertPath == null) 'prefillIncorpCertDocId': _prefillIncorpCertDocId,
      };

      request.fields['data'] = jsonEncode(formData);

      if (_incorpCertPath != null) {
        request.files.add(await http.MultipartFile.fromPath('incorpCert', _incorpCertPath!));
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        await ref.read(draftServiceProvider).clearDraft(widget.order.id, 'LeiFormScreen');
        ref.read(entityCacheServiceProvider).saveTextFields(uid, {
          'entityName': _companyNameController.text,
          'cin': _cinNumberController.text,
          'address': _companyAddressController.text,
          'email': _emailController.text,
          'phone': _businessPhoneController.text,
          'directorName': _applicantNameController.text,
        });
        if (_incorpCertPath != null) {
          ref.read(entityCacheServiceProvider).uploadDocument(
            uid: uid, docKey: 'incorpCert',
            filePath: _incorpCertPath!,
            fileName: _incorpCertPath!.split('/').last.split('\\').last,
          );
        }
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('LEI Application submitted successfully!')));
          Navigator.pop(context, true);
        }
      } else {
        throw Exception(jsonDecode(response.body)['message'] ?? 'Failed to submit form');
      }
    } catch (e) {
      if (mounted) { showGlobalError(e.toString()); }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  
  Widget _buildField(String label, TextEditingController controller, {
    bool isRequired = false,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    bool isDate = false,
    bool readOnly = false,
    bool obscureText = false,
    String? Function(String?)? validator,
    int? maxLength,
    TextCapitalization textCapitalization = TextCapitalization.none,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: label.replaceAll(' *', '').replaceAll('*', '').trim(),
              style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 12, color: AppTheme.deepTeal),
              children: [if (label.contains('*') || isRequired) const TextSpan(text: ' *', style: TextStyle(color: Colors.red))],
            ),
          ),
          const SizedBox(height: 6),
          TextFormField(
            controller: controller,
            keyboardType: keyboardType,
            maxLines: maxLines,
            maxLength: maxLength,
            readOnly: readOnly || isDate,
            obscureText: obscureText,
            textCapitalization: textCapitalization,
            onChanged: (_) => _saveDraft(),
            onTap: isDate ? () async {
               final date = await showDatePicker(
                 context: context,
                 initialDate: DateTime.now().subtract(const Duration(days: 365)),
                 firstDate: DateTime(1900),
                 lastDate: DateTime.now(),
               );
               if (date != null) {
                 setState(() {
                   controller.text = "${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}";
                 });
                 _saveDraft();
               }
            } : null,
            style: GoogleFonts.inter(fontSize: 13, color: AppTheme.deepTeal),
            decoration: InputDecoration(
              hintText: 'Enter ${label.replaceAll('*', '').trim()}',
              hintStyle: const TextStyle(fontSize: 13, color: Colors.grey),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.black, width: 1.5)),
              filled: true,
              fillColor: AppTheme.surfaceLight,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              suffixIcon: isDate ? const Icon(Icons.calendar_today, size: 18, color: Colors.grey) : null,
              counterText: '',
            ),
            autovalidateMode: AutovalidateMode.onUserInteraction,
            validator: validator ?? (v) {
              if ((label.contains('*') || isRequired) && (v == null || v.trim().isEmpty)) return 'This is a required field';
              return null;
            },
          ),
        ],
      ),
    );
  }


  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.deepTeal)),
          const SizedBox(height: 6),
          Container(height: 1, color: Colors.grey.shade200),
        ],
      ),
    );
  }


  void _autoFillFromProfile() {
    final user = ref.read(userProfileProvider).value;
    if (user == null) return;
    setState(() {
      if (_applicantNameController.text.isEmpty && user.name.isNotEmpty) _applicantNameController.text = user.name;
      if (_emailController.text.isEmpty && user.email.isNotEmpty) _emailController.text = user.email;
      if (_businessPhoneController.text.isEmpty && user.phone.isNotEmpty) _businessPhoneController.text = user.phone;
    });
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
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
                  _buildField('Company Name *', _companyNameController),
                  _buildField('CIN Number *', _cinNumberController, textCapitalization: TextCapitalization.characters),
                  _buildField('Company Address *', _companyAddressController, maxLines: 3),
                  _buildField('Applicant Name *', _applicantNameController),
                  _buildField('Email ID *', _emailController, keyboardType: TextInputType.emailAddress),
                  _buildField('Business Phone Number *', _businessPhoneController, keyboardType: TextInputType.phone, maxLength: 10),
                  EntityDocumentSlot(
                    label: 'Incorporation Certificate *',
                    hint: 'Upload PDF/JPG/PNG. Max 2 MB.',
                    prefillDocId: _prefillIncorpCertDocId.isNotEmpty ? _prefillIncorpCertDocId : null,
                    prefillDocName: _prefillIncorpCertDocName.isNotEmpty ? _prefillIncorpCertDocName : null,
                    localFilePath: _incorpCertPath,
                    onReplace: _pickDocument,
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
      ),
    );
  }
}
