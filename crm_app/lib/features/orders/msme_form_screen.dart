import 'package:crm_app/core/theme/app_theme.dart';
import 'package:crm_app/providers/auth_provider.dart';
import 'package:crm_app/core/constants/port.dart';
import 'package:crm_app/core/utils/error_handler.dart';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../../providers/draft_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;

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

  // 1. Applicant
  final _aadhaarController = TextEditingController();
  final _entrepreneurNameController = TextEditingController();
  final _mobileController = TextEditingController();
  final _emailController = TextEditingController();

  // 2. Organization
  String _orgType = 'Proprietorship';
  final _enterpriseNameController = TextEditingController();
  final _incorpDateController = TextEditingController();

  // 3. PAN & GST
  final _panController = TextEditingController();
  final _panNameController = TextEditingController();
  final _panDobController = TextEditingController();
  String _hasGstin = 'No';
  final _gstinController = TextEditingController();

  // 4. Business
  final _investmentController = TextEditingController();
  final _turnoverController = TextEditingController();
  final _officeNameController = TextEditingController();
  String _majorActivity = 'Manufacturing';
  final _officeAddressController = TextEditingController();

  // 5. Category
  String _socialCategory = 'General';
  String _gender = 'Male';
  String _isDivyang = 'No';

  // 6. Bank
  final _bankNameController = TextEditingController();
  final _ifsCodeController = TextEditingController();
  final _bankAccountController = TextEditingController();

  // 7. Employees
  final _maleEmpController = TextEditingController(text: '0');
  final _femaleEmpController = TextEditingController(text: '0');

  // 8. TReDS
  String _tredsInterested = 'No';

  int get _totalEmployees {
    int male = int.tryParse(_maleEmpController.text) ?? 0;
    int female = int.tryParse(_femaleEmpController.text) ?? 0;
    return male + female;
  }

  @override
  void initState() {
    super.initState();
    _maleEmpController.addListener(() => setState(() {}));
    _femaleEmpController.addListener(() => setState(() {}));
    _loadDraft();
  }

  @override
  void dispose() {
    _aadhaarController.dispose(); _entrepreneurNameController.dispose(); _mobileController.dispose(); _emailController.dispose();
    _enterpriseNameController.dispose(); _incorpDateController.dispose(); _panController.dispose(); _panNameController.dispose();
    _panDobController.dispose(); _gstinController.dispose(); _investmentController.dispose(); _turnoverController.dispose();
    _officeNameController.dispose(); _officeAddressController.dispose(); _bankNameController.dispose(); _ifsCodeController.dispose();
    _bankAccountController.dispose(); _maleEmpController.dispose(); _femaleEmpController.dispose();
    super.dispose();
  }

  Future<void> _loadDraft() async {
    final draftData = await ref.read(draftServiceProvider).loadDraft(widget.order.id, 'MsmeFormScreen');
    if (draftData != null && mounted) {
      setState(() {
        _aadhaarController.text = draftData['aadhaarNumber'] ?? '';
        _entrepreneurNameController.text = draftData['entrepreneurName'] ?? '';
        _mobileController.text = draftData['mobileNumber'] ?? '';
        _emailController.text = draftData['email'] ?? '';
        _orgType = draftData['orgType'] ?? 'Proprietorship';
        _enterpriseNameController.text = draftData['enterpriseName'] ?? '';
        _incorpDateController.text = draftData['incorporationDate'] ?? '';
        _panController.text = draftData['pan'] ?? '';
        _panNameController.text = draftData['panName'] ?? '';
        _panDobController.text = draftData['panDob'] ?? '';
        _hasGstin = draftData['hasGstin'] ?? 'No';
        _gstinController.text = draftData['gstinNumber'] ?? '';
        _investmentController.text = draftData['investment'] ?? '';
        _turnoverController.text = draftData['turnover'] ?? '';
        _officeNameController.text = draftData['officeName'] ?? '';
        _majorActivity = draftData['majorActivity'] ?? 'Manufacturing';
        _officeAddressController.text = draftData['officeAddress'] ?? '';
        _socialCategory = draftData['socialCategory'] ?? 'General';
        _gender = draftData['gender'] ?? 'Male';
        _isDivyang = draftData['isDivyang'] ?? 'No';
        _bankNameController.text = draftData['bankName'] ?? '';
        _ifsCodeController.text = draftData['ifsCode'] ?? '';
        _bankAccountController.text = draftData['bankAccount'] ?? '';
        _maleEmpController.text = draftData['maleEmployees']?.toString() ?? '0';
        _femaleEmpController.text = draftData['femaleEmployees']?.toString() ?? '0';
        _tredsInterested = draftData['tredsInterested'] ?? 'No';
      });
    }
  }

  Future<void> _saveDraft() async {
    final draftData = {
      'aadhaarNumber': _aadhaarController.text, 'entrepreneurName': _entrepreneurNameController.text, 'mobileNumber': _mobileController.text, 'email': _emailController.text,
      'orgType': _orgType, 'enterpriseName': _enterpriseNameController.text, 'incorporationDate': _incorpDateController.text,
      'pan': _panController.text, 'panName': _panNameController.text, 'panDob': _panDobController.text, 'hasGstin': _hasGstin, 'gstinNumber': _gstinController.text,
      'investment': _investmentController.text, 'turnover': _turnoverController.text, 'officeName': _officeNameController.text, 'majorActivity': _majorActivity, 'officeAddress': _officeAddressController.text,
      'socialCategory': _socialCategory, 'gender': _gender, 'isDivyang': _isDivyang,
      'bankName': _bankNameController.text, 'ifsCode': _ifsCodeController.text, 'bankAccount': _bankAccountController.text,
      'maleEmployees': int.tryParse(_maleEmpController.text) ?? 0, 'femaleEmployees': int.tryParse(_femaleEmpController.text) ?? 0,
      'tredsInterested': _tredsInterested
    };
    await ref.read(draftServiceProvider).saveDraft(widget.order.id, 'MsmeFormScreen', draftData);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Draft saved successfully!')));
    }
  }

  Future<void> _selectDate(TextEditingController controller) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().subtract(const Duration(days: 365)),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() {
        controller.text = "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
      });
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    
    if (_hasGstin == 'Yes' && _gstinController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please provide your GSTIN number.')));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('${kBaseUrl}/api/orders/${widget.order.id}/submit-msme-form'),
      );
      request.headers['x-user-id'] = uid;

      final formData = {
        'aadhaarNumber': _aadhaarController.text, 'entrepreneurName': _entrepreneurNameController.text, 'mobileNumber': _mobileController.text, 'email': _emailController.text,
        'orgType': _orgType, 'enterpriseName': _enterpriseNameController.text, 'incorporationDate': _incorpDateController.text,
        'pan': _panController.text, 'panName': _panNameController.text, 'panDob': _panDobController.text, 'hasGstin': _hasGstin, 'gstinNumber': _hasGstin == 'Yes' ? _gstinController.text : '',
        'investment': _investmentController.text, 'turnover': _turnoverController.text, 'officeName': _officeNameController.text, 'majorActivity': _majorActivity, 'officeAddress': _officeAddressController.text,
        'socialCategory': _socialCategory, 'gender': _gender, 'isDivyang': _isDivyang,
        'bankName': _bankNameController.text, 'ifsCode': _ifsCodeController.text, 'bankAccount': _bankAccountController.text,
        'maleEmployees': int.tryParse(_maleEmpController.text) ?? 0, 'femaleEmployees': int.tryParse(_femaleEmpController.text) ?? 0, 'totalEmployees': _totalEmployees,
        'tredsInterested': _tredsInterested
      };

      request.fields['data'] = jsonEncode(formData);

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        await ref.read(draftServiceProvider).clearDraft(widget.order.id, 'MsmeFormScreen');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('MSME Application submitted successfully!')));
          Navigator.pop(context, true);
        }
      } else {
        throw Exception(jsonDecode(response.body)['message'] ?? 'Failed to submit form');
      }
    } catch (e) {
      if (mounted) showGlobalError(e.toString());
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
        title: Text('MSME / Udyam Registration', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
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
                  _buildSectionHeader('1. Applicant / Entrepreneur Details'),
                  TextFormField(controller: _aadhaarController, decoration: const InputDecoration(labelText: 'Aadhar Number *', border: OutlineInputBorder()), keyboardType: TextInputType.number, maxLength: 12, validator: (val) => val!.length != 12 ? 'Enter 12 digits' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _entrepreneurNameController, decoration: const InputDecoration(labelText: 'Name of Entrepreneur *', border: OutlineInputBorder()), validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _mobileController, decoration: const InputDecoration(labelText: 'Mobile Number *', border: OutlineInputBorder()), keyboardType: TextInputType.phone, maxLength: 10, validator: (val) => val!.length != 10 ? 'Enter 10 digits' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _emailController, decoration: const InputDecoration(labelText: 'Email *', border: OutlineInputBorder()), keyboardType: TextInputType.emailAddress, validator: (val) => !val!.contains('@') ? 'Valid email required' : null),

                  _buildSectionHeader('2. Organization Details'),
                  Text('Type of Organization *', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                  ...['Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'OPC', 'Trust', 'Society'].map((type) => 
                    RadioListTile(title: Text(type), value: type, groupValue: _orgType, onChanged: (v) => setState(() => _orgType = v.toString()))),
                  TextFormField(controller: _enterpriseNameController, decoration: const InputDecoration(labelText: 'Name of Enterprise *', border: OutlineInputBorder()), validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _incorpDateController,
                    decoration: const InputDecoration(labelText: 'Date of Incorporation *', border: OutlineInputBorder(), suffixIcon: Icon(Icons.calendar_today)),
                    readOnly: true,
                    onTap: () => _selectDate(_incorpDateController),
                    validator: (val) => val!.trim().isEmpty ? 'Required' : null,
                  ),

                  _buildSectionHeader('3. PAN & GST Details'),
                  TextFormField(controller: _panController, decoration: const InputDecoration(labelText: 'PAN *', border: OutlineInputBorder()), textCapitalization: TextCapitalization.characters, validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _panNameController, decoration: const InputDecoration(labelText: 'Name of PAN Holder *', border: OutlineInputBorder()), validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _panDobController,
                    decoration: const InputDecoration(labelText: 'DOB OR DOI as per PAN *', border: OutlineInputBorder(), suffixIcon: Icon(Icons.calendar_today)),
                    readOnly: true,
                    onTap: () => _selectDate(_panDobController),
                    validator: (val) => val!.trim().isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  Text('Do you have GSTIN *', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                  ...['Yes', 'No', 'Exempted'].map((type) => 
                    RadioListTile(title: Text(type), value: type, groupValue: _hasGstin, onChanged: (v) => setState(() => _hasGstin = v.toString()))),
                  if (_hasGstin == 'Yes')
                    TextFormField(controller: _gstinController, decoration: const InputDecoration(labelText: 'GST Number *', border: OutlineInputBorder()), textCapitalization: TextCapitalization.characters, validator: (val) => val!.trim().isEmpty ? 'Required' : null),

                  _buildSectionHeader('4. Business Details'),
                  TextFormField(controller: _investmentController, decoration: const InputDecoration(labelText: 'Total Investment Made in Business *', border: OutlineInputBorder()), keyboardType: TextInputType.number, validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _turnoverController, decoration: const InputDecoration(labelText: 'Turnover in Last FY 25-26 *', border: OutlineInputBorder()), keyboardType: TextInputType.number, validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _officeNameController, decoration: const InputDecoration(labelText: 'Office Name *', border: OutlineInputBorder()), validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  Text('Major Activity of Unit *', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                  ...['Manufacturing', 'Services', 'Trading'].map((type) => 
                    RadioListTile(title: Text(type), value: type, groupValue: _majorActivity, onChanged: (v) => setState(() => _majorActivity = v.toString()))),
                  TextFormField(controller: _officeAddressController, decoration: const InputDecoration(labelText: 'Office Address *', border: OutlineInputBorder()), maxLines: 3, validator: (val) => val!.trim().isEmpty ? 'Required' : null),

                  _buildSectionHeader('5. Social & Category Details'),
                  Text('Social Category *', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                  ...['General', 'SC', 'ST', 'OBC'].map((type) => 
                    RadioListTile(title: Text(type), value: type, groupValue: _socialCategory, onChanged: (v) => setState(() => _socialCategory = v.toString()))),
                  Text('Gender *', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                  ...['Male', 'Female', 'Others'].map((type) => 
                    RadioListTile(title: Text(type), value: type, groupValue: _gender, onChanged: (v) => setState(() => _gender = v.toString()))),
                  Text('Specially Abled (DIVYANG) *', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                  ...['Yes', 'No'].map((type) => 
                    RadioListTile(title: Text(type), value: type, groupValue: _isDivyang, onChanged: (v) => setState(() => _isDivyang = v.toString()))),

                  _buildSectionHeader('6. Bank Details'),
                  TextFormField(controller: _bankNameController, decoration: const InputDecoration(labelText: 'Bank Name *', border: OutlineInputBorder()), validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _ifsCodeController, decoration: const InputDecoration(labelText: 'IFS Code *', border: OutlineInputBorder()), textCapitalization: TextCapitalization.characters, validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _bankAccountController, decoration: const InputDecoration(labelText: 'Bank Account Number *', border: OutlineInputBorder()), keyboardType: TextInputType.number, validator: (val) => val!.trim().isEmpty ? 'Required' : null),

                  _buildSectionHeader('7. Employee Details'),
                  TextFormField(controller: _maleEmpController, decoration: const InputDecoration(labelText: 'No. of Persons Employed (Male) *', border: OutlineInputBorder()), keyboardType: TextInputType.number, validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _femaleEmpController, decoration: const InputDecoration(labelText: 'No. of Persons Employed (Female) *', border: OutlineInputBorder()), keyboardType: TextInputType.number, validator: (val) => val!.trim().isEmpty ? 'Required' : null),
                  const SizedBox(height: 16),
                  TextFormField(
                    decoration: const InputDecoration(labelText: 'Total Employees', border: OutlineInputBorder()),
                    controller: TextEditingController(text: _totalEmployees.toString()),
                    enabled: false,
                  ),

                  _buildSectionHeader('8. TReDS Registration'),
                  Text('Are you interested in getting registered on TReDS Portals? *', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                  ...['Yes', 'No'].map((type) => 
                    RadioListTile(title: Text(type), value: type, groupValue: _tredsInterested, onChanged: (v) => setState(() => _tredsInterested = v.toString()))),

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
}
