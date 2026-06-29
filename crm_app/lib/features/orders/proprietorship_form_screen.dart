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

class ProprietorshipFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const ProprietorshipFormScreen({super.key, required this.order});

  @override
  ConsumerState<ProprietorshipFormScreen> createState() => _ProprietorshipFormScreenState();
}

class _ProprietorshipFormScreenState extends ConsumerState<ProprietorshipFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Step 1: Client Details
  final _proprietorNameController = TextEditingController();
  final _panNumberController = TextEditingController();
  final _aadhaarNumberController = TextEditingController();
  final _mobileNumberController = TextEditingController();
  final _emailIdController = TextEditingController();
  final _dobController = TextEditingController();

  // Step 2: Business Details
  final _businessNameController = TextEditingController();
  final _businessActivityController = TextEditingController();
  final _businessAddressController = TextEditingController();
  final _stateController = TextEditingController();
  final _pinCodeController = TextEditingController();

  // Step 3: Document Uploads
  String? _panCardPath;
  String? _aadhaarCardPath;
  String? _passportPhotoPath;
  String? _addressProofPath;
  String? _businessAddressProofPath;

  // Step 4: Registration Services
  bool _needGst = false;
  bool _needMsme = false;
  bool _needShopAct = false;
  bool _needFssai = false;
  bool _needIec = false;

  @override
    @override
  void initState() {
    super.initState();
    _loadDraft();
  }

  void dispose() {
    _proprietorNameController.dispose();
    _panNumberController.dispose();
    _aadhaarNumberController.dispose();
    _mobileNumberController.dispose();
    _emailIdController.dispose();
    _dobController.dispose();
    _businessNameController.dispose();
    _businessActivityController.dispose();
    _businessAddressController.dispose();
    _stateController.dispose();
    _pinCodeController.dispose();
    super.dispose();
  }

  Future<void> _pickFile(Function(String) onPicked) async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
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
    final draft = await draftService.loadDraft(widget.order.id, 'ProprietorshipFormScreen');
    if (draft != null) {
      if (mounted) {
        setState(() {
        if (draft.containsKey('proprietorName')) _proprietorNameController.text = draft['proprietorName'];
        if (draft.containsKey('panNumber')) _panNumberController.text = draft['panNumber'];
        if (draft.containsKey('aadhaarNumber')) _aadhaarNumberController.text = draft['aadhaarNumber'];
        if (draft.containsKey('mobileNumber')) _mobileNumberController.text = draft['mobileNumber'];
        if (draft.containsKey('emailId')) _emailIdController.text = draft['emailId'];
        if (draft.containsKey('dob')) _dobController.text = draft['dob'];
        if (draft.containsKey('businessName')) _businessNameController.text = draft['businessName'];
        if (draft.containsKey('businessActivity')) _businessActivityController.text = draft['businessActivity'];
        if (draft.containsKey('businessAddress')) _businessAddressController.text = draft['businessAddress'];
        if (draft.containsKey('state')) _stateController.text = draft['state'];
        if (draft.containsKey('pinCode')) _pinCodeController.text = draft['pinCode'];
        if (draft.containsKey('needGst')) _needGst = draft['needGst'] == 'true';
        if (draft.containsKey('needMsme')) _needMsme = draft['needMsme'] == 'true';
        if (draft.containsKey('needShopAct')) _needShopAct = draft['needShopAct'] == 'true';
        if (draft.containsKey('needFssai')) _needFssai = draft['needFssai'] == 'true';
        if (draft.containsKey('needIec')) _needIec = draft['needIec'] == 'true';

                if (draft.containsKey('panCardPath')) _panCardPath = draft['panCardPath'];
        if (draft.containsKey('aadhaarCardPath')) _aadhaarCardPath = draft['aadhaarCardPath'];
        if (draft.containsKey('passportPhotoPath')) _passportPhotoPath = draft['passportPhotoPath'];
        if (draft.containsKey('addressProofPath')) _addressProofPath = draft['addressProofPath'];
        if (draft.containsKey('businessAddressProofPath')) _businessAddressProofPath = draft['businessAddressProofPath'];
});
      }
    }
  }

  Future<void> _saveDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final data = <String, dynamic>{
      'proprietorName': _proprietorNameController.text,
      'panNumber': _panNumberController.text,
      'aadhaarNumber': _aadhaarNumberController.text,
      'mobileNumber': _mobileNumberController.text,
      'emailId': _emailIdController.text,
      'dob': _dobController.text,
      'businessName': _businessNameController.text,
      'businessActivity': _businessActivityController.text,
      'businessAddress': _businessAddressController.text,
      'state': _stateController.text,
      'pinCode': _pinCodeController.text,
      'needGst': _needGst.toString(),
      'needMsme': _needMsme.toString(),
      'needShopAct': _needShopAct.toString(),
      'needFssai': _needFssai.toString(),
      'needIec': _needIec.toString(),

          'panCardPath': _panCardPath,
      'aadhaarCardPath': _aadhaarCardPath,
      'passportPhotoPath': _passportPhotoPath,
      'addressProofPath': _addressProofPath,
      'businessAddressProofPath': _businessAddressProofPath,
};
    await draftService.saveDraft(widget.order.id, 'ProprietorshipFormScreen', data);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Draft saved successfully!'),
        backgroundColor: AppTheme.deepTeal,
      ));
    }
  }

  Future<void> _submitDetails() async {
    if (!_formKey.currentState!.validate()) {
      _showError('Please fill all required fields.');
      return;
    }

    if (_panCardPath == null || _aadhaarCardPath == null || _passportPhotoPath == null || _addressProofPath == null || _businessAddressProofPath == null) {
      _showError("Please upload all required documents.");
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');

      final uri = Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-proprietorship-form');
      var request = http.MultipartRequest('POST', uri);
      request.headers['x-user-id'] = uid;

      // Step 1
      request.fields['proprietorName'] = _proprietorNameController.text;
      request.fields['panNumber'] = _panNumberController.text;
      request.fields['aadhaarNumber'] = _aadhaarNumberController.text;
      request.fields['mobileNumber'] = _mobileNumberController.text;
      request.fields['emailId'] = _emailIdController.text;
      request.fields['dob'] = _dobController.text;

      // Step 2
      request.fields['businessName'] = _businessNameController.text;
      request.fields['businessActivity'] = _businessActivityController.text;
      request.fields['businessAddress'] = _businessAddressController.text;
      request.fields['state'] = _stateController.text;
      request.fields['pinCode'] = _pinCodeController.text;

      // Step 4
      request.fields['needGst'] = _needGst.toString();
      request.fields['needMsme'] = _needMsme.toString();
      request.fields['needShopAct'] = _needShopAct.toString();
      request.fields['needFssai'] = _needFssai.toString();
      request.fields['needIec'] = _needIec.toString();

      // Files
      request.files.add(await http.MultipartFile.fromPath('panCard', _panCardPath!));
      request.files.add(await http.MultipartFile.fromPath('aadhaarCard', _aadhaarCardPath!));
      request.files.add(await http.MultipartFile.fromPath('passportPhoto', _passportPhotoPath!));
      request.files.add(await http.MultipartFile.fromPath('addressProof', _addressProofPath!));
      request.files.add(await http.MultipartFile.fromPath('businessAddressProof', _businessAddressProofPath!));

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
        ref.read(draftServiceProvider).clearDraft(widget.order.id, 'ProprietorshipFormScreen');
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
                  
                  // Step 1: Proprietor Details
                  _buildSectionContainer(
                    title: 'Step 1: Proprietor Details',
                    children: [
                      _buildField('Full Name', '', _proprietorNameController, isRequired: true),
                      _buildField('PAN Number', '', _panNumberController, isRequired: true),
                      _buildField('Aadhaar Number', '', _aadhaarNumberController, isRequired: true),
                      _buildField('Mobile Number', '', _mobileNumberController, isRequired: true, keyboardType: TextInputType.phone),
                      _buildField('Email ID', '', _emailIdController, isRequired: true, keyboardType: TextInputType.emailAddress),
                      _buildField('DOB', 'MM/DD/YYYY', _dobController, isRequired: true, isDate: true),
                    ],
                  ),

                  // Step 2: Business Details
                  _buildSectionContainer(
                    title: 'Step 2: Business Details',
                    children: [
                      _buildField('Proposed Business Name', '', _businessNameController, isRequired: true),
                      _buildField('Business Activity', 'Describe products or services', _businessActivityController, isRequired: true, maxLines: 3),
                      _buildField('Business Address', '', _businessAddressController, isRequired: true, maxLines: 3),
                      _buildField('State', '', _stateController, isRequired: true),
                      _buildField('PIN Code', '', _pinCodeController, isRequired: true, keyboardType: TextInputType.number),
                    ],
                  ),

                  // Step 3: Document Uploads
                  _buildSectionContainer(
                    title: 'Step 3: Document Uploads',
                    children: [
                      _buildFileRow('Proprietor PAN Card', 'Max 2 MB.', _panCardPath, () => _pickFile((path) => _panCardPath = path)),
                      _buildFileRow('Proprietor Aadhaar Card', 'Max 2 MB.', _aadhaarCardPath, () => _pickFile((path) => _aadhaarCardPath = path)),
                      _buildFileRow('Passport Size Photo', 'Max 2 MB.', _passportPhotoPath, () => _pickFile((path) => _passportPhotoPath = path)),
                      _buildFileRow('Residential Address Proof', 'Bank Statement/Utility Bill. Max 2 MB.', _addressProofPath, () => _pickFile((path) => _addressProofPath = path)),
                      _buildFileRow('Business Address Proof', 'EB Bill/Rent Agreement. Max 2 MB.', _businessAddressProofPath, () => _pickFile((path) => _businessAddressProofPath = path)),
                    ],
                  ),

                  // Step 4: Registration Services
                  _buildSectionContainer(
                    title: 'Step 4: Registration Services',
                    children: [
                      _buildCheckbox('GST Registration', _needGst, (v) => setState(() => _needGst = v)),
                      _buildCheckbox('MSME (Udyam Registration)', _needMsme, (v) => setState(() => _needMsme = v)),
                      _buildCheckbox('Shop & Establishment Registration', _needShopAct, (v) => setState(() => _needShopAct = v)),
                      _buildCheckbox('FSSAI License', _needFssai, (v) => setState(() => _needFssai = v)),
                      _buildCheckbox('IEC Registration', _needIec, (v) => setState(() => _needIec = v)),
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

  Widget _buildCheckbox(String title, bool value, Function(bool) onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        children: [
          Checkbox(
            value: value,
            activeColor: AppTheme.corporateBlue,
            onChanged: (v) => onChanged(v ?? false),
          ),
          Expanded(child: Text(title, style: const TextStyle(fontSize: 14))),
        ],
      ),
    );
  }

  Widget _buildField(String label, String hint, TextEditingController controller, {bool isRequired = false, TextInputType keyboardType = TextInputType.text, int maxLines = 1, bool isDate = false}) {
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
              hintText: hint.isNotEmpty ? hint : 'Enter ${label.replaceAll("*", "").trim()}',
              hintStyle: const TextStyle(fontSize: 13, color: Colors.grey, fontWeight: FontWeight.normal),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.black, width: 1.5)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              suffixIcon: isDate ? const Icon(Icons.calendar_today, size: 20, color: Colors.grey) : null,
            ),
            validator: isRequired ? (v) => v == null || v.trim().isEmpty ? 'This is a required field' : null : null,
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
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.deepTeal),
              children: const [
                TextSpan(text: ' *', style: TextStyle(color: Colors.red)),
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
