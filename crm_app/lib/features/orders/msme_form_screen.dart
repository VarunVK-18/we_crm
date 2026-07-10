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
    @override
  void initState() {
    super.initState();
    _loadDraft();
  }

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

  Future<void> _pickFile(Function(String) onPicked, {List<String> allowedExtensions = const ['jpg', 'jpeg', 'png', 'pdf']}) async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: allowedExtensions,
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
        onPicked(result.files.single.path!);
      });
    }
  }

  
  Future<void> _loadDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final draft = await draftService.loadDraft(widget.order.id, 'MsmeFormScreen');
    if (draft != null) {
      if (mounted) {
        setState(() {
        if (draft.containsKey('enterpriseName')) _enterpriseNameController.text = draft['enterpriseName'];
        if (draft.containsKey('address')) _addressController.text = draft['address'];
        if (draft.containsKey('unitName')) _unitNameController.text = draft['unitName'];
        if (draft.containsKey('mobile')) _mobileController.text = draft['mobile'];
        if (draft.containsKey('email')) _emailController.text = draft['email'];
        if (draft.containsKey('maleEmployees')) _maleEmployeesController.text = draft['maleEmployees'];
        if (draft.containsKey('femaleEmployees')) _femaleEmployeesController.text = draft['femaleEmployees'];
        if (draft.containsKey('incDate')) _incDateController.text = draft['incDate'];
        if (draft.containsKey('commenceDate')) _commenceDateController.text = draft['commenceDate'];
        if (draft.containsKey('prevMsme')) _prevMsmeController.text = draft['prevMsme'];
        if (draft.containsKey('gst')) _gstController.text = draft['gst'];
        if (draft.containsKey('investment')) _investmentController.text = draft['investment'];
        if (draft.containsKey('turnover')) _turnoverController.text = draft['turnover'];
        if (draft.containsKey('ownerName')) _ownerNameController.text = draft['ownerName'];
        if (draft.containsKey('whatsapp')) _whatsappController.text = draft['whatsapp'];
        if (draft.containsKey('personalEmail')) _personalEmailController.text = draft['personalEmail'];
        if (draft.containsKey('orgType')) _orgType = draft['orgType'];
        if (draft.containsKey('majorActivity')) _majorActivity = draft['majorActivity'];
        if (draft.containsKey('gender')) _gender = draft['gender'];
        if (draft.containsKey('physicallyHandicapped')) _physicallyHandicapped = draft['physicallyHandicapped'];
        if (draft.containsKey('socialCategory')) _socialCategory = draft['socialCategory'];

                if (draft.containsKey('companyPanPath')) _companyPanPath = draft['companyPanPath'];
        if (draft.containsKey('ownerAadhaarPath')) _ownerAadhaarPath = draft['ownerAadhaarPath'];
        if (draft.containsKey('ownerPassbookPath')) _ownerPassbookPath = draft['ownerPassbookPath'];
});
      }
    }
  }

  Future<void> _saveDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final data = <String, dynamic>{
      'enterpriseName': _enterpriseNameController.text,
      'address': _addressController.text,
      'unitName': _unitNameController.text,
      'mobile': _mobileController.text,
      'email': _emailController.text,
      'maleEmployees': _maleEmployeesController.text,
      'femaleEmployees': _femaleEmployeesController.text,
      'incDate': _incDateController.text,
      'commenceDate': _commenceDateController.text,
      'prevMsme': _prevMsmeController.text,
      'gst': _gstController.text,
      'investment': _investmentController.text,
      'turnover': _turnoverController.text,
      'ownerName': _ownerNameController.text,
      'whatsapp': _whatsappController.text,
      'personalEmail': _personalEmailController.text,
      'orgType': _orgType,
      'majorActivity': _majorActivity,
      'gender': _gender,
      'physicallyHandicapped': _physicallyHandicapped,
      'socialCategory': _socialCategory,

          'companyPanPath': _companyPanPath,
      'ownerAadhaarPath': _ownerAadhaarPath,
      'ownerPassbookPath': _ownerPassbookPath,
};
    await draftService.saveDraft(widget.order.id, 'MsmeFormScreen', data);
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
        ref.read(draftServiceProvider).clearDraft(widget.order.id, 'MsmeFormScreen');
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
                      
                      _buildField('Date of Incorporation/ Registration of Enterprise', 'DD/MM/YYYY', _incDateController, isRequired: true, isDate: true),
                      _buildField('Date of Commencement of Business', 'DD/MM/YYYY', _commenceDateController, isRequired: true, isDate: true),
                      
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

  Widget _buildRadioGroup(String label, String hint, List<String> options, String currentValue, Function(String) onChanged) {
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
