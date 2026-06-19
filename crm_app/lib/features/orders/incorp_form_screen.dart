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

class DirectorFormData {
  final TextEditingController fullNameController = TextEditingController();
  final TextEditingController fatherNameController = TextEditingController();
  final TextEditingController dobController = TextEditingController();
  final TextEditingController placeOfBirthController = TextEditingController();
  final TextEditingController occupationController = TextEditingController();
  final TextEditingController educationController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController phoneController = TextEditingController();
  final TextEditingController addressController = TextEditingController();
  final TextEditingController panController = TextEditingController();
  final TextEditingController aadhaarController = TextEditingController();
  final TextEditingController dinController = TextEditingController();
  final TextEditingController shareholdingController = TextEditingController();

  final FocusNode emailFocus = FocusNode();
  final FocusNode phoneFocus = FocusNode();
  final FocusNode panFocus = FocusNode();

  String nationality = 'Indian';
  String needDsc = 'Yes';
  String role = 'Director';
  String isAuthSignatory = 'Yes';

  String? photoPath;
  String? signaturePath;
  String? addressProofPath;
  String? aadhaarPath;
  String? panPath;

  Map<String, dynamic> toJson() {
    return {
      'fullName': fullNameController.text,
      'fatherName': fatherNameController.text,
      'dob': dobController.text,
      'placeOfBirth': placeOfBirthController.text,
      'occupation': occupationController.text,
      'education': educationController.text,
      'email': emailController.text,
      'phone': phoneController.text,
      'address': addressController.text,
      'pan': panController.text,
      'aadhaar': aadhaarController.text,
      'din': dinController.text,
      'shareholding': shareholdingController.text,
      'nationality': nationality,
      'needDsc': needDsc,
      'role': role,
      'isAuthSignatory': isAuthSignatory,
    };
  }

  void dispose() {
    fullNameController.dispose();
    fatherNameController.dispose();
    dobController.dispose();
    placeOfBirthController.dispose();
    occupationController.dispose();
    educationController.dispose();
    emailController.dispose();
    phoneController.dispose();
    addressController.dispose();
    panController.dispose();
    aadhaarController.dispose();
    dinController.dispose();
    shareholdingController.dispose();
    emailFocus.dispose();
    phoneFocus.dispose();
    panFocus.dispose();
  }
}

class IncorpFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const IncorpFormScreen({super.key, required this.order});

  @override
  ConsumerState<IncorpFormScreen> createState() => _IncorpFormScreenState();
}

class _IncorpFormScreenState extends ConsumerState<IncorpFormScreen> {
  // Company Fields
  final _companyNameController = TextEditingController();
  final _businessActivityController = TextEditingController();
  String _officePreference = 'Already have address';
  String? _officeProofPath;
  final _ownerNameController = TextEditingController();
  final _companyEmailController = TextEditingController();
  final _companyPhoneController = TextEditingController();
  final _paidUpCapitalController = TextEditingController();
  final _valuePerShareController = TextEditingController();
  final _numberOfSharesController = TextEditingController();

  final FocusNode _companyEmailFocus = FocusNode();
  final FocusNode _companyPhoneFocus = FocusNode();
  final ScrollController _scrollController = ScrollController();

  late final List<DirectorFormData> _directors;
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    final assignedNumStr = widget.order.details['assignedNumberOfDirectors']?.toString();
    final numStr = assignedNumStr ?? widget.order.details['numberOfDirectors']?.toString() ?? '1';
    final int count = int.tryParse(numStr) ?? 1;
    _directors = List.generate(count, (_) => DirectorFormData());
    
