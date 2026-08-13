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

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Text(title, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.deepTeal)),
    );
  }

  Widget _buildDocUploader(String label, String? path, String type) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 13)),
          const SizedBox(height: 8),
          InkWell(
            onTap: () => _pickDocument(type),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(8)),
              child: Row(
                children: [
                  Icon(path != null ? Icons.check_circle : Icons.upload_file, color: path != null ? Colors.green : Colors.grey),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      path != null ? path.split('/').last : 'Tap to upload document',
                      style: GoogleFonts.inter(color: path != null ? Colors.black87 : Colors.grey, fontSize: 13),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ),
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
                  TextFormField(controller: _fullNameController, decoration: const InputDecoration(labelText: 'Full Name *', border: OutlineInputBorder()), validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _companyEmailController, decoration: const InputDecoration(labelText: 'Company Email *', border: OutlineInputBorder()), keyboardType: TextInputType.emailAddress, validator: (val) => !val!.contains('@') ? 'Valid email required' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _companyMobileController, decoration: const InputDecoration(labelText: 'Company Mobile Number *', border: OutlineInputBorder()), keyboardType: TextInputType.phone, maxLength: 10, validator: (val) => val!.length != 10 ? 'Enter 10 digits' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _cinNumberController, decoration: const InputDecoration(labelText: 'CIN Number *', border: OutlineInputBorder()), textCapitalization: TextCapitalization.characters, validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _companyPanController, decoration: const InputDecoration(labelText: 'Company PAN Number *', border: OutlineInputBorder()), textCapitalization: TextCapitalization.characters, validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _companyPanNameController, decoration: const InputDecoration(labelText: 'Company PAN Card Name *', border: OutlineInputBorder()), validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _companyAddressController, decoration: const InputDecoration(labelText: 'Business Address *', border: OutlineInputBorder()), maxLines: 3, validator: (val) => val!.trim().isEmpty ? 'Required' : null),

                  _buildSectionHeader('2. Authorized Signatory Details'),
                  TextFormField(controller: _signatoryPanController, decoration: const InputDecoration(labelText: 'PAN of Authorized Signatory *', border: OutlineInputBorder()), textCapitalization: TextCapitalization.characters, validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _signatoryFirstNameController, decoration: const InputDecoration(labelText: 'PAN First Name *', border: OutlineInputBorder()), validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _signatoryLastNameController, decoration: const InputDecoration(labelText: 'PAN Last Name *', border: OutlineInputBorder()), validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _signatoryDobController,
                    decoration: const InputDecoration(labelText: 'PAN DOB *', border: OutlineInputBorder(), suffixIcon: Icon(Icons.calendar_today)),
                    readOnly: true,
                    onTap: () => _selectDate(_signatoryDobController),
                    validator: (val) => val!.trim().isEmpty ? 'Required' : null,
                  ),

                  _buildSectionHeader('3. Company / Business Details'),
                  _buildDocUploader('Company Logo (JPEG) * (Max 2 MB)', _companyLogoPath, 'logo'),
                  TextFormField(controller: _companyBriefController, decoration: const InputDecoration(labelText: 'Brief about Company *', border: OutlineInputBorder()), maxLines: 3, validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _companyWebsiteController, decoration: const InputDecoration(labelText: 'Company Website *', border: OutlineInputBorder()), keyboardType: TextInputType.url, validator: (val) => val!.trim().isEmpty ? 'Required' : null),

                  _buildSectionHeader('4. Authorized Representative Details'),
                  TextFormField(controller: _repNameController, decoration: const InputDecoration(labelText: 'Authorized Representative Name *', border: OutlineInputBorder()), validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _repMobileController, decoration: const InputDecoration(labelText: 'Authorized Representative Mobile *', border: OutlineInputBorder()), keyboardType: TextInputType.phone, maxLength: 10, validator: (val) => val!.length != 10 ? '10 digits required' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _repEmailController, decoration: const InputDecoration(labelText: 'Authorized Representative Email *', border: OutlineInputBorder()), keyboardType: TextInputType.emailAddress, validator: (val) => !val!.contains('@') ? 'Valid email required' : null),

                  _buildSectionHeader('5. Director / Founder Details'),
                  TextFormField(controller: _directorNameController, decoration: const InputDecoration(labelText: 'Director Name *', border: OutlineInputBorder()), validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  Text('Director Gender *', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                  RadioListTile(title: const Text('Male'), value: 'Male', groupValue: _directorGender, onChanged: (v) => setState(() => _directorGender = v.toString())),
                  RadioListTile(title: const Text('Female'), value: 'Female', groupValue: _directorGender, onChanged: (v) => setState(() => _directorGender = v.toString())),
                  RadioListTile(title: const Text('Other'), value: 'Other', groupValue: _directorGender, onChanged: (v) => setState(() => _directorGender = v.toString())),
                  TextFormField(controller: _directorMobileController, decoration: const InputDecoration(labelText: 'Director Mobile Number *', border: OutlineInputBorder()), keyboardType: TextInputType.phone, maxLength: 10, validator: (val) => val!.length != 10 ? '10 digits required' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _directorEmailController, decoration: const InputDecoration(labelText: 'Email Address *', border: OutlineInputBorder()), keyboardType: TextInputType.emailAddress, validator: (val) => !val!.contains('@') ? 'Valid email required' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _directorAddressController, decoration: const InputDecoration(labelText: 'Director Address *', border: OutlineInputBorder()), maxLines: 3, validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _directorDobController,
                    decoration: const InputDecoration(labelText: 'DOB of Founder / Director *', border: OutlineInputBorder(), suffixIcon: Icon(Icons.calendar_today)),
                    readOnly: true,
                    onTap: () => _selectDate(_directorDobController),
                    validator: (val) => val!.trim().isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(controller: _employeeCountController, decoration: const InputDecoration(labelText: 'Current Number of Employees *', border: OutlineInputBorder()), keyboardType: TextInputType.number, validator: (val) => val!.trim().isEmpty ? 'Required' : null),

                  _buildSectionHeader('6. Startup Information'),
                  TextFormField(controller: _iprAppliedController, decoration: const InputDecoration(labelText: 'Applied for IPR? (Mention if any) *', border: OutlineInputBorder()), maxLines: 2, validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _fundsReceivedController, decoration: const InputDecoration(labelText: 'Received any Funds? *', border: OutlineInputBorder()), maxLines: 2, validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _awardsReceivedController, decoration: const InputDecoration(labelText: 'Received any Awards? *', border: OutlineInputBorder()), maxLines: 2, validator: (val) => val!.trim().isEmpty ? 'Required' : null),

                  _buildSectionHeader('7. Company Documents'),
                  _buildDocUploader('Incorporation Certificate (PDF) * (Max 2 MB)', _incorpCertPath, 'pdf'),

                  _buildSectionHeader('8. Verification'),
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
