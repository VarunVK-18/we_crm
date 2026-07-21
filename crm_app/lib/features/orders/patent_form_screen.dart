import 'package:crm_app/core/utils/error_handler.dart';
import 'package:crm_app/core/utils/file_picker_util.dart';
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

class PatentFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const PatentFormScreen({super.key, required this.order});

  @override
  ConsumerState<PatentFormScreen> createState() => _PatentFormScreenState();
}

class _PatentFormScreenState extends ConsumerState<PatentFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Step 1: Applicant Details
  final _applicantNameController = TextEditingController();
  String? _entityType;
  final _mobileNumberController = TextEditingController();
  final _emailIdController = TextEditingController();
  final _addressController = TextEditingController();

  // Step 2: Invention Details
  final _inventionTitleController = TextEditingController();
  final _inventionDescController = TextEditingController();
  final _industryCategoryController = TextEditingController();
  final _inventorNamesController = TextEditingController();

  // Step 3: Inventor Details
  final _inventorNameController = TextEditingController();
  final _inventorNationalityController = TextEditingController();
  final _inventorAddressController = TextEditingController();

  // Step 4: Documents
  String? _identityProofPath;
  String? _addressProofPath;
  String? _inventionDescriptionDocPath;
  String? _drawingsDiagramsPath;
  String? _authLetterPath;

  final List<String> _entityTypes = [
    'Individual',
    'Startup',
    'Small Entity',
    'Educational Institution',
    'Corporate / Other',
  ];

  @override
    @override
  void initState() {
    super.initState();
    _loadDraft();
  }

  @override
  void dispose() {
    _applicantNameController.dispose();
    _mobileNumberController.dispose();
    _emailIdController.dispose();
    _addressController.dispose();
    _inventionTitleController.dispose();
    _inventionDescController.dispose();
    _industryCategoryController.dispose();
    _inventorNamesController.dispose();
    _inventorNameController.dispose();
    _inventorNationalityController.dispose();
    _inventorAddressController.dispose();
    super.dispose();
  }

  Future<void> _pickFile(Function(String) onPicked, {List<String> allowedExtensions = const ['jpg', 'jpeg', 'png', 'pdf']}) async {
    FilePickerResult? result = await FilePickerUtil.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
    );
    if (result != null && result.files.single.path != null) {
      if (result.files.single.size > 2 * 1024 * 1024) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Upload a file less than 2 MB.'),
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
    final draft = await draftService.loadDraft(widget.order.id, 'PatentFormScreen');
    if (draft != null) {
      if (mounted) {
        setState(() {
        if (draft.containsKey('applicantName')) _applicantNameController.text = draft['applicantName'];
        if (draft.containsKey('mobileNumber')) _mobileNumberController.text = draft['mobileNumber'];
        if (draft.containsKey('emailId')) _emailIdController.text = draft['emailId'];
        if (draft.containsKey('address')) _addressController.text = draft['address'];
        if (draft.containsKey('inventionTitle')) _inventionTitleController.text = draft['inventionTitle'];
        if (draft.containsKey('inventionDescription')) _inventionDescController.text = draft['inventionDescription'];
        if (draft.containsKey('industryCategory')) _industryCategoryController.text = draft['industryCategory'];
        if (draft.containsKey('inventorNames')) _inventorNamesController.text = draft['inventorNames'];
        if (draft.containsKey('inventorName')) _inventorNameController.text = draft['inventorName'];
        if (draft.containsKey('inventorNationality')) _inventorNationalityController.text = draft['inventorNationality'];
        if (draft.containsKey('inventorAddress')) _inventorAddressController.text = draft['inventorAddress'];
        if (draft.containsKey('entityType')) _entityType = draft['entityType'];

                if (draft.containsKey('identityProofPath')) _identityProofPath = draft['identityProofPath'];
        if (draft.containsKey('addressProofPath')) _addressProofPath = draft['addressProofPath'];
        if (draft.containsKey('inventionDescriptionDocPath')) _inventionDescriptionDocPath = draft['inventionDescriptionDocPath'];
        if (draft.containsKey('drawingsDiagramsPath')) _drawingsDiagramsPath = draft['drawingsDiagramsPath'];
        if (draft.containsKey('authLetterPath')) _authLetterPath = draft['authLetterPath'];
});
      }
    }
  }

  Future<void> _saveDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final data = <String, dynamic>{
      'applicantName': _applicantNameController.text,
      'mobileNumber': _mobileNumberController.text,
      'emailId': _emailIdController.text,
      'address': _addressController.text,
      'inventionTitle': _inventionTitleController.text,
      'inventionDescription': _inventionDescController.text,
      'industryCategory': _industryCategoryController.text,
      'inventorNames': _inventorNamesController.text,
      'inventorName': _inventorNameController.text,
      'inventorNationality': _inventorNationalityController.text,
      'inventorAddress': _inventorAddressController.text,
      'entityType': _entityType,

          'identityProofPath': _identityProofPath,
      'addressProofPath': _addressProofPath,
      'inventionDescriptionDocPath': _inventionDescriptionDocPath,
      'drawingsDiagramsPath': _drawingsDiagramsPath,
      'authLetterPath': _authLetterPath,
};
    await draftService.saveDraft(widget.order.id, 'PatentFormScreen', data);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Draft saved successfully!'),
        backgroundColor: AppTheme.deepTeal,
      ));
    }
  }

  Future<void> _submitDetails() async {
    if (!_formKey.currentState!.validate() || _entityType == null) {
      _showError('Please fill all required fields.');
      return;
    }

    if (_identityProofPath == null || _addressProofPath == null || _inventionDescriptionDocPath == null) {
      _showError("Please upload all required documents (Identity, Address, Invention Description).");
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');

      final uri = Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-patent-form');
      var request = http.MultipartRequest('POST', uri);
      request.headers['x-user-id'] = uid;

      // Step 1
      request.fields['applicantName'] = _applicantNameController.text;
      request.fields['entityType'] = _entityType!;
      request.fields['mobileNumber'] = _mobileNumberController.text;
      request.fields['emailId'] = _emailIdController.text;
      request.fields['address'] = _addressController.text;

      // Step 2
      request.fields['inventionTitle'] = _inventionTitleController.text;
      request.fields['inventionDescription'] = _inventionDescController.text;
      request.fields['industryCategory'] = _industryCategoryController.text;
      request.fields['inventorNames'] = _inventorNamesController.text;

      // Step 3
      request.fields['inventorName'] = _inventorNameController.text;
      request.fields['inventorNationality'] = _inventorNationalityController.text;
      request.fields['inventorAddress'] = _inventorAddressController.text;

      // Step 4
      request.files.add(await http.MultipartFile.fromPath('identityProof', _identityProofPath!));
      request.files.add(await http.MultipartFile.fromPath('addressProof', _addressProofPath!));
      request.files.add(await http.MultipartFile.fromPath('inventionDescriptionDoc', _inventionDescriptionDocPath!));
      
      if (_drawingsDiagramsPath != null) {
        request.files.add(await http.MultipartFile.fromPath('drawingsDiagrams', _drawingsDiagramsPath!));
      }
      if (_authLetterPath != null) {
        request.files.add(await http.MultipartFile.fromPath('authLetter', _authLetterPath!));
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (!mounted) return;
        await showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Success'),
            content: const Text('Patent Form submitted successfully!'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('OK'),
              ),
            ],
          ),
        );
        if (!mounted) return;
        ref.read(draftServiceProvider).clearDraft(widget.order.id, 'PatentFormScreen');
        Navigator.pop(context, true); // Success
      } else {
        throw Exception('Failed to submit form: ${response.body}');
      }
    } catch (e) {
      showGlobalError(e);
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

  Future<bool> _onWillPop() async {
    final shouldPop = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Save as Draft?'),
          content: const Text('Do you want to save your progress before exiting?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: Text(
                'Discard',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.red),
              ),
            ),
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
                'Save as Draft',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.corporateBlue,
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ),
          ],
        );
      },
    );
    return shouldPop ?? false;
  }

  @override
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
        actions: const [],
      ),
      body: _isLoading 
          ? const Center(child: CircularProgressIndicator()) 
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  Text('Complete Details', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w600, color: AppTheme.corporateBlue)),
                  const SizedBox(height: 16),
                  
                  // Step 1: Applicant Details
                  _buildSectionContainer(
                    title: 'Step 1: Applicant Details',
                    children: [
                      _buildField('Applicant Name', 'Individual or Company Name', _applicantNameController, isRequired: true),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            RichText(
                              text: const TextSpan(
                                text: 'Entity Type',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.deepTeal),
                                children: [
                                  TextSpan(text: ' *', style: TextStyle(color: Colors.red)),
                                ]
                              ),
                            ),
                            const SizedBox(height: 8),
                            DropdownButtonFormField<String>(
                              initialValue: _entityType,
                              decoration: InputDecoration(
              hintText: 'Select Entity Type',
              hintStyle: const TextStyle(fontSize: 13, color: Colors.grey, fontWeight: FontWeight.normal),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.black, width: 1.5)),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              ),
                              items: _entityTypes.map<DropdownMenuItem<String>>((String type) => DropdownMenuItem<String>(value: type, child: Text(type, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w400)))).toList(),
                              onChanged: (val) {
                                setState(() {
                                  _entityType = val;
                                });
                              },
                              validator: (value) => value == null ? 'Please select entity type' : null,
                            ),
                          ],
                        ),
                      ),
                      _buildField('Mobile Number', '+91', _mobileNumberController, isRequired: true, keyboardType: TextInputType.phone),
                      _buildField('Email ID', 'email@example.com', _emailIdController, isRequired: true, keyboardType: TextInputType.emailAddress),
                      _buildField('Address', 'Full applicant address', _addressController, isRequired: true, maxLines: 2),
                    ],
                  ),

                  // Step 2: Invention Details
                  _buildSectionContainer(
                    title: 'Step 2: Invention Details',
                    children: [
                      _buildField('Invention Title', 'Title of your invention', _inventionTitleController, isRequired: true),
                      _buildField('Invention Description', 'Brief description of the invention', _inventionDescController, isRequired: true, maxLines: 3),
                      _buildField('Industry Category', 'e.g. Software, Mechanical, Pharma', _industryCategoryController, isRequired: true),
                      _buildField('Inventor Name(s)', 'Comma separated list of inventors', _inventorNamesController, isRequired: true),
                    ],
                  ),

                  // Step 3: Inventor Details
                  _buildSectionContainer(
                    title: 'Step 3: Primary Inventor Details',
                    children: [
                      _buildField('Inventor Name', 'Full Name', _inventorNameController, isRequired: true),
                      _buildField('Nationality', 'e.g. Indian', _inventorNationalityController, isRequired: true),
                      _buildField('Inventor Address', 'Full residential address', _inventorAddressController, isRequired: true, maxLines: 2),
                    ],
                  ),

                  // Step 4: Document Uploads
                  _buildSectionContainer(
                    title: 'Step 4: Document Uploads',
                    children: [
                      _buildFileRow('Identity Proof', 'Aadhaar/Passport/PAN. Max 2 MB.', _identityProofPath, () => _pickFile((path) => _identityProofPath = path)),
                      _buildFileRow('Address Proof', 'Max 2 MB.', _addressProofPath, () => _pickFile((path) => _addressProofPath = path, allowedExtensions: const ['pdf'])),
                      _buildFileRow('Invention Description', 'Detailed description file. Max 2 MB.', _inventionDescriptionDocPath, () => _pickFile((path) => _inventionDescriptionDocPath = path)),
                      _buildFileRow('Drawings / Diagrams', 'If applicable. Max 2 MB.', _drawingsDiagramsPath, () => _pickFile((path) => _drawingsDiagramsPath = path), isRequired: false),
                      _buildFileRow('Authorization Letter', 'If applicable. Max 2 MB.', _authLetterPath, () => _pickFile((path) => _authLetterPath = path), isRequired: false),
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

  Widget _buildSectionContainer({required String title, required List<Widget> children}) {
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
          const SizedBox(height: 24),
          ...children,
        ],
      ),
    );
  }

  Widget _buildField(String label, String hint, TextEditingController controller, {bool isRequired = false, TextInputType keyboardType = TextInputType.text, int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: label,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.deepTeal),
              children: [
                if (isRequired)
                  const TextSpan(text: ' *', style: TextStyle(color: Colors.red)),
              ]
            ),
          ),
          if (hint.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(hint, style: TextStyle(fontSize: 11, fontWeight: FontWeight.normal, color: Colors.grey[500])),
          ],
          const SizedBox(height: 8),
          TextFormField(
            controller: controller,
            keyboardType: keyboardType,
            maxLines: maxLines,
            decoration: InputDecoration(
              hintText: hint.isNotEmpty ? hint : 'Enter ${label.replaceAll('*', '').trim()}',
              hintStyle: const TextStyle(fontSize: 13, color: Colors.grey, fontWeight: FontWeight.normal),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.black, width: 1.5)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            validator: (v) {
  if (isRequired && (v == null || v.trim().isEmpty)) {
    return 'This is a required question';
  }
  if (v != null && v.trim().isNotEmpty) {
    final text = v.trim();
    final labelLower = label.toLowerCase();
    if (labelLower.contains('phone') || labelLower.contains('mobile') || labelLower.contains('contact') || labelLower.contains('number')) {
      if (labelLower.contains('company') || labelLower.contains('whatsapp') || labelLower.contains('director') || labelLower.contains('business') || labelLower == 'phone number' || labelLower == 'mobile number' || labelLower == 'contact number' || labelLower == 'company number') {
         if (!RegExp(r'^[0-9]{10}$').hasMatch(text)) return 'Enter a valid 10-digit phone number';
      }
    }
    if (labelLower.contains('mail') || labelLower.contains('email')) {
      if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(text)) return 'Enter a valid email address';
    }
    if (labelLower.contains('aadhaar') || labelLower.contains('adhar')) {
      if (!RegExp(r'^[2-9]{1}[0-9]{11}$').hasMatch(text)) return 'Enter a valid 12-digit Aadhaar number';
    }
    if (labelLower.contains('pan ') || labelLower == 'pan' || labelLower.contains('pan number')) {
      if (!RegExp(r'^[a-zA-Z]{5}[0-9]{4}[a-zA-Z]{1}$').hasMatch(text)) return 'Enter a valid PAN (e.g. ABCDE1234F)';
    }
    if (labelLower.contains('tan ') || labelLower == 'tan' || labelLower.contains('tan number')) {
      if (!RegExp(r'^[a-zA-Z]{4}[0-9]{5}[a-zA-Z]{1}$').hasMatch(text)) return 'Enter a valid TAN (e.g. ABCD12345E)';
    }
  }
  return null;
},
          ),
        ],
      ),
    );
  }

  Widget _buildFileRow(String label, String hint, String? path, VoidCallback onPick, {bool isRequired = true}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: label,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.deepTeal),
              children: [
                if (isRequired)
                  const TextSpan(text: ' *', style: TextStyle(color: Colors.red)),
              ]
            ),
          ),
          if (hint.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(hint, style: TextStyle(fontSize: 11, fontWeight: FontWeight.normal, color: Colors.grey[500])),
          ],
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  path == null ? 'Upload supported file. Max 2 MB.' : path.split('/').last, 
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
                  minimumSize: const Size(80, 32),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
