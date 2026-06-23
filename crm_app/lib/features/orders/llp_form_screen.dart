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
import '../../models/order_model.dart';
import '../../providers/auth_provider.dart';

class LlpFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const LlpFormScreen({super.key, required this.order});

  @override
  ConsumerState<LlpFormScreen> createState() => _LlpFormScreenState();
}

class PersonDetails {
  final fullNameController = TextEditingController();
  final fatherNameController = TextEditingController();
  final dobController = TextEditingController();
  final placeOfBirthController = TextEditingController();
  final educationController = TextEditingController();
  final emailController = TextEditingController();
  final phoneController = TextEditingController();
  final addressController = TextEditingController();
  final panController = TextEditingController();
  final aadhaarController = TextEditingController();
  final dinController = TextEditingController();
  final capitalController = TextEditingController();
  final profitRatioController = TextEditingController();

  String nationality = 'Indian';
  String occupation = 'Business';
  String needDsc = 'Yes';
  String designation = 'Designated Partner';
  String isAuthorized = 'Yes';

  String? photoPath;
  String? signaturePath;
  String? addressProofPath;
  String? aadhaarPath;
  String? panPath;

  void dispose() {
    fullNameController.dispose();
    fatherNameController.dispose();
    dobController.dispose();
    placeOfBirthController.dispose();
    educationController.dispose();
    emailController.dispose();
    phoneController.dispose();
    addressController.dispose();
    panController.dispose();
    aadhaarController.dispose();
    dinController.dispose();
    capitalController.dispose();
    profitRatioController.dispose();
  }
}

