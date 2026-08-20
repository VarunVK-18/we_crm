import 'package:crm_app/core/theme/app_theme.dart';
import 'package:crm_app/providers/auth_provider.dart';
import 'package:crm_app/core/constants/port.dart';
import 'package:crm_app/core/utils/error_handler.dart';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../../../providers/draft_provider.dart';
import '../../../providers/entity_profile_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;
import '../../../models/order_model.dart';

class MsmeFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const MsmeFormScreen({super.key, required this.order});

  @override
  ConsumerState<MsmeFormScreen> createState() => _MsmeFormScreenState();
}

class _MsmeFormScreenState extends ConsumerState<MsmeFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  final _aadhaarController = TextEditingController();
  final _entrepreneurNameController = TextEditingController();
  final _mobileController = TextEditingController();
  final _emailController = TextEditingController();
  String _orgType = 'Proprietorship';
  final _enterpriseNameController = TextEditingController();
  final _incorpDateController = TextEditingController();
  final _panController = TextEditingController();
  final _panNameController = TextEditingController();
  final _panDobController = TextEditingController();
  String _hasGstin = 'No';
  final _gstinController = TextEditingController();
  final _investmentController = TextEditingController();
  final _turnoverController = TextEditingController();
  final _officeNameController = TextEditingController();
  String _majorActivity = 'Manufacturing';
  final _officeAddressController = TextEditingController();
  String _socialCategory = 'General';
  String _gender = 'Male';
  String _isDivyang = 'No';
  final _bankNameController = TextEditingController();
  final _ifsCodeController = TextEditingController();
  final _bankAccountController = TextEditingController();
  final _maleEmpController = TextEditingController(text: '0');
  final _femaleEmpController = TextEditingController(text: '0');
  String _tredsInterested = 'No';

  int get _totalEmployees {
    int male = int.tryParse(_maleEmpController.text) ?? 0;
    int female = int.tryParse(_femaleEmpController.text) ?? 0;
    return male + female;
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) { _autoFillFromProfile(); });
    _maleEmpController.addListener(() => setState(() {}));
    _femaleEmpController.addListener(() => setState(() {}));
    _loadDraft();
    _loadEntityPrefill();
  }

  Future<void> _loadEntityPrefill() async {
    final uid = ref.read(authStateProvider).value?.uid;
    if (uid == null) return;
    final profile = await ref.read(entityCacheServiceProvider).fetchProfile(uid);
    if (!mounted) return;
    setState(() {
      if (_entrepreneurNameController.text.isEmpty && profile.directorName.isNotEmpty)
        _entrepreneurNameController.text = profile.directorName;
      if (_mobileController.text.isEmpty && profile.phone.isNotEmpty)
        _mobileController.text = profile.phone;
      if (_emailController.text.isEmpty && profile.email.isNotEmpty)
        _emailController.text = profile.email;
      if (_enterpriseNameController.text.isEmpty && profile.entityName.isNotEmpty)
        _enterpriseNameController.text = profile.entityName;
      if (_panController.text.isEmpty && profile.pan.isNotEmpty)
        _panController.text = profile.pan;
      if (_gstinController.text.isEmpty && profile.gstin.isNotEmpty)
        _gstinController.text = profile.gstin;
      if (_officeAddressController.text.isEmpty && profile.address.isNotEmpty)
        _officeAddressController.text = profile.address;
      if (_bankNameController.text.isEmpty && profile.bankName.isNotEmpty)
        _bankNameController.text = profile.bankName;
      if (_ifsCodeController.text.isEmpty && profile.bankIfsc.isNotEmpty)
        _ifsCodeController.text = profile.bankIfsc;
      if (_bankAccountController.text.isEmpty && profile.bankAccount.isNotEmpty)
        _bankAccountController.text = profile.bankAccount;
    });
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
    await ref.read(draftServiceProvider).saveDraft(widget.order.id, 'MsmeFormScreen', {
      'aadhaarNumber': _aadhaarController.text, 'entrepreneurName': _entrepreneurNameController.text,
      'mobileNumber': _mobileController.text, 'email': _emailController.text,
      'orgType': _orgType, 'enterpriseName': _enterpriseNameController.text, 'incorporationDate': _incorpDateController.text,
      'pan': _panController.text, 'panName': _panNameController.text, 'panDob': _panDobController.text,
      'hasGstin': _hasGstin, 'gstinNumber': _gstinController.text,
      'investment': _investmentController.text, 'turnover': _turnoverController.text,
      'officeName': _officeNameController.text, 'majorActivity': _majorActivity, 'officeAddress': _officeAddressController.text,
      'socialCategory': _socialCategory, 'gender': _gender, 'isDivyang': _isDivyang,
      'bankName': _bankNameController.text, 'ifsCode': _ifsCodeController.text, 'bankAccount': _bankAccountController.text,
      'maleEmployees': _maleEmpController.text, 'femaleEmployees': _femaleEmpController.text,
      'tredsInterested': _tredsInterested,
    });
  }

  Future<void> _selectDate(TextEditingController controller) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().subtract(const Duration(days: 365)),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() {
        controller.text = "${picked.day.toString().padLeft(2, '0')}/${picked.month.toString().padLeft(2, '0')}/${picked.year}";
      });
      _saveDraft();
    }
  }

  Future<bool> _onWillPop() async {
    final shouldPop = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Save as Draft?'),
                  content: const Text('Do you want to save your progress before exiting?'),
          actions: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                TextButton(
                  style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(60, 36)),
                  onPressed: () => Navigator.of(context).pop(true),
                  child: Text('Discard', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.red)),
                ),
                TextButton(
                  style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(60, 36)),
                  onPressed: () => Navigator.of(context).pop(false),
                  child: Text('Cancel', style: Theme.of(context).textTheme.bodyMedium),
                ),
                TextButton(
                  style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(80, 36)),
                  onPressed: () async {
                    await _saveDraft();
                    if (context.mounted) Navigator.of(context).pop(true);
                  },
                  child: Text('Save Draft', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.corporateBlue, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ],
        ),
    );
    return shouldPop ?? false;
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
      var request = http.MultipartRequest('POST', Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-msme-form'));
      request.headers['x-user-id'] = uid;
      request.fields['data'] = jsonEncode({
        'aadhaarNumber': _aadhaarController.text, 'entrepreneurName': _entrepreneurNameController.text,
        'mobileNumber': _mobileController.text, 'email': _emailController.text,
        'orgType': _orgType, 'enterpriseName': _enterpriseNameController.text, 'incorporationDate': _incorpDateController.text,
        'pan': _panController.text, 'panName': _panNameController.text, 'panDob': _panDobController.text,
        'hasGstin': _hasGstin, 'gstinNumber': _hasGstin == 'Yes' ? _gstinController.text : '',
        'investment': _investmentController.text, 'turnover': _turnoverController.text,
        'officeName': _officeNameController.text, 'majorActivity': _majorActivity, 'officeAddress': _officeAddressController.text,
        'socialCategory': _socialCategory, 'gender': _gender, 'isDivyang': _isDivyang,
        'bankName': _bankNameController.text, 'ifsCode': _ifsCodeController.text, 'bankAccount': _bankAccountController.text,
        'maleEmployees': int.tryParse(_maleEmpController.text) ?? 0,
        'femaleEmployees': int.tryParse(_femaleEmpController.text) ?? 0,
        'totalEmployees': _totalEmployees, 'tredsInterested': _tredsInterested,
      });
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      if (response.statusCode == 200 || response.statusCode == 201) {
        await ref.read(draftServiceProvider).clearDraft(widget.order.id, 'MsmeFormScreen');
        ref.read(entityCacheServiceProvider).saveTextFields(uid, {
          'entityName': _enterpriseNameController.text,
          'pan': _panController.text,
          'email': _emailController.text,
          'phone': _mobileController.text,
          'address': _officeAddressController.text,
          'gstin': _gstinController.text,
          'directorName': _entrepreneurNameController.text,
          'bankName': _bankNameController.text,
          'bankIfsc': _ifsCodeController.text,
          'bankAccount': _bankAccountController.text,
        });
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

  Widget _buildField(String label, TextEditingController controller, {
    bool isRequired = false,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    bool isDate = false,
    String? Function(String?)? validator,
    int? maxLength,
    TextCapitalization textCapitalization = TextCapitalization.none,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: label,
              style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 12, color: AppTheme.deepTeal),
              children: [if (isRequired) const TextSpan(text: ' *', style: TextStyle(color: Colors.red))],
            ),
          ),
          const SizedBox(height: 6),
          TextFormField(
            controller: controller,
            keyboardType: keyboardType,
            maxLines: maxLines,
            maxLength: maxLength,
            readOnly: isDate,
            textCapitalization: textCapitalization,
            onChanged: (_) => _saveDraft(),
            onTap: isDate ? () => _selectDate(controller) : null,
            style: GoogleFonts.inter(fontSize: 13, color: AppTheme.deepTeal),
            decoration: InputDecoration(
              hintText: 'Enter ${label.replaceAll('*', '').trim()}',
              hintStyle: const TextStyle(fontSize: 13, color: Colors.grey),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.black, width: 1.5)),
              filled: true,
              fillColor: AppTheme.surfaceLight,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              suffixIcon: isDate ? const Icon(Icons.calendar_today, size: 18, color: Colors.grey) : null,
              counterText: '',
            ),
            autovalidateMode: AutovalidateMode.onUserInteraction,
            validator: validator ?? (v) {
              if (isRequired && (v == null || v.trim().isEmpty)) return 'This is a required field';
              return null;
            },
          ),
        ],
      ),
    );
  }

  Widget _buildDropdownField(String label, String current, List<String> options, ValueChanged<String?> onChanged, {bool isRequired = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: label,
              style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 12, color: AppTheme.deepTeal),
              children: [if (isRequired) const TextSpan(text: ' *', style: TextStyle(color: Colors.red))],
            ),
          ),
          const SizedBox(height: 6),
          DropdownButtonFormField<String>(
            value: current,
            decoration: InputDecoration(
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.black, width: 1.5)),
              filled: true,
              fillColor: AppTheme.surfaceLight,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            style: GoogleFonts.inter(fontSize: 13, color: AppTheme.deepTeal, fontWeight: FontWeight.w400),
            icon: const Icon(Icons.keyboard_arrow_down, color: Colors.grey, size: 20),
            items: options.map((o) => DropdownMenuItem<String>(
              value: o,
              child: Text(o, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w400, color: AppTheme.deepTeal)),
            )).toList(),
            onChanged: (val) {
              onChanged(val);
              _saveDraft();
            },
            validator: isRequired ? (v) => v == null || v.isEmpty ? 'This is a required field' : null : null,
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.deepTeal)),
          const SizedBox(height: 6),
          Container(height: 1, color: Colors.grey.shade200),
        ],
      ),
    );
  }


  void _autoFillFromProfile() {
    final user = ref.read(userProfileProvider).value;
    if (user == null) return;
    setState(() {
      if (_entrepreneurNameController.text.isEmpty && user.name.isNotEmpty) _entrepreneurNameController.text = user.name;
      if (_emailController.text.isEmpty && user.email.isNotEmpty) _emailController.text = user.email;
      if (_mobileController.text.isEmpty && user.phone.isNotEmpty) _mobileController.text = user.phone;
    });
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: Text('MSME / Udyam Registration', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.deepTeal)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: AppTheme.deepTeal, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          TextButton.icon(
            onPressed: _saveDraft,
            icon: const Icon(Icons.save_outlined, color: AppTheme.corporateBlue, size: 18),
            label: Text('Save', style: GoogleFonts.inter(color: AppTheme.corporateBlue, fontSize: 13, fontWeight: FontWeight.w500)),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.corporateBlue))
          : Form(
              key: _formKey,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(color: AppTheme.corporateBlue.withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
                      child: Row(
                        children: [
                          const Icon(Icons.info_outline, color: AppTheme.corporateBlue, size: 20),
                          const SizedBox(width: 10),
                          Expanded(child: Text('Udyam registration is free and done through the government portal.', style: GoogleFonts.inter(fontSize: 12, color: AppTheme.corporateBlue))),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    _buildSectionHeader('1. Applicant / Entrepreneur Details'),
                    _buildField('Aadhaar Number', _aadhaarController, isRequired: true, keyboardType: TextInputType.number, maxLength: 12,
                      validator: (val) => val == null || val.length != 12 ? 'Enter valid 12-digit Aadhaar' : null),
                    _buildField('Name of Entrepreneur', _entrepreneurNameController, isRequired: true),
                    _buildField('Mobile Number', _mobileController, isRequired: true, keyboardType: TextInputType.phone, maxLength: 10,
                      validator: (val) => val == null || val.length != 10 ? 'Enter valid 10-digit number' : null),
                    _buildField('Email', _emailController, isRequired: true, keyboardType: TextInputType.emailAddress,
                      validator: (val) => val == null || !val.contains('@') ? 'Enter a valid email' : null),

                    _buildSectionHeader('2. Organization Details'),
                    _buildDropdownField('Type of Organization', _orgType,
                      ['Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'OPC', 'Trust', 'Society'],
                      (v) => setState(() => _orgType = v!), isRequired: true),
                    _buildField('Name of Enterprise', _enterpriseNameController, isRequired: true),
                    _buildField('Date of Incorporation', _incorpDateController, isRequired: true, isDate: true),

                    _buildSectionHeader('3. PAN & GST Details'),
                    _buildField('PAN', _panController, isRequired: true, textCapitalization: TextCapitalization.characters,
                      validator: (val) {
                        if (val == null || val.trim().isEmpty) return 'PAN is required';
                        if (!RegExp(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', caseSensitive: false).hasMatch(val.trim())) return 'Enter a valid PAN';
                        return null;
                      }),
                    _buildField('Name of PAN Holder', _panNameController, isRequired: true),
                    _buildField('Date of Birth / Incorporation as per PAN', _panDobController, isRequired: true, isDate: true),
                    _buildDropdownField('Do you have GSTIN?', _hasGstin, ['Yes', 'No', 'Exempted'],
                      (v) => setState(() => _hasGstin = v!), isRequired: true),
                    if (_hasGstin == 'Yes')
                      _buildField('GST Number', _gstinController, isRequired: true, textCapitalization: TextCapitalization.characters),

                    _buildSectionHeader('4. Business Details'),
                    _buildField('Total Investment Made in Business (₹)', _investmentController, isRequired: true, keyboardType: TextInputType.number),
                    _buildField('Turnover in Last FY 25-26 (₹)', _turnoverController, isRequired: true, keyboardType: TextInputType.number),
                    _buildField('Office Name', _officeNameController, isRequired: true),
                    _buildDropdownField('Major Activity of Unit', _majorActivity, ['Manufacturing', 'Services', 'Trading'],
                      (v) => setState(() => _majorActivity = v!), isRequired: true),
                    _buildField('Office Address', _officeAddressController, isRequired: true, maxLines: 3),

                    _buildSectionHeader('5. Social & Category Details'),
                    _buildDropdownField('Social Category', _socialCategory, ['General', 'SC', 'ST', 'OBC'],
                      (v) => setState(() => _socialCategory = v!), isRequired: true),
                    _buildDropdownField('Gender', _gender, ['Male', 'Female', 'Others'],
                      (v) => setState(() => _gender = v!), isRequired: true),
                    _buildDropdownField('Specially Abled (DIVYANG)?', _isDivyang, ['Yes', 'No'],
                      (v) => setState(() => _isDivyang = v!), isRequired: true),

                    _buildSectionHeader('6. Bank Details'),
                    _buildField('Bank Name', _bankNameController, isRequired: true),
                    _buildField('IFS Code', _ifsCodeController, isRequired: true, textCapitalization: TextCapitalization.characters),
                    _buildField('Bank Account Number', _bankAccountController, isRequired: true, keyboardType: TextInputType.number),

                    _buildSectionHeader('7. Employee Details'),
                    _buildField('No. of Male Employees', _maleEmpController, isRequired: true, keyboardType: TextInputType.number),
                    _buildField('No. of Female Employees', _femaleEmpController, isRequired: true, keyboardType: TextInputType.number),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Total Employees', style: TextStyle(fontWeight: FontWeight.w500, fontSize: 12, color: AppTheme.deepTeal)),
                          const SizedBox(height: 6),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.grey.shade300),
                            ),
                            child: Text('$_totalEmployees', style: GoogleFonts.inter(fontSize: 13, color: Colors.grey.shade700)),
                          ),
                        ],
                      ),
                    ),

                    _buildSectionHeader('8. TReDS Registration'),
                    _buildDropdownField('Interested in TReDS Portal Registration?', _tredsInterested, ['Yes', 'No'],
                      (v) => setState(() => _tredsInterested = v!), isRequired: true),

                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _submitForm,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.black,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                        child: Text('Submit Application', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w500)),
                      ),
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
      ),
    );
  }
}
