import 'package:crm_app/core/theme/app_theme.dart';
import 'package:crm_app/providers/auth_provider.dart';
import 'package:crm_app/core/constants/port.dart';
import 'package:crm_app/core/utils/error_handler.dart';
import 'package:crm_app/core/utils/file_picker_util.dart';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../../core/widgets/app_dropdown.dart';
import 'package:dropdown_button2/dropdown_button2.dart';
import '../../providers/draft_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;

import '../../core/constants/port.dart';
import '../../core/theme/app_theme.dart';
import '../../models/order_model.dart';
import '../../providers/auth_provider.dart';

class DpiitFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const DpiitFormScreen({super.key, required this.order});

  @override
  ConsumerState<DpiitFormScreen> createState() => _DpiitFormScreenState();
}

class _DpiitFormScreenState extends ConsumerState<DpiitFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // 1. DSC & Company Details
  String _orgDsc = 'Yes';
  final _fullNameController = TextEditingController();
  final _companyEmailController = TextEditingController();
  final _companyMobileController = TextEditingController();
  final _cinNumberController = TextEditingController();
  final _companyPanController = TextEditingController();
  final _companyPanNameController = TextEditingController();
  final _companyAddressController = TextEditingController();

  // 2. Authorized Signatory Details
  final _signatoryPanController = TextEditingController();
  final _signatoryFirstNameController = TextEditingController();
  final _signatoryLastNameController = TextEditingController();
  final _signatoryDobController = TextEditingController();

  // 3. Company / Business Details
  final _companyBriefController = TextEditingController();
  final _companyWebsiteController = TextEditingController();
  String? _companyLogoPath;

  // 4. Authorized Representative Details
  final _repNameController = TextEditingController();
  final _repMobileController = TextEditingController();
  final _repEmailController = TextEditingController();

  // 5. Director / Founder Details
  final _directorNameController = TextEditingController();
  String _directorGender = 'Male';
  final _directorMobileController = TextEditingController();
  final _directorAddressController = TextEditingController();
  final _directorEmailController = TextEditingController();
  final _directorDobController = TextEditingController();
  final _employeeCountController = TextEditingController();

  // 6. Startup Information
  final _iprAppliedController = TextEditingController();
  final _fundsReceivedController = TextEditingController();
  final _awardsReceivedController = TextEditingController();

  // 7. Company Documents
  String? _incorpCertPath;

  // 8. Verification
  bool _isDeclared = false;

  @override
  void initState() {
    super.initState();
    _loadDraft();
  }

  @override
  void dispose() {
    _fullNameController.dispose(); _companyEmailController.dispose(); _companyMobileController.dispose();
    _cinNumberController.dispose(); _companyPanController.dispose(); _companyPanNameController.dispose();
    _companyAddressController.dispose(); _signatoryPanController.dispose(); _signatoryFirstNameController.dispose();
    _signatoryLastNameController.dispose(); _signatoryDobController.dispose(); _companyBriefController.dispose();
    _companyWebsiteController.dispose(); _repNameController.dispose(); _repMobileController.dispose();
    _repEmailController.dispose(); _directorNameController.dispose(); _directorMobileController.dispose();
    _directorAddressController.dispose(); _directorEmailController.dispose(); _directorDobController.dispose();
    _employeeCountController.dispose(); _iprAppliedController.dispose(); _fundsReceivedController.dispose();
    _awardsReceivedController.dispose();
    super.dispose();
  }

  Future<void> _loadDraft() async {
    final draftData = await ref.read(draftServiceProvider).loadDraft(widget.order.id, 'DpiitFormScreen');
    if (draftData != null && mounted) {
      setState(() {
        _orgDsc = draftData['orgDsc'] ?? 'Yes';
        _fullNameController.text = draftData['fullName'] ?? '';
        _companyEmailController.text = draftData['companyEmail'] ?? '';
        _companyMobileController.text = draftData['companyMobile'] ?? '';
        _cinNumberController.text = draftData['cinNumber'] ?? '';
        _companyPanController.text = draftData['companyPan'] ?? '';
        _companyPanNameController.text = draftData['companyPanName'] ?? '';
        _companyAddressController.text = draftData['companyAddress'] ?? '';
        _signatoryPanController.text = draftData['signatoryPan'] ?? '';
        _signatoryFirstNameController.text = draftData['signatoryFirstName'] ?? '';
        _signatoryLastNameController.text = draftData['signatoryLastName'] ?? '';
        _signatoryDobController.text = draftData['signatoryDob'] ?? '';
        _companyBriefController.text = draftData['companyBrief'] ?? '';
        _companyWebsiteController.text = draftData['companyWebsite'] ?? '';
        _repNameController.text = draftData['repName'] ?? '';
        _repMobileController.text = draftData['repMobile'] ?? '';
        _repEmailController.text = draftData['repEmail'] ?? '';
        _directorNameController.text = draftData['directorName'] ?? '';
        _directorGender = draftData['directorGender'] ?? 'Male';
        _directorMobileController.text = draftData['directorMobile'] ?? '';
        _directorAddressController.text = draftData['directorAddress'] ?? '';
        _directorEmailController.text = draftData['directorEmail'] ?? '';
        _directorDobController.text = draftData['directorDob'] ?? '';
        _employeeCountController.text = draftData['employeeCount'] ?? '';
        _iprAppliedController.text = draftData['iprApplied'] ?? '';
        _fundsReceivedController.text = draftData['fundsReceived'] ?? '';
        _awardsReceivedController.text = draftData['awardsReceived'] ?? '';
      });
    }
  }

  Future<void> _saveDraft() async {
    final draftData = {
      'orgDsc': _orgDsc,
      'fullName': _fullNameController.text, 'companyEmail': _companyEmailController.text, 'companyMobile': _companyMobileController.text,
      'cinNumber': _cinNumberController.text, 'companyPan': _companyPanController.text, 'companyPanName': _companyPanNameController.text,
      'companyAddress': _companyAddressController.text, 'signatoryPan': _signatoryPanController.text, 'signatoryFirstName': _signatoryFirstNameController.text,
      'signatoryLastName': _signatoryLastNameController.text, 'signatoryDob': _signatoryDobController.text, 'companyBrief': _companyBriefController.text,
      'companyWebsite': _companyWebsiteController.text, 'repName': _repNameController.text, 'repMobile': _repMobileController.text,
      'repEmail': _repEmailController.text, 'directorName': _directorNameController.text, 'directorGender': _directorGender,
      'directorMobile': _directorMobileController.text, 'directorAddress': _directorAddressController.text, 'directorEmail': _directorEmailController.text,
      'directorDob': _directorDobController.text, 'employeeCount': _employeeCountController.text, 'iprApplied': _iprAppliedController.text,
      'fundsReceived': _fundsReceivedController.text, 'awardsReceived': _awardsReceivedController.text,
    };
    await ref.read(draftServiceProvider).saveDraft(widget.order.id, 'DpiitFormScreen', draftData);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Draft saved successfully!')));
    }
  }

  Future<void> _pickDocument(String type) async {
    try {
      final allowed = type == 'logo' ? ['jpg', 'jpeg'] : ['pdf'];
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: allowed,
        allowMultiple: false,
      );

      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        if (file.size > 2 * 1024 * 1024) {
          if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('File must be 2 MB or smaller.')));
          return;
        }

        setState(() {
          if (type == 'logo') _companyLogoPath = file.path;
          else _incorpCertPath = file.path;
        });
      }
    } catch (e) {
      debugPrint('Error picking document: $e');
    }
  }

  Future<void> _selectDate(TextEditingController controller) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().subtract(const Duration(days: 6570)),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() {
        controller.text = "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
      });
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    
    if (_companyLogoPath == null || _incorpCertPath == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please upload both the Company Logo and Incorporation Certificate.')));
      return;
    }

    if (!_isDeclared) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please accept the verification declaration.')));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('${kBaseUrl}/api/orders/${widget.order.id}/submit-dpiit-form'),
      );
      request.headers['x-user-id'] = uid;

      final formData = {
        'orgDsc': _orgDsc,
        'fullName': _fullNameController.text, 'companyEmail': _companyEmailController.text, 'companyMobile': _companyMobileController.text,
        'cinNumber': _cinNumberController.text, 'companyPan': _companyPanController.text, 'companyPanName': _companyPanNameController.text,
        'companyAddress': _companyAddressController.text, 'signatoryPan': _signatoryPanController.text, 'signatoryFirstName': _signatoryFirstNameController.text,
        'signatoryLastName': _signatoryLastNameController.text, 'signatoryDob': _signatoryDobController.text, 'companyBrief': _companyBriefController.text,
        'companyWebsite': _companyWebsiteController.text, 'repName': _repNameController.text, 'repMobile': _repMobileController.text,
        'repEmail': _repEmailController.text, 'directorName': _directorNameController.text, 'directorGender': _directorGender,
        'directorMobile': _directorMobileController.text, 'directorAddress': _directorAddressController.text, 'directorEmail': _directorEmailController.text,
        'directorDob': _directorDobController.text, 'employeeCount': _employeeCountController.text, 'iprApplied': _iprAppliedController.text,
        'fundsReceived': _fundsReceivedController.text, 'awardsReceived': _awardsReceivedController.text,
      };

      request.fields['data'] = jsonEncode(formData);

      if (_companyLogoPath != null) request.files.add(await http.MultipartFile.fromPath('companyLogo', _companyLogoPath!));
      if (_incorpCertPath != null) request.files.add(await http.MultipartFile.fromPath('incorpCert', _incorpCertPath!));

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        await ref.read(draftServiceProvider).clearDraft(widget.order.id, 'DpiitFormScreen');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('DPIIT Application submitted successfully!')));
          Navigator.pop(context, true);
        }
      } else {
        throw Exception(jsonDecode(response.body)['message'] ?? 'Failed to submit form');
      }
    } catch (e) {
      if (mounted) showGlobalError(e.toString());
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('DPIIT Startup Recognition', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
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
                  _buildSectionHeader('1. DSC & Company Details'),
                  Text('Do you have Organization DSC? *', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                  RadioListTile(title: const Text('Yes'), value: 'Yes', groupValue: _orgDsc, onChanged: (v) => setState(() => _orgDsc = v.toString())),
                  RadioListTile(title: const Text('No, I want one'), value: 'No, I want one', groupValue: _orgDsc, onChanged: (v) => setState(() => _orgDsc = v.toString())),
                  _buildField('Full Name *', _fullNameController),
                  _buildField('Company Email *', _companyEmailController, keyboardType: TextInputType.emailAddress),
                  _buildField('Company Mobile Number *', _companyMobileController, keyboardType: TextInputType.phone, maxLength: 10),
                  _buildField('CIN Number *', _cinNumberController, textCapitalization: TextCapitalization.characters),
                  _buildField('Company PAN Number *', _companyPanController, textCapitalization: TextCapitalization.characters),
                  _buildField('Company PAN Card Name *', _companyPanNameController),
                  _buildField('Business Address *', _companyAddressController, maxLines: 3),
                  _buildField('PAN of Authorized Signatory *', _signatoryPanController, textCapitalization: TextCapitalization.characters),
                  _buildField('PAN First Name *', _signatoryFirstNameController),
                  _buildField('PAN Last Name *', _signatoryLastNameController),
                  _buildField('PAN DOB *', _signatoryDobController, isDate: true),
                  _buildField('Brief about Company *', _companyBriefController, maxLines: 3),
                  _buildField('Company Website *', _companyWebsiteController, keyboardType: TextInputType.url),
                  _buildField('Authorized Representative Name *', _repNameController),
                  _buildField('Authorized Representative Mobile *', _repMobileController, keyboardType: TextInputType.phone, maxLength: 10),
                  _buildField('Authorized Representative Email *', _repEmailController, keyboardType: TextInputType.emailAddress),
                  _buildField('Director Name *', _directorNameController),
                  Text('Director Gender *', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                  RadioListTile(title: const Text('Male'), value: 'Male', groupValue: _directorGender, onChanged: (v) => setState(() => _directorGender = v.toString())),
                  RadioListTile(title: const Text('Female'), value: 'Female', groupValue: _directorGender, onChanged: (v) => setState(() => _directorGender = v.toString())),
                  RadioListTile(title: const Text('Other'), value: 'Other', groupValue: _directorGender, onChanged: (v) => setState(() => _directorGender = v.toString())),
                  _buildField('Director Mobile Number *', _directorMobileController, keyboardType: TextInputType.phone, maxLength: 10),
                  _buildField('Email Address *', _directorEmailController, keyboardType: TextInputType.emailAddress),
                  _buildField('Director Address *', _directorAddressController, maxLines: 3),
                  _buildField('DOB of Founder / Director *', _directorDobController, isDate: true),
                  _buildField('Current Number of Employees *', _employeeCountController, keyboardType: TextInputType.number),
                  _buildField('Applied for IPR? (Mention if any) *', _iprAppliedController, maxLines: 2),
                  _buildField('Received any Funds? *', _fundsReceivedController, maxLines: 2),
                  _buildField('Received any Awards? *', _awardsReceivedController, maxLines: 2),
                  CheckboxListTile(
                    title: const Text('I Agree'),
                    subtitle: const Text('I hereby verify that the above mentioned facts are true and correct to the best of my knowledge.'),
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
