import 'package:flutter/material.dart';
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

class MsmeFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const MsmeFormScreen({super.key, required this.order});

  @override
  ConsumerState<MsmeFormScreen> createState() => _MsmeFormScreenState();
}

class _MsmeFormScreenState extends ConsumerState<MsmeFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Enterprise details
  final _enterpriseNameController = TextEditingController();
  String _orgType = 'Proprietorship';
  String _majorActivity = 'Service';
  final _addressController = TextEditingController();
  final _unitNameController = TextEditingController();
  final _mobileController = TextEditingController();
  final _emailController = TextEditingController();
  final _maleEmployeesController = TextEditingController();
  final _femaleEmployeesController = TextEditingController();
  final _incDateController = TextEditingController();
  final _commenceDateController = TextEditingController();
  final _prevMsmeController = TextEditingController();
  final _gstController = TextEditingController();
  final _investmentController = TextEditingController();
  final _turnoverController = TextEditingController();
  String? _companyPanPath;

  // Business owner details
  final _ownerNameController = TextEditingController();
  String _gender = 'Male';
  final _whatsappController = TextEditingController();
  final _personalEmailController = TextEditingController();
  String _physicallyHandicapped = 'No';
  String _socialCategory = 'General';
  String? _ownerAadhaarPath;
  String? _ownerPassbookPath;

  bool _isVerified = false;

  @override
  void dispose() {
    _enterpriseNameController.dispose();
    _addressController.dispose();
    _unitNameController.dispose();
    _mobileController.dispose();
    _emailController.dispose();
    _maleEmployeesController.dispose();
    _femaleEmployeesController.dispose();
    _incDateController.dispose();
    _commenceDateController.dispose();
    _prevMsmeController.dispose();
    _gstController.dispose();
    _investmentController.dispose();
    _turnoverController.dispose();
    _ownerNameController.dispose();
    _whatsappController.dispose();
    _personalEmailController.dispose();
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
          content: Text('The file is large. Max 2MB allowed.'),
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
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please fill all required fields.'),
        backgroundColor: Colors.red,
      ));
      return;
    }

    if (_companyPanPath == null) {
      _showError("Please upload your Company's PAN Card.");
      return;
    }
    if (_ownerAadhaarPath == null) {
      _showError("Please upload your Aadhaar Card.");
      return;
    }
    if (_ownerPassbookPath == null) {
      _showError("Please upload your Bank Passbook.");
      return;
    }

    if (!_isVerified) {
      _showError("Please check the verification checkbox.");
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');

      final uri = Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-msme-form');
      var request = http.MultipartRequest('POST', uri);
      request.headers['x-user-id'] = uid;

      // Enterprise Details
      request.fields['enterpriseName'] = _enterpriseNameController.text;
      request.fields['orgType'] = _orgType;
      request.fields['majorActivity'] = _majorActivity;
      request.fields['address'] = _addressController.text;
      request.fields['unitName'] = _unitNameController.text;
      request.fields['mobile'] = _mobileController.text;
      request.fields['email'] = _emailController.text;
      request.fields['maleEmployees'] = _maleEmployeesController.text;
      request.fields['femaleEmployees'] = _femaleEmployeesController.text;
      request.fields['incDate'] = _incDateController.text;
      request.fields['commenceDate'] = _commenceDateController.text;
      request.fields['prevMsme'] = _prevMsmeController.text;
      request.fields['gst'] = _gstController.text;
      request.fields['investment'] = _investmentController.text;
      request.fields['turnover'] = _turnoverController.text;

      // Business Owner Details
      request.fields['ownerName'] = _ownerNameController.text;
      request.fields['gender'] = _gender;
      request.fields['whatsapp'] = _whatsappController.text;
      request.fields['personalEmail'] = _personalEmailController.text;
      request.fields['physicallyHandicapped'] = _physicallyHandicapped;
      request.fields['socialCategory'] = _socialCategory;

      // Add files
      request.files.add(await http.MultipartFile.fromPath('companyPan', _companyPanPath!));
      request.files.add(await http.MultipartFile.fromPath('ownerAadhaar', _ownerAadhaarPath!));
      request.files.add(await http.MultipartFile.fromPath('ownerPassbook', _ownerPassbookPath!));

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
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('MSME Certification Form', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w800, fontSize: 16)),
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
                  
                  // Enterprise Details
                  _buildSectionContainer(
                    title: 'Enterprise / Business Details',
                    children: [
                      _buildField('Name of the Enterprise / Business', '', _enterpriseNameController, isRequired: true),
                      
                      _buildRadioGroup('Type of organization', '', [
                        'Proprietorship',
                        'Partnership',
                        'LLP',
                        'Private Limited',
                        'OPC',
                        'Trust',
                        'Society'
                      ], _orgType, (v) => setState(() => _orgType = v)),
                      
                      _buildRadioGroup('Major activity', '', [
                        'Service',
                        'Manufacturing'
                      ], _majorActivity, (v) => setState(() => _majorActivity = v)),
                      
                      _buildField('Official Address of the enterprise', 'Full address', _addressController, isRequired: true, maxLines: 3),
                      _buildField('Name of Unit(s) / Plant (s)', 'Note: If no separate unit/plant, enter your office address', _unitNameController, isRequired: true),
                      _buildField('Official Mobile Number', '', _mobileController, isRequired: true, keyboardType: TextInputType.phone),
                      _buildField('Official Mail ID', '', _emailController, isRequired: true, keyboardType: TextInputType.emailAddress),
                      _buildField('No of Male Employees in your Business', '', _maleEmployeesController, isRequired: true, keyboardType: TextInputType.number),
                      _buildField('No of Female Employees in your Business', '', _femaleEmployeesController, isRequired: true, keyboardType: TextInputType.number),
                      
                      _buildField('Date of Incorporation/ Registration of Enterprise', 'DD/MM/YYYY', _incDateController, isRequired: true),
                      _buildField('Date of Commencement of Business', 'DD/MM/YYYY', _commenceDateController, isRequired: true),
                      
                      _buildField('Previous MSME / Udyog Aadhaar', 'if any', _prevMsmeController, isRequired: false),
                      _buildField('GST number', 'if available', _gstController, isRequired: true),
                      
                      _buildField('Total Investment in Plant / Machinery', 'Example: Rs.10,000', _investmentController, isRequired: true),
                      _buildField('Total Annual Turnover', 'Example: Rs.1,00,000', _turnoverController, isRequired: true),
                      
                      _buildFileRow('Upload Your Company\'s PAN Card', 'Upload 1 supported file: PDF or image. Max 2 MB.', _companyPanPath, () => _pickFile((path) => _companyPanPath = path)),
                    ],
                  ),

                  // Business Owner Details
                  _buildSectionContainer(
                    title: 'Business owner details',
                    children: [
                      _buildField('Full name', '', _ownerNameController, isRequired: true),
                      
                      _buildRadioGroup('Gender', '', ['Male', 'Female', 'Other'], _gender, (v) => setState(() => _gender = v)),
                      
                      _buildField('Personal WhatsApp number', '', _whatsappController, isRequired: true, keyboardType: TextInputType.phone),
                      _buildField('Personal Mail ID', '', _personalEmailController, isRequired: true, keyboardType: TextInputType.emailAddress),
                      
                      _buildRadioGroup('Are you physically Handicapped?', '', ['Yes', 'No'], _physicallyHandicapped, (v) => setState(() => _physicallyHandicapped = v)),
                      
                      _buildRadioGroup('Social Category of the entrepreneur', '(General / SC / ST / OBC)', ['General', 'SC', 'ST', 'OBC'], _socialCategory, (v) => setState(() => _socialCategory = v)),
                      
                      _buildFileRow('Upload Your Aadhar Card', 'Upload 1 supported file: PDF or image. Max 2 MB.', _ownerAadhaarPath, () => _pickFile((path) => _ownerAadhaarPath = path)),
                      _buildFileRow('Upload Your Bank Passbook', 'Upload 1 supported file: PDF or image. Max 2 MB.', _ownerPassbookPath, () => _pickFile((path) => _ownerPassbookPath = path)),
                    ],
                  ),

                  // Verification Checkbox
                  _buildSectionContainer(
                    title: 'Verification',
                    children: [
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
                                  text: 'I here verify that above mentioned facts are true and correct to best of my knowledge and belief',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.deepTeal),
                                  children: [
                                    TextSpan(text: ' *\n', style: TextStyle(color: Colors.red)),
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
    );
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

  Widget _buildField(String label, String hint, TextEditingController controller, {bool isRequired = false, TextInputType keyboardType = TextInputType.text, int maxLines = 1}) {
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
            maxLines: maxLines,
            decoration: InputDecoration(
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.black, width: 1.5)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
