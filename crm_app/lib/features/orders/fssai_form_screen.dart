import 'package:crm_app/core/theme/app_theme.dart';
import 'package:crm_app/providers/auth_provider.dart';
import 'package:crm_app/core/constants/port.dart';
import 'package:crm_app/core/utils/error_handler.dart';
import 'package:crm_app/core/utils/file_picker_util.dart';
import 'dart:convert';
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
  final _aadhaarNumberController = TextEditingController();
  final _mobileController = TextEditingController();
  final _emailController = TextEditingController();
  final _employeesController = TextEditingController();

  // Business Details
  final _businessNameController = TextEditingController();
  final _companyPanNumberController = TextEditingController();
  final _startDateController = TextEditingController();
  String _annualTurnover = 'Below ₹12 Lakhs';
  String _businessType = 'Proprietorship';
  final _otherBusinessTypeController = TextEditingController();

  // Nature of Food Business (Multi-Select)
  final List<String> _natureOptions = [
    'Manufacturer', 'Trader', 'Retailer', 'Distributor', 'Wholesaler',
    'Restaurant / Food Service', 'Caterer', 'Importer', 'Exporter',
    'Storage / Warehouse', 'Transporter', 'E-commerce Food Seller', 'Other'
  ];
  final Set<String> _selectedNature = {};
  final _otherNatureController = TextEditingController();

  // Address
  String _premisesType = 'Own';
  final _premisesAddressController = TextEditingController();

  String _isCorrespondenceSame = 'Yes';
  final _corrAddressController = TextEditingController();

  // Documents
  String? _aadhaarPath;
  String? _panPath;
  String? _photoPath;
  String? _addressProofPath;
  String? _unitEntrancePhotoPath;

  // Verification
  bool _isDeclared = false;

  @override
  void initState() {
    super.initState();
    _loadDraft();
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _aadhaarNumberController.dispose();
    _mobileController.dispose();
    _emailController.dispose();
    _employeesController.dispose();
    _businessNameController.dispose();
    _companyPanNumberController.dispose();
    _otherBusinessTypeController.dispose();
    _otherNatureController.dispose();
    _startDateController.dispose();
    _premisesAddressController.dispose();
    _corrAddressController.dispose();
    super.dispose();
  }

  Future<void> _loadDraft() async {
    final draftData = await ref.read(draftServiceProvider).loadDraft(widget.order.id, 'FssaiFormScreen');
    if (draftData != null && mounted) {
      setState(() {
        _fullNameController.text = draftData['fullName'] ?? '';
        _aadhaarNumberController.text = draftData['aadhaarNumber'] ?? '';
        _mobileController.text = draftData['mobile'] ?? '';
        _emailController.text = draftData['email'] ?? '';
        _employeesController.text = draftData['employees'] ?? '';
        _businessNameController.text = draftData['businessName'] ?? '';
        _companyPanNumberController.text = draftData['companyPanNumber'] ?? '';
        _businessType = draftData['businessType'] ?? 'Proprietorship';
        _otherBusinessTypeController.text = draftData['otherBusinessType'] ?? '';
        _startDateController.text = draftData['startDate'] ?? '';
        _annualTurnover = draftData['annualTurnover'] ?? 'Below ₹12 Lakhs';
        
        if (draftData['selectedNature'] != null) {
          _selectedNature.clear();
          _selectedNature.addAll(List<String>.from(jsonDecode(draftData['selectedNature'])));
        }
        _otherNatureController.text = draftData['otherNature'] ?? '';

        _premisesType = draftData['premisesType'] ?? 'Own';
        _premisesAddressController.text = draftData['premisesAddress'] ?? '';
        _isCorrespondenceSame = draftData['isCorrespondenceSame'] ?? 'Yes';
        _corrAddressController.text = draftData['corrAddress'] ?? '';
      });
    }
  }

  Future<void> _saveDraft() async {
    final draftData = {
      'fullName': _fullNameController.text,
      'aadhaarNumber': _aadhaarNumberController.text,
      'mobile': _mobileController.text,
      'email': _emailController.text,
      'employees': _employeesController.text,
      'businessName': _businessNameController.text,
      'companyPanNumber': _companyPanNumberController.text,
      'businessType': _businessType,
      'otherBusinessType': _otherBusinessTypeController.text,
      'startDate': _startDateController.text,
      'annualTurnover': _annualTurnover,
      'selectedNature': jsonEncode(_selectedNature.toList()),
      'otherNature': _otherNatureController.text,
      'premisesType': _premisesType,
      'premisesAddress': _premisesAddressController.text,
      'isCorrespondenceSame': _isCorrespondenceSame,
      'corrAddress': _corrAddressController.text,
    };
    await ref.read(draftServiceProvider).saveDraft(widget.order.id, 'FssaiFormScreen', draftData);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Draft saved successfully!')),
      );
    }
  }

  Future<void> _pickDocument(String type) async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
        allowMultiple: false,
      );

      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        if (file.size > 2 * 1024 * 1024) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('File must be 2 MB or smaller (Max 2 MB).')),
            );
          }
          return;
        }

        setState(() {
          if (type == 'aadhaar') _aadhaarPath = file.path;
          else if (type == 'pan') _panPath = file.path;
          else if (type == 'photo') _photoPath = file.path;
          else if (type == 'addressProof') _addressProofPath = file.path;
          else if (type == 'unitEntrancePhoto') _unitEntrancePhotoPath = file.path;
        });
      }
    } catch (e) {
      debugPrint('Error picking document: $e');
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    
    if (_selectedNature.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select at least one Nature of Food Business.')));
      return;
    }
    if (_selectedNature.contains('Other') && _otherNatureController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please specify Other Nature of Food Business.')));
      return;
    }

    if (_aadhaarPath == null || _panPath == null || _photoPath == null || _addressProofPath == null || _unitEntrancePhotoPath == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please upload all required documents (Max 2 MB each).')));
      return;
    }

    if (!_isDeclared) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please accept the declaration.')));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('${kBaseUrl}/api/orders/${widget.order.id}/submit-fssai-form'),
      );
      request.headers['x-user-id'] = uid;

      final finalNature = _selectedNature.map((e) => e == 'Other' ? 'Other: ${_otherNatureController.text.trim()}' : e).toList();

      final formData = {
        'fullName': _fullNameController.text.trim(),
        'aadhaarNumber': _aadhaarNumberController.text.trim(),
        'mobile': _mobileController.text.trim(),
        'email': _emailController.text.trim(),
        'employees': _employeesController.text.trim(),
        'businessName': _businessNameController.text.trim(),
        'companyPanNumber': _companyPanNumberController.text.trim(),
        'businessType': _businessType == 'Other' ? 'Other: ${_otherBusinessTypeController.text.trim()}' : _businessType,
        'startDate': _startDateController.text.trim(),
        'annualTurnover': _annualTurnover,
        'natureOfFoodBusiness': jsonEncode(finalNature),
        'premisesType': _premisesType,
        'premisesAddress': _premisesAddressController.text.trim(),
        'isCorrespondenceSame': _isCorrespondenceSame,
      };

      if (_isCorrespondenceSame == 'No') {
        formData['corrAddress'] = _corrAddressController.text.trim();
      }

      request.fields['data'] = jsonEncode(formData);

      if (_aadhaarPath != null) request.files.add(await http.MultipartFile.fromPath('aadhaarCard', _aadhaarPath!));
      if (_panPath != null) request.files.add(await http.MultipartFile.fromPath('panCard', _panPath!));
      if (_photoPath != null) request.files.add(await http.MultipartFile.fromPath('passportPhoto', _photoPath!));
      if (_addressProofPath != null) request.files.add(await http.MultipartFile.fromPath('businessAddressProof', _addressProofPath!));
      if (_unitEntrancePhotoPath != null) request.files.add(await http.MultipartFile.fromPath('unitEntrancePhoto', _unitEntrancePhotoPath!));

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        await ref.read(draftServiceProvider).clearDraft(widget.order.id, 'FssaiFormScreen');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('FSSAI Application submitted successfully!')));
          Navigator.pop(context, true);
        }
      } else {
        throw Exception(jsonDecode(response.body)['message'] ?? 'Failed to submit form');
      }
    } catch (e) {
      if (mounted) {
        showGlobalError(e.toString());
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Text(title, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.deepTeal)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('FSSAI Application', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        actions: [
          TextButton.icon(
            onPressed: _saveDraft,
            icon: const Icon(Icons.save_outlined, color: Colors.white),
            label: Text('Save Draft', style: GoogleFonts.inter(color: Colors.white)),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _buildSectionHeader('1. Food Business Details'),
                  Text('Nature of Food Business (Select all applicable) *', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  ..._natureOptions.map((option) => CheckboxListTile(
                    title: Text(option, style: GoogleFonts.inter(fontSize: 14)),
                    value: _selectedNature.contains(option),
                    onChanged: (val) {
                      setState(() {
                        if (val == true) _selectedNature.add(option);
                        else _selectedNature.remove(option);
                      });
                    },
                    controlAffinity: ListTileControlAffinity.leading,
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                  )),
                  if (_selectedNature.contains('Other'))
                    Padding(
                      padding: const EdgeInsets.only(top: 8.0, left: 32.0),
                      child: TextFormField(
                        controller: _otherNatureController,
                        decoration: const InputDecoration(labelText: 'Other Nature of Food Business *', border: OutlineInputBorder()),
                        validator: (val) => val!.trim().isEmpty ? 'Required' : null,
                      ),
                    ),

                  _buildSectionHeader('2. Business Details'),
                  DropdownButtonFormField<String>(
                    decoration: const InputDecoration(labelText: 'Expected Annual Turnover *', border: OutlineInputBorder()),
                    value: _annualTurnover,
                    items: ['Below ₹12 Lakhs', '₹12 Lakhs to ₹20 Crores', 'Above ₹20 Crores']
                        .map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                    onChanged: (val) => setState(() => _annualTurnover = val!),
                  ),
                  const SizedBox(height: 16),
                  Text('Type of Business *', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                  ...['Proprietorship', 'Partnership', 'LLP', 'Private Limited Company', 'One Person Company', 'Other']
                      .map((e) => RadioListTile<String>(
                            title: Text(e, style: GoogleFonts.inter(fontSize: 14)),
                            value: e,
                            groupValue: _businessType,
                            onChanged: (val) => setState(() => _businessType = val!),
                            contentPadding: EdgeInsets.zero,
                            dense: true,
                          )),
                  if (_businessType == 'Other')
                    Padding(
                      padding: const EdgeInsets.only(top: 8.0, left: 32.0),
                      child: TextFormField(
                        controller: _otherBusinessTypeController,
                        decoration: const InputDecoration(labelText: 'Other Type of Business *', border: OutlineInputBorder()),
                        validator: (val) => val!.trim().isEmpty ? 'Required' : null,
                      ),
                    ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _businessNameController,
                    decoration: const InputDecoration(labelText: 'Name of Business *', border: OutlineInputBorder()),
                    validator: (val) => val!.trim().isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _companyPanNumberController,
                    decoration: const InputDecoration(labelText: 'Company PAN Number *', border: OutlineInputBorder()),
                    textCapitalization: TextCapitalization.characters,
                    validator: (val) => val!.trim().isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _startDateController,
                    decoration: const InputDecoration(labelText: 'When did your business start? *', border: OutlineInputBorder(), suffixIcon: Icon(Icons.calendar_today)),
                    readOnly: true,
                    onTap: () async {
                      final date = await showDatePicker(context: context, initialDate: DateTime.now(), firstDate: DateTime(1900), lastDate: DateTime.now());
                      if (date != null) setState(() => _startDateController.text = "${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}");
                    },
                    validator: (val) => val!.trim().isEmpty ? 'Required' : null,
                  ),

                  _buildSectionHeader('3. Applicant Details'),
                  TextFormField(
                    controller: _fullNameController,
                    decoration: const InputDecoration(labelText: 'Enter your full name *', border: OutlineInputBorder()),
                    validator: (val) => val!.trim().isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _aadhaarNumberController,
                    decoration: const InputDecoration(labelText: 'Aadhaar Number *', border: OutlineInputBorder()),
                    keyboardType: TextInputType.number,
                    maxLength: 12,
                    validator: (val) => val!.trim().length != 12 ? 'Enter valid 12 digit Aadhaar' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _mobileController,
                    decoration: const InputDecoration(labelText: 'Mobile Number (WhatsApp) *', border: OutlineInputBorder()),
                    keyboardType: TextInputType.phone,
                    maxLength: 10,
                    validator: (val) => val!.trim().length != 10 ? 'Enter valid 10 digit number' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _emailController,
                    decoration: const InputDecoration(labelText: 'Email ID *', border: OutlineInputBorder()),
                    keyboardType: TextInputType.emailAddress,
                    validator: (val) => !val!.contains('@') ? 'Enter valid email' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _employeesController,
                    decoration: const InputDecoration(labelText: 'No. of Employees *', border: OutlineInputBorder()),
                    keyboardType: TextInputType.number,
                    validator: (val) => val!.trim().isEmpty ? 'Required' : null,
                  ),

                  _buildSectionHeader('4. Premises Details'),
                  TextFormField(
                    controller: _premisesAddressController,
                    decoration: const InputDecoration(labelText: 'Address of Premises *', helperText: 'Door/Plot no, block, street, area, district, state, country - pincode', border: OutlineInputBorder()),
                    maxLines: 3,
                    validator: (val) => val!.trim().isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  Text('Premises Type *', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                  ...['Own', 'Rent'].map((e) => RadioListTile<String>(
                        title: Text(e, style: GoogleFonts.inter(fontSize: 14)),
                        value: e,
                        groupValue: _premisesType,
                        onChanged: (val) => setState(() => _premisesType = val!),
                        contentPadding: EdgeInsets.zero,
                        dense: true,
                      )),

                  _buildSectionHeader('5. Address Details'),
                  Text('Is your correspondence Address same as "Address of Premises"? *', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                  ...['Yes', 'No'].map((e) => RadioListTile<String>(
                        title: Text(e, style: GoogleFonts.inter(fontSize: 14)),
                        value: e,
                        groupValue: _isCorrespondenceSame,
                        onChanged: (val) => setState(() => _isCorrespondenceSame = val!),
                        contentPadding: EdgeInsets.zero,
                        dense: true,
                      )),
                  if (_isCorrespondenceSame == 'No')
                    Padding(
                      padding: const EdgeInsets.only(top: 8.0),
                      child: TextFormField(
                        controller: _corrAddressController,
                        decoration: const InputDecoration(labelText: 'Correspondence Address *', border: OutlineInputBorder()),
                        maxLines: 3,
                        validator: (val) => val!.trim().isEmpty ? 'Required' : null,
                      ),
                    ),

                  _buildSectionHeader('6. Applicant Documents'),
                  _buildFilePicker('Upload Passport Size Photo * (Max 2 MB)', _photoPath, () => _pickDocument('photo')),
                  _buildFilePicker('Upload Aadhaar Card * (Max 2 MB)', _aadhaarPath, () => _pickDocument('aadhaar')),

                  _buildSectionHeader('7. Business Documents'),
                  _buildFilePicker('Photographs of the Unit (Entrance) * (Max 2 MB)', _unitEntrancePhotoPath, () => _pickDocument('unitEntrancePhoto')),
                  _buildFilePicker('Upload PAN Card * (Max 2 MB)', _panPath, () => _pickDocument('pan')),
                  _buildFilePicker('Upload Business Address Proof * (Max 2 MB)\n(Rental Agreement / Electricity Bill / NOC / Utility Bill)', _addressProofPath, () => _pickDocument('addressProof')),

                  _buildSectionHeader('8. Declaration'),
                  CheckboxListTile(
                    title: const Text('I Agree'),
                    subtitle: const Text('I hereby declare that all information provided is true and correct to the best of my knowledge.'),
                    value: _isDeclared,
                    onChanged: (val) => setState(() => _isDeclared = val ?? false),
                    controlAffinity: ListTileControlAffinity.leading,
                    contentPadding: EdgeInsets.zero,
                  ),

                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _submitForm,
                      style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                      child: const Text('Submit Application', style: TextStyle(fontSize: 16)),
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }

  Widget _buildFilePicker(String label, String? filePath, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 13)),
          const SizedBox(height: 8),
          InkWell(
            onTap: onTap,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(8)),
              child: Row(
                children: [
                  Icon(filePath != null ? Icons.check_circle : Icons.upload_file, color: filePath != null ? Colors.green : Colors.grey),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      filePath != null ? filePath.split('/').last : 'Tap to upload document',
                      style: GoogleFonts.inter(color: filePath != null ? Colors.black87 : Colors.grey, fontSize: 13),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
