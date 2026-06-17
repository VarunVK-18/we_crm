import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;

import '../../core/constants/port.dart';
import '../../core/theme/app_theme.dart';
import '../../models/order_model.dart';
import '../../providers/auth_provider.dart';

class PfFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const PfFormScreen({super.key, required this.order});

  @override
  ConsumerState<PfFormScreen> createState() => _PfFormScreenState();
}

class _PfFormScreenState extends ConsumerState<PfFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Step 1: Business Details
  final _businessNameController = TextEditingController();
  String? _entityType;
  final _panNumberController = TextEditingController();
  final _doiController = TextEditingController();
  final _businessAddressController = TextEditingController();
  final _stateController = TextEditingController();
  final _pinCodeController = TextEditingController();

  // Step 2: Signatory Details
  final _signatoryNameController = TextEditingController();
  final _signatoryDesignationController = TextEditingController();
  final _signatoryMobileController = TextEditingController();
  final _signatoryEmailController = TextEditingController();

  // Step 3: Employee Info
  final _numEmployeesController = TextEditingController();
  final _empDetailsController = TextEditingController();

  // Step 4: Documents
  String? _panCardPath;
  String? _businessAddressProofPath;
  String? _incorpCertPath;
  String? _cancelledChequePath;
  String? _authSignatoryProofPath;

  final List<String> _entityTypes = [
    'Private Limited',
    'LLP',
    'OPC',
    'Proprietorship',
    'Partnership',
  ];

  @override
  void dispose() {
    _businessNameController.dispose();
    _panNumberController.dispose();
    _doiController.dispose();
    _businessAddressController.dispose();
    _stateController.dispose();
    _pinCodeController.dispose();
    _signatoryNameController.dispose();
    _signatoryDesignationController.dispose();
    _signatoryMobileController.dispose();
    _signatoryEmailController.dispose();
    _numEmployeesController.dispose();
    _empDetailsController.dispose();
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

  Future<void> _submitDetails() async {
    if (!_formKey.currentState!.validate() || _entityType == null) {
      _showError('Please fill all required fields.');
      return;
    }

    if (_panCardPath == null || _businessAddressProofPath == null || _cancelledChequePath == null || _authSignatoryProofPath == null) {
      _showError("Please upload all required documents.");
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');

      final uri = Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-pf-form');
      var request = http.MultipartRequest('POST', uri);
      request.headers['x-user-id'] = uid;

      // Step 1
      request.fields['businessName'] = _businessNameController.text;
      request.fields['entityType'] = _entityType!;
      request.fields['panNumber'] = _panNumberController.text;
      request.fields['dateOfIncorporation'] = _doiController.text;
      request.fields['businessAddress'] = _businessAddressController.text;
      request.fields['state'] = _stateController.text;
      request.fields['pinCode'] = _pinCodeController.text;

      // Step 2
      request.fields['signatoryName'] = _signatoryNameController.text;
      request.fields['signatoryDesignation'] = _signatoryDesignationController.text;
      request.fields['signatoryMobile'] = _signatoryMobileController.text;
      request.fields['signatoryEmail'] = _signatoryEmailController.text;

      // Step 3
      request.fields['numberOfEmployees'] = _numEmployeesController.text;
      if (_empDetailsController.text.isNotEmpty) {
        request.fields['employeeDetails'] = _empDetailsController.text;
      }

      // Step 4
      request.files.add(await http.MultipartFile.fromPath('panCard', _panCardPath!));
      request.files.add(await http.MultipartFile.fromPath('businessAddressProof', _businessAddressProofPath!));
      request.files.add(await http.MultipartFile.fromPath('cancelledCheque', _cancelledChequePath!));
      request.files.add(await http.MultipartFile.fromPath('authSignatoryProof', _authSignatoryProofPath!));
      
      if (_incorpCertPath != null) {
        request.files.add(await http.MultipartFile.fromPath('incorpCert', _incorpCertPath!));
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (!mounted) return;
        await showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Success'),
            content: const Text('PF Form submitted successfully!'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('OK'),
              ),
            ],
          ),
        );
        if (!mounted) return;
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

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('PF Registration Form', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w800, fontSize: 16)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
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
                  
                  // Step 1: Business Details
                  _buildSectionContainer(
                    title: 'Step 1: Business Details',
                    children: [
                      _buildField('Business Name', '', _businessNameController, isRequired: true),
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
                      _buildField('PAN Number', '', _panNumberController, isRequired: true),
                      _buildField('Date of Incorporation', 'MM/DD/YYYY', _doiController, isRequired: true, isDate: true),
                      _buildField('Business Address', '', _businessAddressController, isRequired: true, maxLines: 3),
                      _buildField('State', '', _stateController, isRequired: true),
                      _buildField('PIN Code', '', _pinCodeController, isRequired: true, keyboardType: TextInputType.number),
                    ],
                  ),

                  // Step 2: Signatory Details
                  _buildSectionContainer(
                    title: 'Step 2: Authorized Signatory Details',
                    children: [
                      _buildField('Full Name', '', _signatoryNameController, isRequired: true),
                      _buildField('Designation', '', _signatoryDesignationController, isRequired: true),
                      _buildField('Mobile Number', '', _signatoryMobileController, isRequired: true, keyboardType: TextInputType.phone),
                      _buildField('Email ID', '', _signatoryEmailController, isRequired: true, keyboardType: TextInputType.emailAddress),
                    ],
                  ),

                  // Step 3: Employee Info
                  _buildSectionContainer(
                    title: 'Step 3: Employee Information',
                    children: [
                      _buildField('Number of Employees', '', _numEmployeesController, isRequired: true, keyboardType: TextInputType.number),
                      _buildField('Employee Details', '(Optional)', _empDetailsController, maxLines: 2),
                    ],
                  ),

                  // Step 4: Document Uploads
                  _buildSectionContainer(
                    title: 'Step 4: Document Uploads',
                    children: [
                      _buildFileRow('PAN Card', 'Entity / Proprietor PAN. Max 2 MB.', _panCardPath, () => _pickFile((path) => _panCardPath = path)),
                      _buildFileRow('Business Address Proof', 'EB Bill/Rent Agreement. Max 2 MB.', _businessAddressProofPath, () => _pickFile((path) => _businessAddressProofPath = path)),
                      _buildFileRow('Cancelled Cheque', 'Max 2 MB.', _cancelledChequePath, () => _pickFile((path) => _cancelledChequePath = path)),
                      _buildFileRow('Authorized Signatory ID Proof', 'Max 2 MB.', _authSignatoryProofPath, () => _pickFile((path) => _authSignatoryProofPath = path)),
                      _buildFileRow('Certificate of Incorporation', 'If applicable. Max 2 MB.', _incorpCertPath, () => _pickFile((path) => _incorpCertPath = path), isRequired: false),
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

  Widget _buildField(String label, String hint, TextEditingController controller, {bool isRequired = false, TextInputType keyboardType = TextInputType.text, int maxLines = 1, bool isDate = false}) {
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
            maxLines: maxLines,
            decoration: InputDecoration(
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
