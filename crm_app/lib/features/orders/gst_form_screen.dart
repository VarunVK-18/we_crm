import 'package:flutter/material.dart';
import '../../providers/draft_provider.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;

import '../../core/constants/port.dart';
import '../../core/theme/app_theme.dart';
import '../../models/order_model.dart';
import '../../providers/auth_provider.dart';

class GstFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const GstFormScreen({super.key, required this.order});

  @override
  ConsumerState<GstFormScreen> createState() => _GstFormScreenState();
}

class _GstFormScreenState extends ConsumerState<GstFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Trade Details
  final _tradeNameController = TextEditingController();
  final _commenceDateController = TextEditingController();
  final _businessEmailController = TextEditingController();
  final _businessPhoneController = TextEditingController();

  // Personal Information
  final _fullNameController = TextEditingController();
  final _fatherNameController = TextEditingController();
  final _dobController = TextEditingController();
  final _personalPhoneController = TextEditingController();
  final _personalEmailController = TextEditingController();
  String _gender = 'Male';
  final _dinController = TextEditingController();
  final _panController = TextEditingController();
  final _residentialAddressController = TextEditingController();
  String? _photoPath;

  // Business Details
  final _businessAddressController = TextEditingController();
  final _districtController = TextEditingController();
  String _premisesType = 'Own';
  String? _ebBillPath;
  String? _houseTaxReceiptPath;
  String? _rentalAgreementPath;

  // Bank Details
  final _accountNumberController = TextEditingController();
  final _ifscCodeController = TextEditingController();
  final _branchController = TextEditingController();

  bool _isDeclared = false;

  @override
    @override
  void initState() {
    super.initState();
    _loadDraft();
  }

  void dispose() {
    _tradeNameController.dispose();
    _commenceDateController.dispose();
    _businessEmailController.dispose();
    _businessPhoneController.dispose();
    _fullNameController.dispose();
    _fatherNameController.dispose();
    _dobController.dispose();
    _personalPhoneController.dispose();
    _personalEmailController.dispose();
    _dinController.dispose();
    _panController.dispose();
    _residentialAddressController.dispose();
    _businessAddressController.dispose();
    _districtController.dispose();
    _accountNumberController.dispose();
    _ifscCodeController.dispose();
    _branchController.dispose();
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
    final draft = await draftService.loadDraft(widget.order.id, 'GstFormScreen');
    if (draft != null) {
      if (mounted) {
        setState(() {
        if (draft.containsKey('tradeName')) _tradeNameController.text = draft['tradeName'];
        if (draft.containsKey('commenceDate')) _commenceDateController.text = draft['commenceDate'];
        if (draft.containsKey('businessEmail')) _businessEmailController.text = draft['businessEmail'];
        if (draft.containsKey('businessPhone')) _businessPhoneController.text = draft['businessPhone'];
        if (draft.containsKey('fullName')) _fullNameController.text = draft['fullName'];
        if (draft.containsKey('fatherName')) _fatherNameController.text = draft['fatherName'];
        if (draft.containsKey('dob')) _dobController.text = draft['dob'];
        if (draft.containsKey('personalPhone')) _personalPhoneController.text = draft['personalPhone'];
        if (draft.containsKey('personalEmail')) _personalEmailController.text = draft['personalEmail'];
        if (draft.containsKey('din')) _dinController.text = draft['din'];
        if (draft.containsKey('pan')) _panController.text = draft['pan'];
        if (draft.containsKey('residentialAddress')) _residentialAddressController.text = draft['residentialAddress'];
        if (draft.containsKey('businessAddress')) _businessAddressController.text = draft['businessAddress'];
        if (draft.containsKey('district')) _districtController.text = draft['district'];
        if (draft.containsKey('accountNumber')) _accountNumberController.text = draft['accountNumber'];
        if (draft.containsKey('ifscCode')) _ifscCodeController.text = draft['ifscCode'];
        if (draft.containsKey('branch')) _branchController.text = draft['branch'];
        if (draft.containsKey('gender')) _gender = draft['gender'];
        if (draft.containsKey('premisesType')) _premisesType = draft['premisesType'];

                if (draft.containsKey('photoPath')) _photoPath = draft['photoPath'];
        if (draft.containsKey('ebBillPath')) _ebBillPath = draft['ebBillPath'];
        if (draft.containsKey('houseTaxReceiptPath')) _houseTaxReceiptPath = draft['houseTaxReceiptPath'];
        if (draft.containsKey('rentalAgreementPath')) _rentalAgreementPath = draft['rentalAgreementPath'];
});
      }
    }
  }

  Future<void> _saveDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final data = <String, dynamic>{
      'tradeName': _tradeNameController.text,
      'commenceDate': _commenceDateController.text,
      'businessEmail': _businessEmailController.text,
      'businessPhone': _businessPhoneController.text,
      'fullName': _fullNameController.text,
      'fatherName': _fatherNameController.text,
      'dob': _dobController.text,
      'personalPhone': _personalPhoneController.text,
      'personalEmail': _personalEmailController.text,
      'din': _dinController.text,
      'pan': _panController.text,
      'residentialAddress': _residentialAddressController.text,
      'businessAddress': _businessAddressController.text,
      'district': _districtController.text,
      'accountNumber': _accountNumberController.text,
      'ifscCode': _ifscCodeController.text,
      'branch': _branchController.text,
      'gender': _gender,
      'premisesType': _premisesType,

          'photoPath': _photoPath,
      'ebBillPath': _ebBillPath,
      'houseTaxReceiptPath': _houseTaxReceiptPath,
      'rentalAgreementPath': _rentalAgreementPath,
};
    await draftService.saveDraft(widget.order.id, 'GstFormScreen', data);
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

    if (_photoPath == null) {
      _showError("Please upload Photo.");
      return;
    }
    if (_ebBillPath == null) {
      _showError("Please upload Latest EB Bill.");
      return;
    }
    if (_premisesType == 'Own' && _houseTaxReceiptPath == null) {
      _showError("Please upload House Tax Receipt.");
      return;
    }
    if (_premisesType == 'Rent' && _rentalAgreementPath == null) {
      _showError("Please upload Rental Agreement.");
      return;
    }

    if (!_isDeclared) {
      _showError("Please check the declaration checkbox.");
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');

      final uri = Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-gst-form');
      var request = http.MultipartRequest('POST', uri);
      request.headers['x-user-id'] = uid;

      // Trade Details
      request.fields['tradeName'] = _tradeNameController.text;
      request.fields['commenceDate'] = _commenceDateController.text;
      request.fields['businessEmail'] = _businessEmailController.text;
      request.fields['businessPhone'] = _businessPhoneController.text;

      // Personal Information
      request.fields['fullName'] = _fullNameController.text;
      request.fields['fatherName'] = _fatherNameController.text;
      request.fields['dob'] = _dobController.text;
      request.fields['personalPhone'] = _personalPhoneController.text;
      request.fields['personalEmail'] = _personalEmailController.text;
      request.fields['gender'] = _gender;
      request.fields['din'] = _dinController.text;
      request.fields['pan'] = _panController.text;
      request.fields['residentialAddress'] = _residentialAddressController.text;

      // Business Details
      request.fields['businessAddress'] = _businessAddressController.text;
      request.fields['district'] = _districtController.text;
      request.fields['premisesType'] = _premisesType;
      
      // Bank Details
      request.fields['accountNumber'] = _accountNumberController.text;
      request.fields['ifscCode'] = _ifscCodeController.text;
      request.fields['branch'] = _branchController.text;

      // Add files
      request.files.add(await http.MultipartFile.fromPath('photo', _photoPath!));
      request.files.add(await http.MultipartFile.fromPath('ebBill', _ebBillPath!));
      
      if (_premisesType == 'Own' && _houseTaxReceiptPath != null) {
        request.files.add(await http.MultipartFile.fromPath('houseTaxReceipt', _houseTaxReceiptPath!));
      } else if (_premisesType == 'Rent' && _rentalAgreementPath != null) {
        request.files.add(await http.MultipartFile.fromPath('rentalAgreement', _rentalAgreementPath!));
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
        ref.read(draftServiceProvider).clearDraft(widget.order.id, 'GstFormScreen');
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
                  
                  // Trade Details
                  _buildSectionContainer(
                    title: 'Trade Details',
                    children: [
                      _buildField('Trade Name', '', _tradeNameController, isRequired: true),
                      _buildField('Date of commencement of Business', 'DD/MM/YYYY', _commenceDateController, isRequired: true, isDate: true),
                      _buildField('Business Email ID', 'All GST communications will be shared in this mail', _businessEmailController, isRequired: true, keyboardType: TextInputType.emailAddress),
                      _buildField('Business Phone', 'All GST communications will be shared in this number', _businessPhoneController, isRequired: true, keyboardType: TextInputType.phone),
                    ],
                  ),

                  // Personal Information
                  _buildSectionContainer(
                    title: 'Personal Information',
                    children: [
                      _buildField('Full Name', '', _fullNameController, isRequired: true),
                      _buildField('Father name', '', _fatherNameController, isRequired: true),
                      _buildField('DOB', 'DD/MM/YYYY', _dobController, isRequired: true, isDate: true),
                      _buildField('Phone number', '', _personalPhoneController, isRequired: true, keyboardType: TextInputType.phone),
                      _buildField('Mail ID', '', _personalEmailController, isRequired: true, keyboardType: TextInputType.emailAddress),
                      
                      _buildRadioGroup('Gender', '', ['Male', 'Female', 'Others'], _gender, (v) => setState(() => _gender = v)),
                      
                      _buildField('DIN', 'Director Identification Number', _dinController, isRequired: false),
                      _buildField('PAN number', '', _panController, isRequired: true),
                      _buildField('Enter Full Residential Address', '', _residentialAddressController, isRequired: true, maxLines: 3),
                      
                      _buildFileRow('Upload Photo', 'Upload 1 supported file: image. Max 2 MB.', _photoPath, () => _pickFile((path) => _photoPath = path)),
                    ],
                  ),

                  // Business Details
                  _buildSectionContainer(
                    title: 'Business Details',
                    children: [
                      _buildField('Full Address with PIN code', 'Enter your business details correctly', _businessAddressController, isRequired: true, maxLines: 3),
                      _buildField('District', '', _districtController, isRequired: true),
                      
                      _buildRadioGroup('Premises Type', '', ['Own', 'Rent'], _premisesType, (v) => setState(() => _premisesType = v)),
                      
                      _buildFileRow('Upload Latest EB Bill', 'Upload 1 supported file. Max 2 MB.', _ebBillPath, () => _pickFile((path) => _ebBillPath = path)),
                      
                      if (_premisesType == 'Own')
                        _buildFileRow('For Own House (Upload House Tax Receipt)', 'Upload 1 supported file. Max 2 MB.', _houseTaxReceiptPath, () => _pickFile((path) => _houseTaxReceiptPath = path)),
                      
                      if (_premisesType == 'Rent')
                        _buildFileRow('For Rented Office (Upload Rental Agreement)', 'Upload 1 supported file. Max 2 MB.', _rentalAgreementPath, () => _pickFile((path) => _rentalAgreementPath = path)),
                    ],
                  ),

                  // Bank Details
                  _buildSectionContainer(
                    title: 'Bank Account Details',
                    children: [
                      _buildField('Account Number', '', _accountNumberController, isRequired: true, keyboardType: TextInputType.number),
                      _buildField('IFSC Code', '', _ifscCodeController, isRequired: true),
                      _buildField('Branch', '', _branchController, isRequired: true),
                    ],
                  ),

                  // Declaration
                  _buildSectionContainer(
                    title: 'Declaration',
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Checkbox(
                            value: _isDeclared,
                            activeColor: AppTheme.corporateBlue,
                            onChanged: (val) {
                              setState(() {
                                _isDeclared = val ?? false;
                              });
                            },
                          ),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.only(top: 12.0),
                              child: RichText(
                                text: const TextSpan(
                                  text: 'I hereby declare that all information provided is true and correct to the best of my knowledge.',
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
            autovalidateMode: AutovalidateMode.onUserInteraction,
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
