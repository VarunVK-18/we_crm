import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;

import '../../core/constants/port.dart';
import '../../core/theme/app_theme.dart';
import '../../models/order_model.dart';
import '../../providers/auth_provider.dart';

class FssaiFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const FssaiFormScreen({super.key, required this.order});

  @override
  ConsumerState<FssaiFormScreen> createState() => _FssaiFormScreenState();
}

class _FssaiFormScreenState extends ConsumerState<FssaiFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Personal Info
  final _fullNameController = TextEditingController();
  final _mobileController = TextEditingController();
  final _emailController = TextEditingController();

  // Business Details
  final _businessNameController = TextEditingController();
  String _businessType = 'Proprietorship';
  final _otherBusinessTypeController = TextEditingController();

  // Nature of Food Business (Multi-Select)
  final List<String> _natureOptions = [
    'Manufacturer',
    'Trader',
    'Retailer',
    'Distributor',
    'Wholesaler',
    'Restaurant / Food Service',
    'Caterer',
    'Importer',
    'Exporter',
    'Storage / Warehouse',
    'Transporter',
    'E-commerce Food Seller',
    'Other'
  ];
  final Set<String> _selectedNature = {};
  final _otherNatureController = TextEditingController();

  final _startDateController = TextEditingController();
  String _annualTurnover = 'Below ₹12 Lakhs';
  final _employeesController = TextEditingController();

  // Address
  String _premisesType = 'Own';
  final _premisesAddressController = TextEditingController();
  final _premisesVillageController = TextEditingController();
  final _premisesDistrictController = TextEditingController();

  String _isCorrespondenceSame = 'Yes';
  final _corrAddressController = TextEditingController();
  final _corrVillageController = TextEditingController();
  final _corrDistrictController = TextEditingController();

  // Documents
  String? _aadhaarPath;
  String? _panPath;
  String? _photoPath;
  String? _addressProofPath;

  // Verification
  bool _isDeclared = false;

  @override
  void dispose() {
    _fullNameController.dispose();
    _mobileController.dispose();
    _emailController.dispose();
    _businessNameController.dispose();
    _otherBusinessTypeController.dispose();
    _otherNatureController.dispose();
    _startDateController.dispose();
    _employeesController.dispose();
    _premisesAddressController.dispose();
    _premisesVillageController.dispose();
    _premisesDistrictController.dispose();
    _corrAddressController.dispose();
    _corrVillageController.dispose();
    _corrDistrictController.dispose();
    super.dispose();
  }

  Future<void> _pickFile(Function(String) onPicked) async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
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

  Future<void> _submitDetails() async {
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please fill all required fields.'),
        backgroundColor: Colors.red,
      ));
      return;
    }

    if (_businessType == 'Other' && _otherBusinessTypeController.text.trim().isEmpty) {
      _showError("Please specify the Other Type of Business.");
      return;
    }

    if (_selectedNature.isEmpty) {
      _showError("Please select at least one Nature of Food Business.");
      return;
    }

    if (_selectedNature.contains('Other') && _otherNatureController.text.trim().isEmpty) {
      _showError("Please specify the Other Nature of Food Business.");
      return;
    }

    if (_aadhaarPath == null) {
      _showError("Please upload Aadhaar Card.");
      return;
    }
    if (_panPath == null) {
      _showError("Please upload PAN Card.");
      return;
    }
    if (_photoPath == null) {
      _showError("Please upload Passport Size Photo.");
      return;
    }
    if (_addressProofPath == null) {
      _showError("Please upload Business Address Proof.");
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

      final uri = Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-fssai-form');
      var request = http.MultipartRequest('POST', uri);
      request.headers['x-user-id'] = uid;

      // Personal Info
      request.fields['fullName'] = _fullNameController.text;
      request.fields['mobile'] = _mobileController.text;
      request.fields['email'] = _emailController.text;

      // Business Details
      request.fields['businessName'] = _businessNameController.text;
      request.fields['businessType'] = _businessType == 'Other' ? 'Other: ${_otherBusinessTypeController.text}' : _businessType;
      
      List<String> finalNature = _selectedNature.map((n) => n == 'Other' ? 'Other: ${_otherNatureController.text}' : n).toList();
      request.fields['natureOfBusiness'] = jsonEncode(finalNature);
      
      request.fields['startDate'] = _startDateController.text;
      request.fields['annualTurnover'] = _annualTurnover;
      request.fields['employees'] = _employeesController.text;

      // Address
      request.fields['premisesType'] = _premisesType;
      request.fields['premisesAddress'] = _premisesAddressController.text;
      request.fields['premisesVillage'] = _premisesVillageController.text;
      request.fields['premisesDistrict'] = _premisesDistrictController.text;
      
      request.fields['isCorrespondenceSame'] = _isCorrespondenceSame;
      if (_isCorrespondenceSame == 'No') {
        request.fields['corrAddress'] = _corrAddressController.text;
        request.fields['corrVillage'] = _corrVillageController.text;
        request.fields['corrDistrict'] = _corrDistrictController.text;
      }

      // Add files
      request.files.add(await http.MultipartFile.fromPath('aadhaarCard', _aadhaarPath!));
      request.files.add(await http.MultipartFile.fromPath('panCard', _panPath!));
      request.files.add(await http.MultipartFile.fromPath('passportPhoto', _photoPath!));
      request.files.add(await http.MultipartFile.fromPath('businessAddressProof', _addressProofPath!));

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
  
  Future<bool> _onWillPop() async {
    final shouldPop = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Are You Sure To Exit ?', style: TextStyle(fontWeight: FontWeight.bold)),
          content: const Text('Any unsaved progress will be lost.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('No'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              child: const Text('Yes', style: TextStyle(color: Colors.white)),
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
        title: const Text('FSSAI Registration Form', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w800, fontSize: 16)),
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
                  
                  // Personal Info
                  _buildSectionContainer(
                    title: 'Personal Information',
                    children: [
                      _buildField('Enter your full name', '', _fullNameController, isRequired: true),
                      _buildField('Mobile Number', '(WhatsApp number)', _mobileController, isRequired: true, keyboardType: TextInputType.phone),
                      _buildField('Email ID', '', _emailController, isRequired: true, keyboardType: TextInputType.emailAddress),
                    ],
                  ),

                  // Business Details
                  _buildSectionContainer(
                    title: 'Business Details',
                    children: [
                      _buildField('Name of Business', '', _businessNameController, isRequired: true),
                      
                      _buildRadioGroup('Type of Business', '', ['Proprietorship', 'Partnership', 'LLP', 'Private Limited Company', 'One Person Company', 'Other'], _businessType, (v) => setState(() => _businessType = v)),
                      if (_businessType == 'Other')
                        _buildField('Specify Other Business Type', '', _otherBusinessTypeController, isRequired: true),
                      
                      _buildCheckboxGroup('Nature of Food Business', '(Select all applicable)', _natureOptions),
                      if (_selectedNature.contains('Other'))
                        _buildField('Specify Other Nature', '', _otherNatureController, isRequired: true),
                      
                      _buildField('When did your business start?', 'MM/DD/YYYY', _startDateController, isRequired: true),
                      
                      _buildRadioGroup('Expected Annual Turnover', '', ['Below ₹12 Lakhs', '₹12 Lakhs – ₹20 Crores', 'Above ₹20 Crores'], _annualTurnover, (v) => setState(() => _annualTurnover = v)),
                      
                      _buildField('No. of Employees', '', _employeesController, isRequired: true, keyboardType: TextInputType.number),
                      
                      _buildRadioGroup('Premises Type', '', ['Own', 'Rent'], _premisesType, (v) => setState(() => _premisesType = v)),
                      
                      _buildField('Address of Premises', '(Door / Plot no., block / building name, street name, area name / village name, district, state, county - pin code)', _premisesAddressController, isRequired: true, maxLines: 3),
                      _buildField('Village', '', _premisesVillageController, isRequired: true),
                      _buildField('District', '', _premisesDistrictController, isRequired: true),

                      _buildRadioGroup('Is your correspondence Address same as "Address of Premises"', '', ['Yes', 'No'], _isCorrespondenceSame, (v) => setState(() => _isCorrespondenceSame = v)),
                    ],
                  ),

                  if (_isCorrespondenceSame == 'No')
                    _buildSectionContainer(
                      title: 'Correspondence Address',
                      children: [
                        Text('If your Correspondence Address differs from Business Address, kindly below the below details else go back and Select the Option "Yes"', style: TextStyle(fontSize: 12, color: Colors.grey[600], fontStyle: FontStyle.italic)),
                        const SizedBox(height: 16),
                        _buildField('Correspondence Address', '', _corrAddressController, isRequired: true, maxLines: 3),
                        _buildField('Village', '', _corrVillageController, isRequired: true),
                        _buildField('District', '', _corrDistrictController, isRequired: true),
                      ],
                    ),

                  // Documents
                  _buildSectionContainer(
                    title: 'Document Upload',
                    children: [
                      _buildFileRow('Upload Aadhaar Card', 'Upload 1 supported file: PDF, document, or image. Max 2 MB.', _aadhaarPath, () => _pickFile((path) => _aadhaarPath = path)),
                      _buildFileRow('Upload PAN Card', 'Upload 1 supported file: PDF, document, or image. Max 2 MB.', _panPath, () => _pickFile((path) => _panPath = path)),
                      _buildFileRow('Upload Passport Size Photo', 'Upload 1 supported file: PDF, document, or image. Max 2 MB.', _photoPath, () => _pickFile((path) => _photoPath = path)),
                      _buildFileRow('Upload Business Address Proof', '(Rental Agreement / Electricity Bill / NOC / Utility Bill). Max 2 MB.', _addressProofPath, () => _pickFile((path) => _addressProofPath = path)),
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

  Widget _buildCheckboxGroup(String label, String hint, List<String> options) {
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
              onTap: () {
                setState(() {
                  if (_selectedNature.contains(opt)) {
                    _selectedNature.remove(opt);
                  } else {
                    _selectedNature.add(opt);
                  }
                });
              },
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Checkbox(
                      value: _selectedNature.contains(opt),
                      onChanged: (v) {
                        setState(() {
                          if (v == true) {
                            _selectedNature.add(opt);
                          } else {
                            _selectedNature.remove(opt);
                          }
                        });
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