class _LlpFormScreenState extends ConsumerState<LlpFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Company Fields
  final _companyNameController = TextEditingController();
  final _businessActivityController = TextEditingController();
  final _ownerNameController = TextEditingController();
  final _totalCapitalController = TextEditingController();
  String _registeredOfficePreference = 'Do you have address for your company';
  String? _officeProofPath;
  String? _paymentScreenshotPath;

  bool _isVerified = false;

  late final List<PersonDetails> _persons;

  @override
  void initState() {
    super.initState();
    _loadDraft();
    final assignedNumStr = widget.order.details['assignedNumberOfDirectors']?.toString();
    final numStr = assignedNumStr ?? widget.order.details['numberOfDirectors']?.toString() ?? '2';
    final int count = int.tryParse(numStr) ?? 2;
    _persons = List.generate(count, (_) => PersonDetails());
  }

  @override
  void dispose() {
    _companyNameController.dispose();
    _businessActivityController.dispose();
    _ownerNameController.dispose();
    _totalCapitalController.dispose();
    for (var p in _persons) {
      p.dispose();
    }
    super.dispose();
  }

  Future<void> _pickFile(Function(String) onPicked) async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
    );
    if (result != null && result.files.single.path != null) {
      // User specifically requested Max 2 MB for documents
      if (result.files.single.size > 2 * 1024 * 1024) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Upload a file less than 2 MB or equal to 2 MB.'),
          backgroundColor: Colors.red,
        ));
        return;
      }
      setState(() {
        onPicked(result.files.single.path!);
      });
    }
  }

  
  Future<void> _loadDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final draft = await draftService.loadDraft(widget.order.id, 'LlpFormScreen');
    if (draft != null) {
      if (mounted) {
        setState(() {
        if (draft.containsKey('companyName')) _companyNameController.text = draft['companyName'];
        if (draft.containsKey('businessActivity')) _businessActivityController.text = draft['businessActivity'];
        if (draft.containsKey('ownerName')) _ownerNameController.text = draft['ownerName'];
        if (draft.containsKey('totalCapital')) _totalCapitalController.text = draft['totalCapital'];
        if (draft.containsKey('registeredOfficePreference')) _registeredOfficePreference = draft['registeredOfficePreference'];

        });
      }
    }
  }

  Future<void> _saveDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final data = <String, dynamic>{
      'companyName': _companyNameController.text,
      'businessActivity': _businessActivityController.text,
      'ownerName': _ownerNameController.text,
      'totalCapital': _totalCapitalController.text,
      'registeredOfficePreference': _registeredOfficePreference,

    };
    await draftService.saveDraft(widget.order.id, 'LlpFormScreen', data);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Draft saved successfully!'),
        backgroundColor: AppTheme.deepTeal,
      ));
    }
  }

  Future<void> _submitDetails() async {
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please fill all required fields.'),
        backgroundColor: Colors.red,
      ));
      return;
    }

    if (_officeProofPath == null) {
      _showError('Please upload Registered office proof.');
      return;
    }

    if (_paymentScreenshotPath == null) {
      _showError('Please upload Payment Screenshot.');
      return;
    }

    for (int i = 0; i < _persons.length; i++) {
      if (_persons[i].photoPath == null ||
          _persons[i].signaturePath == null ||
          _persons[i].addressProofPath == null ||
          _persons[i].aadhaarPath == null ||
          _persons[i].panPath == null) {
        _showError('Please upload all required documents for Person ${i + 1}.');
        return;
      }
    }

    if (!_isVerified) {
      _showError('Please agree to the consent at the bottom.');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');

      final uri = Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-llp-form');
      var request = http.MultipartRequest('POST', uri);
      request.headers['x-user-id'] = uid;

      // Add company fields
      request.fields['companyName'] = _companyNameController.text;
      request.fields['businessActivity'] = _businessActivityController.text;
      request.fields['ownerName'] = _ownerNameController.text;
      request.fields['totalCapital'] = _totalCapitalController.text;
      request.fields['registeredOfficePreference'] = _registeredOfficePreference;

      // Add person fields
      for (int i = 0; i < _persons.length; i++) {
        final p = _persons[i];
        final prefix = 'person_${i + 1}_';
        
        request.fields['${prefix}fullName'] = p.fullNameController.text;
        request.fields['${prefix}fatherName'] = p.fatherNameController.text;
        request.fields['${prefix}dob'] = p.dobController.text;
        request.fields['${prefix}placeOfBirth'] = p.placeOfBirthController.text;
        request.fields['${prefix}education'] = p.educationController.text;
        request.fields['${prefix}email'] = p.emailController.text;
        request.fields['${prefix}phone'] = p.phoneController.text;
        request.fields['${prefix}address'] = p.addressController.text;
        request.fields['${prefix}pan'] = p.panController.text;
        request.fields['${prefix}aadhaar'] = p.aadhaarController.text;
        request.fields['${prefix}din'] = p.dinController.text;
        request.fields['${prefix}capital'] = p.capitalController.text;
        request.fields['${prefix}profitRatio'] = p.profitRatioController.text;

        request.fields['${prefix}nationality'] = p.nationality;
        request.fields['${prefix}occupation'] = p.occupation;
        request.fields['${prefix}needDsc'] = p.needDsc;
        request.fields['${prefix}designation'] = p.designation;
        request.fields['${prefix}isAuthorized'] = p.isAuthorized;
      }

      // Add files
      request.files.add(await http.MultipartFile.fromPath('officeProof', _officeProofPath!));
      request.files.add(await http.MultipartFile.fromPath('paymentScreenshot', _paymentScreenshotPath!));

      for (int i = 0; i < _persons.length; i++) {
        final p = _persons[i];
        request.files.add(await http.MultipartFile.fromPath('person_${i + 1}_photo', p.photoPath!));
        request.files.add(await http.MultipartFile.fromPath('person_${i + 1}_signature', p.signaturePath!));
        request.files.add(await http.MultipartFile.fromPath('person_${i + 1}_addressProof', p.addressProofPath!));
        request.files.add(await http.MultipartFile.fromPath('person_${i + 1}_aadhaar', p.aadhaarPath!));
        request.files.add(await http.MultipartFile.fromPath('person_${i + 1}_pan', p.panPath!));
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (!mounted) return;
        await showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Success'),
            content: const Text('Form submitted successfully!'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('OK'),
              ),
            ],
          ),
        );
        if (!mounted) return;
        ref.read(draftServiceProvider).clearDraft(widget.order.id, 'LlpFormScreen');
        Navigator.pop(context, true); // Success
      } else {
        throw Exception('Failed to submit form: ${response.body}');
      }
    } catch (e) {
      if (!mounted) return;
      _showError('Error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: Colors.red,
    ));
  }

  @override
  
  Future<bool> _onWillPop() async {
    final shouldPop = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Are You Sure To Exit ?'),
          content: const Text('Any unsaved progress will be lost.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text(
                'Cancel',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
            TextButton(
              onPressed: () async {
                await _saveDraft();
                if (context.mounted) Navigator.of(context).pop(true);
              },
              child: Text(
                'OK',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: const Color.fromARGB(255, 6, 6, 6),
                    ),
              ),
            ),
          ],
        );
      },
    );
    return shouldPop ?? false;
  }

Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Complete Details', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w800, fontSize: 16)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _saveDraft,
            child: const Text('Save Draft', style: TextStyle(color: AppTheme.corporateBlue, fontWeight: FontWeight.w600)),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _isLoading 
          ? const Center(child: CircularProgressIndicator()) 
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  Text('Complete Details', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800, color: AppTheme.corporateBlue)),
                  const SizedBox(height: 16),
                  
                  // Company Details
                  _buildSectionContainer(
                    title: 'LLP Details',
                    children: [
                      _buildField('Proposed LLP name', 'Enter your preferred LLP company name...', _companyNameController, isRequired: true),
                      _buildField('Business Activity', 'Describe the main business activities...', _businessActivityController, isRequired: true),
                      _buildRadioGroup('Registered Office Preference', '', [
                        'Do you have address for your company',
                        'Do you want virtual office for your company'
                      ], _registeredOfficePreference, (v) => setState(() => _registeredOfficePreference = v)),
                      _buildFileRow('Registered office proof', 'EB bill, wifi bill not less than 2 months old', _officeProofPath, () => _pickFile((path) => _officeProofPath = path)),
                      _buildField('Name of the Owner in the utility bill', '', _ownerNameController, isRequired: true),
                      _buildField('Total Capital Contribution', 'Enter total capital contributed by all partners', _totalCapitalController, isRequired: true),
                    ],
                  ),

                  // Persons Details
                  for (int i = 0; i < _persons.length; i++)
                    _buildPersonSection(i),

                  // Payment & Consent
                  _buildSectionContainer(
                    title: 'Final Verification',
                    children: [
                      _buildFileRow('Payment Screenshot', 'Upload 1 supported file. Max 2 MB.', _paymentScreenshotPath, () => _pickFile((path) => _paymentScreenshotPath = path)),
                      
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Checkbox(
                            value: _isVerified,
                            activeColor: AppTheme.corporateBlue,
                            onChanged: (val) {
                              setState(() {
                                _isVerified = val ?? false;
                              });
                            },
                          ),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.only(top: 12.0),
                              child: RichText(
                                text: const TextSpan(
                                  text: 'Consent',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.deepTeal),
                                  children: [
                                    TextSpan(text: ' *\n', style: TextStyle(color: Colors.red)),
                                    TextSpan(
                                      text: 'By submitting this form, I agree to the collection and use of my personal and professional information by Wealth Empires for consultation, compliance assessment, and service-related communication',
                                      style: TextStyle(fontWeight: FontWeight.normal, color: Colors.black87),
                                    ),
                                  ]
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 16),
              ElevatedButton(
                    onPressed: _submitDetails,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.corporateBlue,
                      minimumSize: const Size(double.infinity, 50),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Submit Application', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
    ));
  }

  Widget _buildPersonSection(int index) {
    final p = _persons[index];
    return _buildSectionContainer(
      title: 'Person ${index + 1} Registration',
      subtitle: 'Please provide the following information for registration',
      children: [
        _buildField('Full name', 'Include your first name, middle name (if any), and last name.', p.fullNameController, isRequired: true),
        _buildField('Father\'s name', 'As it appears on your official documents.', p.fatherNameController, isRequired: true),
        _buildField('DOB', 'DD/MM/YYYY format.', p.dobController, isRequired: true, isDate: true),
        _buildField('Place of birth', 'City and state where you were born.', p.placeOfBirthController, isRequired: true),
        
        _buildRadioGroup('Nationality', '', ['Indian', 'Others'], p.nationality, (v) => setState(() => p.nationality = v)),
        _buildRadioGroup('Occupation', '', ['Business', 'Employment', 'House wife', 'Student'], p.occupation, (v) => setState(() => p.occupation = v)),
        
        _buildField('Education', '', p.educationController, isRequired: true),
        _buildField('Email', '', p.emailController, isRequired: true, keyboardType: TextInputType.emailAddress),
        _buildField('Phone number', '', p.phoneController, isRequired: true, keyboardType: TextInputType.phone),
        _buildField('Address', 'Complete residential address with Pin code', p.addressController, isRequired: true),
        _buildField('PAN', '10-character PAN', p.panController, isRequired: true),
        _buildField('Aadhaar Number', '12-digit Aadhaar number', p.aadhaarController, isRequired: true),
        _buildField('DIN Number', 'Leave blank if this is your first directorship.', p.dinController, isRequired: false),
        
        _buildRadioGroup('I need DSC', '', ['Yes', 'No', 'Maybe'], p.needDsc, (v) => setState(() => p.needDsc = v)),
        _buildRadioGroup('Designation', '', ['Designated Partner', 'Partner'], p.designation, (v) => setState(() => p.designation = v)),
        
        _buildField('Fixed Capital Contribution', 'Amount you will contribute to the LLP', p.capitalController, isRequired: true),
        _buildField('Profit sharing ratio (%)', 'Your profit sharing percentage in the LLP', p.profitRatioController, isRequired: true),
        
        _buildRadioGroup('I\'m Authorized signatory', '', ['Yes', 'No'], p.isAuthorized, (v) => setState(() => p.isAuthorized = v)),
        
        _buildFileRow('Photo', 'Upload a recent passport-size photograph.', p.photoPath, () => _pickFile((path) => p.photoPath = path)),
        _buildFileRow('Signature', 'Upload a clear image of your signature.', p.signaturePath, () => _pickFile((path) => p.signaturePath = path)),
        _buildFileRow('Residential address proof', 'Utility bill, bank statement, etc.', p.addressProofPath, () => _pickFile((path) => p.addressProofPath = path)),
        _buildFileRow('Aadhaar Card', 'Aadhaar card with front and back side.', p.aadhaarPath, () => _pickFile((path) => p.aadhaarPath = path)),
        _buildFileRow('PAN Card', 'PAN card.', p.panPath, () => _pickFile((path) => p.panPath = path)),
      ],
    );
  }

  Widget _buildSectionContainer({required String title, String? subtitle, required List<Widget> children}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 32),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.shade50.withOpacity(0.3),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.blue.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.deepTeal)),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(subtitle, style: TextStyle(fontSize: 13, color: Colors.grey[700])),
          ],
          const SizedBox(height: 24),
          ...children,
        ],
      ),
    );
  }

  Widget _buildRadioGroup(String label, String hint, List<String> options, String currentValue, Function(String) onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: label,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.deepTeal),
              children: const [
                TextSpan(text: ' *', style: TextStyle(color: Colors.red)),
              ]
            ),
          ),
          if (hint.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(hint, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
          ],
          const SizedBox(height: 12),
          ...options.map((opt) {
            return InkWell(
              onTap: () => onChanged(opt),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Radio<String>(
                      value: opt,
                      groupValue: currentValue,
                      onChanged: (v) {
                        if (v != null) onChanged(v);
                      },
                      activeColor: AppTheme.corporateBlue,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(top: 12.0),
                        child: Text(opt, style: const TextStyle(fontSize: 14, height: 1.3)),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildField(String label, String hint, TextEditingController controller, {bool isRequired = false, TextInputType keyboardType = TextInputType.text, bool isDate = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: label,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.deepTeal),
              children: [
                if (isRequired)
                  const TextSpan(text: ' *', style: TextStyle(color: Colors.red)),
              ]
            ),
          ),
          if (hint.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(hint, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
          ],
          const SizedBox(height: 8),
          TextFormField(
            controller: controller,
            keyboardType: keyboardType,
            readOnly: isDate,
            onTap: isDate ? () async {
              final date = await showDatePicker(
                context: context,
                initialDate: DateTime.now(),
                firstDate: DateTime(1900),
                lastDate: DateTime(2100),
              );
              if (date != null) {
                controller.text = "${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}";
              }
            } : null,
            decoration: InputDecoration(
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.black, width: 1.5)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              suffixIcon: isDate ? const Icon(Icons.calendar_today, size: 20, color: Colors.grey) : null,
            ),
            validator: isRequired ? (v) => v == null || v.trim().isEmpty ? 'This is a required question' : null : null,
          ),
        ],
      ),
    );
  }

  Widget _buildFileRow(String label, String hint, String? path, VoidCallback onPick) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: label,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.deepTeal),
              children: const [
                TextSpan(text: ' *', style: TextStyle(color: Colors.red)),
              ]
            ),
          ),
          if (hint.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(hint, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
          ],
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  path == null ? 'Upload 1 supported file. Max 2 MB.' : path.split('/').last, 
                  style: TextStyle(fontSize: 13, color: path == null ? Colors.grey[500] : AppTheme.corporateBlue),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: onPick,
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: path == null ? Colors.grey[400]! : AppTheme.corporateBlue),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: Text(path == null ? 'Upload' : 'Change', style: TextStyle(color: path == null ? Colors.black87 : AppTheme.corporateBlue)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
