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

class LeiFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const LeiFormScreen({super.key, required this.order});

  @override
  ConsumerState<LeiFormScreen> createState() => _LeiFormScreenState();
}

class _LeiFormScreenState extends ConsumerState<LeiFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Fields
  final _authorizedPersonController = TextEditingController();
  final _designationController = TextEditingController();
  final _mobileController = TextEditingController();
  final _emailController = TextEditingController();

  String? _turnoverType;
  final List<String> _turnoverOptions = [
    'Less Than 50 Cr',
    'More Than 50 Cr'
  ];

  String? _addressProofPath;
  String? _incorpCertPath;
  String? _panCardPath;
  String? _gstCertPath;
  String? _auditedFinancialsPath;
  String? _moaAoaPath;
  String? _boardResolutionPath;

  @override
    @override
  void initState() {
    super.initState();
    _loadDraft();
  }

  void dispose() {
    _authorizedPersonController.dispose();
    _designationController.dispose();
    _mobileController.dispose();
    _emailController.dispose();
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
    final draft = await draftService.loadDraft(widget.order.id, 'LeiFormScreen');
    if (draft != null) {
      if (mounted) {
        setState(() {
        if (draft.containsKey('authorizedPerson')) _authorizedPersonController.text = draft['authorizedPerson'];
        if (draft.containsKey('designation')) _designationController.text = draft['designation'];
        if (draft.containsKey('mobileNumber')) _mobileController.text = draft['mobileNumber'];
        if (draft.containsKey('emailId')) _emailController.text = draft['emailId'];
        if (draft.containsKey('turnoverType')) _turnoverType = draft['turnoverType'];

        });
      }
    }
  }

  Future<void> _saveDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final data = <String, dynamic>{
      'authorizedPerson': _authorizedPersonController.text,
      'designation': _designationController.text,
      'mobileNumber': _mobileController.text,
      'emailId': _emailController.text,
      'turnoverType': _turnoverType,

    };
    await draftService.saveDraft(widget.order.id, 'LeiFormScreen', data);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Draft saved successfully!'),
        backgroundColor: AppTheme.deepTeal,
      ));
    }
  }

  Future<void> _submitDetails() async {
    if (!_formKey.currentState!.validate() || _turnoverType == null) {
      _showError('Please fill all required fields.');
      return;
    }

    if (_addressProofPath == null || _incorpCertPath == null || _panCardPath == null ||
        _gstCertPath == null || _auditedFinancialsPath == null) {
      _showError('Please upload all required documents.');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');

      final uri = Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-lei-form');
      var request = http.MultipartRequest('POST', uri);
      request.headers['x-user-id'] = uid;

      request.fields['authorizedPerson'] = _authorizedPersonController.text;
      request.fields['designation'] = _designationController.text;
      request.fields['mobileNumber'] = _mobileController.text;
      request.fields['emailId'] = _emailController.text;
      request.fields['turnoverType'] = _turnoverType!;

      request.files.add(await http.MultipartFile.fromPath('addressProof', _addressProofPath!));
      request.files.add(await http.MultipartFile.fromPath('incorpCert', _incorpCertPath!));
      request.files.add(await http.MultipartFile.fromPath('panCard', _panCardPath!));
      request.files.add(await http.MultipartFile.fromPath('gstCert', _gstCertPath!));
      request.files.add(await http.MultipartFile.fromPath('auditedFinancials', _auditedFinancialsPath!));
      
      if (_moaAoaPath != null) {
        request.files.add(await http.MultipartFile.fromPath('moaAoa', _moaAoaPath!));
      }
      if (_boardResolutionPath != null) {
        request.files.add(await http.MultipartFile.fromPath('boardResolution', _boardResolutionPath!));
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (!mounted) return;
        await showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Success'),
            content: const Text('LEI Form submitted successfully!'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('OK'),
              ),
            ],
          ),
        );
        if (!mounted) return;
        ref.read(draftServiceProvider).clearDraft(widget.order.id, 'LeiFormScreen');
        Navigator.pop(context, true);
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
                  
                  _buildSectionContainer(
                    title: 'Applicant Details',
                    children: [
                      _buildField('Name of the Authorized Person', '', _authorizedPersonController, isRequired: true),
                      _buildField('Designation', 'e.g. Director, Partner', _designationController, isRequired: true),
                      _buildField('Mobile Number', '', _mobileController, isRequired: true, keyboardType: TextInputType.phone),
                      _buildField('Email ID', '', _emailController, isRequired: true, keyboardType: TextInputType.emailAddress),
                      
                      Padding(
                        padding: const EdgeInsets.only(bottom: 24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            RichText(
                              text: const TextSpan(
                                text: 'Turnover Details',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.deepTeal),
                                children: [
                                  TextSpan(text: ' *', style: TextStyle(color: Colors.red)),
                                ]
                              ),
                            ),
                            const SizedBox(height: 8),
                            DropdownButtonFormField<String>(
                              value: _turnoverType,
                              decoration: InputDecoration(
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.black, width: 1.5)),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              ),
                              items: _turnoverOptions.map((type) => DropdownMenuItem(value: type, child: Text(type))).toList(),
                              onChanged: (val) {
                                setState(() {
                                  _turnoverType = val;
                                });
                              },
                              validator: (value) => value == null ? 'Please select turnover details' : null,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  _buildSectionContainer(
                    title: 'Document Uploads',
                    children: [
                      _buildFileRow('Address Proof', 'Company Address Proof. Max 2 MB.', _addressProofPath, () => _pickFile((path) => _addressProofPath = path)),
                      _buildFileRow('Incorporation Certificate', 'Max 2 MB.', _incorpCertPath, () => _pickFile((path) => _incorpCertPath = path)),
                      _buildFileRow('Company PAN Card', 'Max 2 MB.', _panCardPath, () => _pickFile((path) => _panCardPath = path)),
                      _buildFileRow('GST Certificate', 'Max 2 MB.', _gstCertPath, () => _pickFile((path) => _gstCertPath = path)),
                      _buildFileRow('Audited Financials', 'Latest Audited Financials. Max 2 MB.', _auditedFinancialsPath, () => _pickFile((path) => _auditedFinancialsPath = path)),
                      _buildFileRow('MOA and AOA', 'Max 2 MB.', _moaAoaPath, () => _pickFile((path) => _moaAoaPath = path), isRequired: false),
                      _buildFileRow('Board Resolution', 'Max 2 MB.', _boardResolutionPath, () => _pickFile((path) => _boardResolutionPath = path), isRequired: false),
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

  Widget _buildField(String label, String hint, TextEditingController controller, {bool isRequired = false, TextInputType keyboardType = TextInputType.text}) {
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
            decoration: InputDecoration(
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.black, width: 1.5)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            validator: isRequired ? (v) => v == null || v.trim().isEmpty ? 'This is a required field' : null : null,
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