    // Defer loading draft to ensure providers are ready
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDraft();
    });
  }

  @override
  void dispose() {
    _companyNameController.dispose();
    _businessActivityController.dispose();
    _ownerNameController.dispose();
    _companyEmailController.dispose();
    _companyPhoneController.dispose();
    _paidUpCapitalController.dispose();
    _valuePerShareController.dispose();
    _numberOfSharesController.dispose();
    for (var d in _directors) {
      d.dispose();
    }
    _companyEmailFocus.dispose();
    _companyPhoneFocus.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _pickCompanyFile() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
    );
    if (result != null && result.files.single.path != null) {
      if (result.files.single.size > 2 * 1024 * 1024) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Upload a file less than 2 MB or equal to 2 MB.'),
          backgroundColor: Colors.red,
        ));
        return;
      }
      setState(() {
        _officeProofPath = result.files.single.path!;
      });
    }
  }

  Future<void> _pickFile(DirectorFormData data, String field) async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
    );
    if (result != null && result.files.single.path != null) {
      if (result.files.single.size > 2 * 1024 * 1024) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Upload a file less than 2 MB or equal to 2 MB.'),
          backgroundColor: Colors.red,
        ));
        return;
      }
      setState(() {
        final path = result.files.single.path!;
        switch (field) {
          case 'photo':
            data.photoPath = path;
            break;
          case 'signature':
            data.signaturePath = path;
            break;
          case 'addressProof':
            data.addressProofPath = path;
            break;
          case 'aadhaar':
            data.aadhaarPath = path;
            break;
          case 'pan':
            data.panPath = path;
            break;
        }
      });
    }
  }

  
  Future<void> _loadDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final draft = await draftService.loadDraft(widget.order.id, 'IncorpFormScreen');
    if (draft != null) {
      if (mounted) {
        setState(() {
        if (draft.containsKey('companyName')) _companyNameController.text = draft['companyName'];
        if (draft.containsKey('businessActivity')) _businessActivityController.text = draft['businessActivity'];
        if (draft.containsKey('ownerName')) _ownerNameController.text = draft['ownerName'];
        if (draft.containsKey('companyEmail')) _companyEmailController.text = draft['companyEmail'];
        if (draft.containsKey('companyPhone')) _companyPhoneController.text = draft['companyPhone'];
        if (draft.containsKey('paidUpCapital')) _paidUpCapitalController.text = draft['paidUpCapital'];
        if (draft.containsKey('valuePerShare')) _valuePerShareController.text = draft['valuePerShare'];
        if (draft.containsKey('numberOfShares')) _numberOfSharesController.text = draft['numberOfShares'];
        if (draft.containsKey('officePreference')) _officePreference = draft['officePreference'];

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
      'companyEmail': _companyEmailController.text,
      'companyPhone': _companyPhoneController.text,
      'paidUpCapital': _paidUpCapitalController.text,
      'valuePerShare': _valuePerShareController.text,
      'numberOfShares': _numberOfSharesController.text,
      'officePreference': _officePreference,
      'directors': jsonEncode(_directors.map((d) => d.toJson()).toList()),

    };
    await draftService.saveDraft(widget.order.id, 'IncorpFormScreen', data);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Draft saved successfully!'),
        backgroundColor: AppTheme.deepTeal,
      ));
    }
  }

  Future<void> _submitDetails() async {
    List<FocusNode> errorNodes = [];
    if (!ValidationUtils.isValidEmail(_companyEmailController.text)) errorNodes.add(_companyEmailFocus);
    if (!ValidationUtils.isValidPhone(_companyPhoneController.text)) errorNodes.add(_companyPhoneFocus);
    for (var d in _directors) {
      if (!ValidationUtils.isValidEmail(d.emailController.text)) errorNodes.add(d.emailFocus);
      if (!ValidationUtils.isValidPhone(d.phoneController.text)) errorNodes.add(d.phoneFocus);
      if (!ValidationUtils.isValidPan(d.panController.text)) errorNodes.add(d.panFocus);
    }

    if (!_formKey.currentState!.validate() || errorNodes.isNotEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please fix the errors in the form.'),
        backgroundColor: Colors.red,
      ));
      
      if (errorNodes.isNotEmpty) {
        final targetNode = errorNodes.first;
        targetNode.requestFocus();
        if (targetNode.context != null) {
          Scrollable.ensureVisible(
            targetNode.context!,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
          );
        }
      }
      return;
    }
    
    // Capital check
    final capital = int.tryParse(_paidUpCapitalController.text) ?? 0;
    if (capital < 10000) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Paid up share capital must be at least ₹10,000.'),
        backgroundColor: Colors.red,
      ));
      return;
    }

    if (_officePreference == 'Already have address' && _officeProofPath == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please upload the registered office proof.'),
        backgroundColor: Colors.red,
      ));
      return;
    }
    
    // Check if required files are uploaded for all directors
    for (int i = 0; i < _directors.length; i++) {
      final d = _directors[i];
      if (d.photoPath == null || d.signaturePath == null || d.addressProofPath == null || d.aadhaarPath == null || d.panPath == null) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Please upload all required files for Person ${i + 1}'),
          backgroundColor: Colors.red,
        ));
        return;
      }
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');

      final uri = Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-incorp-form');
      var request = http.MultipartRequest('POST', uri);
      request.headers['x-user-id'] = uid;

      // Add text fields
      request.fields['companyName'] = _companyNameController.text;
      request.fields['businessActivity'] = _businessActivityController.text;
      request.fields['officePreference'] = _officePreference;
      if (_officePreference == 'Already have address') {
        request.fields['ownerName'] = _ownerNameController.text;
        request.files.add(await http.MultipartFile.fromPath('officeProof', _officeProofPath!));
      }
      request.fields['companyEmail'] = _companyEmailController.text;
      request.fields['companyPhone'] = _companyPhoneController.text;
      request.fields['paidUpCapital'] = _paidUpCapitalController.text;
      request.fields['valuePerShare'] = _valuePerShareController.text;
      request.fields['numberOfShares'] = _numberOfSharesController.text;

      final directorsList = _directors.map((d) => d.toJson()).toList();
      request.fields['directors'] = jsonEncode(directorsList);

      // Then upload director files
      for (int i = 0; i < _directors.length; i++) {
        final d = _directors[i];
        request.files.add(await http.MultipartFile.fromPath('director_${i + 1}_photo', d.photoPath!));
        request.files.add(await http.MultipartFile.fromPath('director_${i + 1}_signature', d.signaturePath!));
        request.files.add(await http.MultipartFile.fromPath('director_${i + 1}_addressProof', d.addressProofPath!));
        request.files.add(await http.MultipartFile.fromPath('director_${i + 1}_aadhaar', d.aadhaarPath!));
        request.files.add(await http.MultipartFile.fromPath('director_${i + 1}_pan', d.panPath!));
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
        ref.read(draftServiceProvider).clearDraft(widget.order.id, 'IncorpFormScreen');
        Navigator.pop(context, true); // Success
      } else {
        throw Exception('Failed to submit form: ${response.body}');
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Error: $e'),
        backgroundColor: Colors.red,
      ));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
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
              onPressed: () => Navigator.of(context).pop(true),
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
      ),
      body: _isLoading 
          ? const Center(child: CircularProgressIndicator()) 
          : Form(
              key: _formKey,
              child: ListView(
                controller: _scrollController,
                padding: const EdgeInsets.all(20),
                children: [
                  // --- Company Details Section ---
                  Text('Step 1: Company Details', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800, color: AppTheme.corporateBlue)),
                  const SizedBox(height: 16),
                  Container(
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
                        _buildField('Proposed Company Name', 'Enter your preferred company name. Avoid words like "National", "Federal" without authorization. Eg: Wealth Empires Private Limited', _companyNameController, isRequired: true),
                        _buildField('Business Activity', 'Describe the main business activities your company will undertake.', _businessActivityController, isRequired: true),
                        
                        _buildRadioGroup('Registered Office Preference', 'Tell us whether you already have a registered office address or need Wealth Empires to arrange a virtual office.', ['Already have address', 'Need virtual office'], _officePreference, (v) => setState(() => _officePreference = v)),
                        
                        if (_officePreference == 'Already have address') ...[
                          _buildFileRow('Registered Office Proof', 'Upload EB bill or Wifi bill not less than 2 months old.', _officeProofPath, _pickCompanyFile),
                          _buildField('Name of Owner in Utility Bill', 'Enter the name of the person who owns or has authority over the registered office address.', _ownerNameController, isRequired: true),
                        ],
                        
                        _buildField('Company Mail', 'Should not be same as director.', _companyEmailController, isRequired: true, keyboardType: TextInputType.emailAddress, focusNode: _companyEmailFocus, validator: (v) => ValidationUtils.isValidEmail(v) ? null : 'Enter a valid email address'),
                        _buildField('Company Phone Number', 'Should not be same as director.', _companyPhoneController, isRequired: true, keyboardType: TextInputType.phone, focusNode: _companyPhoneFocus, validator: (v) => ValidationUtils.isValidPhone(v) ? null : 'Enter a valid 10-digit phone number'),
                        _buildField('Paid up Share Capital', 'Minimum requirement is ₹10,000 for private limited companies.', _paidUpCapitalController, isRequired: true, keyboardType: TextInputType.number),
                        _buildField('Value Per Share', 'Typically ₹10 or ₹100 per share.', _valuePerShareController, isRequired: true, keyboardType: TextInputType.number),
                        _buildField('No. of Shares', 'Total number of shares issued.', _numberOfSharesController, isRequired: true, keyboardType: TextInputType.number),
                      ],
                    ),
                  ),

                  // --- Director Details Section ---
                  Text('Step 2: Director Details', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800, color: AppTheme.corporateBlue)),
                  const SizedBox(height: 16),
                  ..._directors.asMap().entries.map((entry) {
                    final index = entry.key;
                    final data = entry.value;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 24),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey[50],
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.grey[200]!),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Person ${index + 1} Registration', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.deepTeal)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          const Text('Please provide the following information for registration (Later it can\'t be changed)', style: TextStyle(color: Colors.grey, fontSize: 13)),
                          const SizedBox(height: 24),
                          
                          _buildField('Full name', 'Enter your complete name as it appears on your official documents.', data.fullNameController, isRequired: true),
                          _buildField('Father\'s name', 'Enter your father\'s complete name as it appears on your official documents.', data.fatherNameController, isRequired: true),
                          _buildField('DOB', 'Enter your date of birth in DD/MM/YYYY format.', data.dobController, isRequired: true, isDate: true),
                          _buildField('Place of birth', 'Enter the city and state where you were born.', data.placeOfBirthController, isRequired: true),
                          
                          _buildRadioGroup('Nationality', 'Select your nationality.', ['Indian', 'Others'], data.nationality, (v) => setState(() => data.nationality = v)),
                          
                          _buildRadioGroup('Select the occupation', '', ['Business', 'Employment', 'House wife', 'Student'], data.occupationController.text, (v) => setState(() => data.occupationController.text = v)),

                          _buildField('Education', '', data.educationController, isRequired: true),
                          _buildField('Email', 'Enter your personal email address.', data.emailController, isRequired: true, keyboardType: TextInputType.emailAddress, focusNode: data.emailFocus, validator: (v) => ValidationUtils.isValidEmail(v) ? null : 'Enter a valid email address'),
                          _buildField('Phone number', 'Enter your mobile number.', data.phoneController, isRequired: true, keyboardType: TextInputType.phone, focusNode: data.phoneFocus, validator: (v) => ValidationUtils.isValidPhone(v) ? null : 'Enter a valid 10-digit phone number'),
                          _buildField('Address', 'Enter your complete residential address where you currently live. with Pin code', data.addressController, isRequired: true),
                          _buildField('PAN', 'Enter your 10-character PAN.', data.panController, isRequired: true, focusNode: data.panFocus, validator: (v) => ValidationUtils.isValidPan(v) ? null : 'Enter a valid PAN'),
                          _buildField('Aadhaar Number', 'Enter your 12-digit Aadhaar number.', data.aadhaarController, isRequired: true),
                          _buildField('DIN Number', 'Enter your 8-digit DIN if you have one. Leave blank if not.', data.dinController, isRequired: false),
                          
                          _buildRadioGroup('I need DSC', 'Select "Yes" if you need a Digital Signature Certificate.', ['Yes', 'No', 'Maybe'], data.needDsc, (v) => setState(() => data.needDsc = v)),
                          
                          _buildRadioGroup('Select your role', '', ['Director', 'Shareholder', 'Director & Shareholder'], data.role, (v) => setState(() => data.role = v)),
                          
                          _buildField('Share holding percentage', 'Enter the percentage of shares (0-100).', data.shareholdingController, isRequired: true, keyboardType: TextInputType.number),
                          
                          _buildRadioGroup('I\'m Authorized signatory', 'Select "Yes" if you will be an authorized signatory.', ['Yes', 'No'], data.isAuthSignatory, (v) => setState(() => data.isAuthSignatory = v)),
                          
                          const SizedBox(height: 24),
                          const Text('Document Uploads', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppTheme.deepTeal)),
                          const SizedBox(height: 16),
                          
                          _buildFileRow('Photo', 'Upload a recent passport-size photograph.', data.photoPath, () => _pickFile(data, 'photo')),
                          _buildFileRow('Signature', 'Upload a clear image of your signature.', data.signaturePath, () => _pickFile(data, 'signature')),
                          _buildFileRow('Residential address proof', 'Upload proof of your residential address.', data.addressProofPath, () => _pickFile(data, 'addressProof')),
                          _buildFileRow('Aadhaar Card', 'Upload Aadhaar card with front and back side pdf.', data.aadhaarPath, () => _pickFile(data, 'aadhaar')),
                          _buildFileRow('PAN Card', 'Upload PAN card.', data.panPath, () => _pickFile(data, 'pan')),
                        ],
                      ),
                    );
                  }),
                  

                  SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: _isLoading ? null : _saveDraft,
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    side: const BorderSide(color: AppTheme.deepTeal),
                  ),
                  child: Text(
                    'Save as Draft',
                    style: GoogleFonts.outfit(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.deepTeal,
                    ),
                  ),
                ),
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
                ],
              ),
            ),
    ));
  }

  Widget _buildRadioGroup(String label, String hint, List<String> options, String currentValue, Function(String) onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
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
          Wrap(
            spacing: 16,
            children: options.map((opt) {
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Radio<String>(
                    value: opt,
                    groupValue: currentValue,
                    onChanged: (v) {
                      if (v != null) onChanged(v);
                    },
                    activeColor: AppTheme.corporateBlue,
                  ),
                  Text(opt, style: const TextStyle(fontSize: 14)),
                ],
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildField(String label, String hint, TextEditingController controller, {bool isRequired = false, TextInputType keyboardType = TextInputType.text, bool isDate = false, FocusNode? focusNode, String? Function(String?)? validator}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
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
            focusNode: focusNode,
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
            validator: validator ?? (isRequired ? (v) => v == null || v.isEmpty ? 'This is a required question' : null : null),
          ),
        ],
      ),
    );
  }

  Widget _buildFileRow(String label, String hint, String? path, VoidCallback onPick) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
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
