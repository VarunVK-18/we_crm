import 'package:dropdown_button2/dropdown_button2.dart';
import 'package:flutter/material.dart';
import '../../providers/draft_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;

import '../../core/constants/port.dart';
import '../../core/theme/app_theme.dart';
import '../../models/order_model.dart';
import '../../providers/auth_provider.dart';

class GstCancellationFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const GstCancellationFormScreen({super.key, required this.order});

  @override
  ConsumerState<GstCancellationFormScreen> createState() => _GstCancellationFormScreenState();
}

class _GstCancellationFormScreenState extends ConsumerState<GstCancellationFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Step 1: Business Details
  final _businessNameController = TextEditingController();
  final _gstinController = TextEditingController();
  String? _entityType;
  final _mobileNumberController = TextEditingController();
  final _emailIdController = TextEditingController();

  // Step 2: Cancellation Details
  final _reasonForCancellationController = TextEditingController();
  final _effectiveCancellationDateController = TextEditingController();

  // Step 3: Documents
  String? _gstCertPath;
  String? _panCardPath;
  String? _supportDocsPath;

  final List<String> _entityTypes = [
    'Proprietorship',
    'Partnership',
    'LLP',
    'Private Limited',
    'OPC',
  ];

  @override
    @override
  void initState() {
    super.initState();
    _loadDraft();
  }

  void dispose() {
    _businessNameController.dispose();
    _gstinController.dispose();
    _mobileNumberController.dispose();
    _emailIdController.dispose();
    _reasonForCancellationController.dispose();
    _effectiveCancellationDateController.dispose();
    super.dispose();
  }

  Future<void> _pickFile(Function(String) onPicked, {List<String> allowedExtensions = const ['jpg', 'jpeg', 'png', 'pdf']}) async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: allowedExtensions,
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
    final draft = await draftService.loadDraft(widget.order.id, 'GstCancellationFormScreen');
    if (draft != null) {
      if (mounted) {
        setState(() {
        if (draft.containsKey('businessName')) _businessNameController.text = draft['businessName'];
        if (draft.containsKey('mobileNumber')) _mobileNumberController.text = draft['mobileNumber'];
        if (draft.containsKey('emailId')) _emailIdController.text = draft['emailId'];
        if (draft.containsKey('reasonForCancellation')) _reasonForCancellationController.text = draft['reasonForCancellation'];
        if (draft.containsKey('effectiveCancellationDate')) _effectiveCancellationDateController.text = draft['effectiveCancellationDate'];
        if (draft.containsKey('gstin')) _gstinController.text = draft['gstin'];
        if (draft.containsKey('entityType')) _entityType = draft['entityType'];

                if (draft.containsKey('gstCertPath')) _gstCertPath = draft['gstCertPath'];
        if (draft.containsKey('panCardPath')) _panCardPath = draft['panCardPath'];
        if (draft.containsKey('supportDocsPath')) _supportDocsPath = draft['supportDocsPath'];
});
      }
    }
  }

  Future<void> _saveDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final data = <String, dynamic>{
      'businessName': _businessNameController.text,
      'mobileNumber': _mobileNumberController.text,
      'emailId': _emailIdController.text,
      'reasonForCancellation': _reasonForCancellationController.text,
      'effectiveCancellationDate': _effectiveCancellationDateController.text,
      'gstin': _gstinController.text.toUpperCase(),
      'entityType': _entityType,

          'gstCertPath': _gstCertPath,
      'panCardPath': _panCardPath,
      'supportDocsPath': _supportDocsPath,
};
    await draftService.saveDraft(widget.order.id, 'GstCancellationFormScreen', data);
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

    if (_gstCertPath == null || _panCardPath == null || _supportDocsPath == null) {
      _showError("Please upload all required documents.");
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');

      final uri = Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-gst-cancellation-form');
      var request = http.MultipartRequest('POST', uri);
      request.headers['x-user-id'] = uid;

      // Step 1
      request.fields['businessName'] = _businessNameController.text;
      request.fields['gstin'] = _gstinController.text.toUpperCase();
      request.fields['entityType'] = _entityType!;
      request.fields['mobileNumber'] = _mobileNumberController.text;
      request.fields['emailId'] = _emailIdController.text;

      // Step 2
      request.fields['reasonForCancellation'] = _reasonForCancellationController.text;
      request.fields['effectiveCancellationDate'] = _effectiveCancellationDateController.text;

      // Step 3
      request.files.add(await http.MultipartFile.fromPath('gstCert', _gstCertPath!));
      request.files.add(await http.MultipartFile.fromPath('panCard', _panCardPath!));
      request.files.add(await http.MultipartFile.fromPath('supportDocs', _supportDocsPath!));

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (!mounted) return;
        await showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Success'),
            content: const Text('GST Cancellation Form submitted successfully!'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('OK'),
              ),
            ],
          ),
        );
        if (!mounted) return;
        ref.read(draftServiceProvider).clearDraft(widget.order.id, 'GstCancellationFormScreen');
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
        actions: [],
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
                  
                  // Step 1: Business Details
                  _buildSectionContainer(
                    title: 'Step 1: Business Details',
                    children: [
                      _buildField('Business Name', '', _businessNameController, isRequired: true),
                      _buildField('GSTIN', 'e.g. 29ABCDE1234F1Z5', _gstinController, isRequired: true, isUppercase: true),
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
                              value: _entityType,
                              decoration: InputDecoration(
                                hintText: 'Select Entity Type',
                                hintStyle: const TextStyle(fontSize: 13, color: Colors.grey, fontWeight: FontWeight.normal),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.black, width: 1.5)),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              ),
                              items: _entityTypes.map((type) => DropdownMenuItem(value: type, child: Text(type))).toList(),
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
                    ],
                  ),

                  // Step 2: Cancellation Details
                  _buildSectionContainer(
                    title: 'Step 2: Cancellation Details',
                    children: [
                      _buildField('Reason for Cancellation', 'Explain the reason...', _reasonForCancellationController, isRequired: true, maxLines: 3),
                      _buildField('Effective Cancellation Date', 'DD/MM/YYYY', _effectiveCancellationDateController, isRequired: true, isDate: true),
                    ],
                  ),

                  // Step 3: Document Uploads
                  _buildSectionContainer(
                    title: 'Step 3: Document Uploads',
                    children: [
                      _buildFileRow('GST Registration Certificate', 'Max 2 MB.', _gstCertPath, () => _pickFile((path) => _gstCertPath = path)),
                      _buildFileRow('PAN Card', 'Entity / Proprietor. Max 2 MB.', _panCardPath, () => _pickFile((path) => _panCardPath = path)),
                      _buildFileRow('Supporting Documents', 'Proof supporting reason. Max 2 MB.', _supportDocsPath, () => _pickFile((path) => _supportDocsPath = path)),
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

  Widget _buildField(String label, String hint, TextEditingController controller, {bool isRequired = false, TextInputType keyboardType = TextInputType.text, int maxLines = 1, bool isDate = false, bool isUppercase = false}) {
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
            readOnly: isDate,
            textCapitalization: isUppercase ? TextCapitalization.characters : TextCapitalization.none,
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
            maxLines: maxLines,
            decoration: InputDecoration(
              hintText: hint.isNotEmpty ? hint : "Enter ${label.replaceAll('*', '').trim()}",
              hintStyle: const TextStyle(fontSize: 13, color: Colors.grey, fontWeight: FontWeight.normal),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.black, width: 1.5)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              suffixIcon: isDate ? const Icon(Icons.calendar_today, size: 20, color: Colors.grey) : null,
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
