import 'dart:convert';
import 'package:crm_app/core/utils/error_handler.dart';
import 'package:crm_app/core/utils/hint_helper.dart';
import 'package:crm_app/core/utils/file_picker_util.dart';
import 'package:crm_app/core/utils/form_ui_helper.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;

import '../../core/constants/port.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/validation_utils.dart';
import '../../core/utils/form_ui_helper.dart';
import '../../models/form_schema_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/compliance_provider.dart';

class McaProfileFormScreen extends ConsumerStatefulWidget {
  const McaProfileFormScreen({super.key});

  @override
  ConsumerState<McaProfileFormScreen> createState() => _McaProfileFormScreenState();
}

class _McaProfileFormScreenState extends ConsumerState<McaProfileFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  bool _obscurePassword = true;
  int _complianceScore = 0;

  FormSchema? _schema;
  final Map<String, dynamic> _dynamicFormData = {};
  final Map<String, TextEditingController> _dynamicControllers = {};
  final Map<String, String?> _dynamicFilePaths = {};

  // ── Section 1: Business Information ─────────────────────────────────
  final _companyNameController = TextEditingController();
  final _companyPanController = TextEditingController();
  final _cinController = TextEditingController();
  final _incorporationDateController = TextEditingController();
  String? _businessType;
  final _natureOfBusinessController = TextEditingController();
  String _annualTurnover = 'Less than ₹20 Lakhs';

  // ── Section 2: Contact & Address ─────────────────────────────────────
  final _registeredAddressController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _postalCodeController = TextEditingController();
  final _companyEmailController = TextEditingController();
  final _companyPhoneController = TextEditingController();

  // ── Section 3: Director / Signatory ──────────────────────────────────
  final _directorNameController = TextEditingController();
  final _directorDinController = TextEditingController();
  final _directorPanController = TextEditingController();
  final _directorAadhaarController = TextEditingController();
  final _directorEmailController = TextEditingController();
  final _directorMobileController = TextEditingController();

  // ── Section 4: Registration Details (optional) ───────────────────────
  final _gstinController = TextEditingController();
  final _udyamNumberController = TextEditingController();
  final _trademarkNoController = TextEditingController();
  final _isoCertNoController = TextEditingController();
  final _dpiitRefNoController = TextEditingController();
  final _mcaUsernameController = TextEditingController();
  final _mcaPasswordController = TextEditingController();

  // ── Section 5: Documents ─────────────────────────────────────────────
  String? _coiPath;
  String? _panPath;
  String? _moaPath;
  String? _aoaPath;
  String? _aadhaarPath;
  String? _directorPanPath;
  String? _gstCertPath;
  String? _udyamCertPath;
  String? _trademarkCertPath;
  String? _isoCertPath;
  String? _bankStatementPath;

  final List<String> _businessTypes = [
    'Proprietorship',
    'Partnership',
    'LLP',
    'Private Limited Company',
    'Public Limited Company',
    'Section 8 Company',
    'One Person Company (OPC)',
    'HUF',
    'Trust',
    'Society',
    'NGO',
    'AOP / BOI',
    'Government Organization',
  ];


  @override
  void initState() {
    super.initState();
    _initData();
  }

  Future<void> _initData() async {
    setState(() => _isLoading = true);
    await _fetchSchema();
    await _fetchProfile();
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _fetchSchema() async {
    try {
      final response = await http.get(Uri.parse('$kBaseUrl/api/forms/service/Company%20Profile'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _schema = FormSchema.fromJson(data);
        _initializeFields(_schema!.fields);
      }
    } catch (e) {
      debugPrint('Error fetching schema: $e');
    }
  }

  void _initializeFields(List<FormFieldSchema> fields) {
    for (var field in fields) {
      if (field.type == 'text' || field.type == 'number' || field.type == 'email' || field.type == 'phone' || field.type == 'date') {
        _dynamicControllers[field.name] = TextEditingController();
      } else if (field.type == 'dropdown' || field.type == 'checkbox') {
        _dynamicFormData[field.name] = null;
      } else if (field.type == 'file') {
        _dynamicFilePaths[field.name] = null;
      }
    }
  }

  Future<void> _fetchProfile() async {
    final uid = ref.read(authStateProvider).value?.uid;
    if (uid == null) return;
    
    final rawEntity = ref.read(selectedEntityProvider);
    final user = ref.read(userProfileProvider).value;
    final entityName = (rawEntity == 'All Entities' || rawEntity.isEmpty)
        ? (user?.companyName ?? '')
        : rawEntity;
    
    if (entityName.isEmpty) return;

    try {
      final uri = Uri.parse('$kBaseUrl/api/entity-profile?entityName=${Uri.encodeComponent(entityName)}');
      final response = await http.get(uri, headers: {'x-user-id': uid});
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final profile = data['profile'] ?? {};
        
        setState(() {
          _companyNameController.text = profile['entityName']?.toString().isNotEmpty == true 
              ? profile['entityName'] 
              : entityName;
          _companyPanController.text = profile['pan'] ?? '';
          _cinController.text = profile['cin'] ?? '';
          _incorporationDateController.text = profile['incorporationDate'] ?? '';
          _companyEmailController.text = profile['email'] ?? '';
          _companyPhoneController.text = profile['phone'] ?? '';
          _registeredAddressController.text = profile['address'] ?? '';
          _gstinController.text = profile['gstin'] ?? '';
          
          _directorNameController.text = profile['directorName'] ?? '';
          _directorEmailController.text = profile['directorEmail'] ?? '';
          _directorMobileController.text = profile['directorPhone'] ?? '';
          _directorPanController.text = profile['directorPan'] ?? '';
          _directorDinController.text = profile['directorDin'] ?? '';
          
          if (profile['complianceScore'] != null) {
            _complianceScore = (profile['complianceScore'] as num).toInt();
          }

          if (profile['incorpCertDocId']?.toString().isNotEmpty == true) _coiPath = 'Uploaded';
          if (profile['panCardDocId']?.toString().isNotEmpty == true) _panPath = 'Uploaded';
          if (profile['directorPanDocId']?.toString().isNotEmpty == true) _directorPanPath = 'Uploaded';
          if (profile['aadhaarDocId']?.toString().isNotEmpty == true) _aadhaarPath = 'Uploaded';
          if (profile['gstDocId']?.toString().isNotEmpty == true) _gstCertPath = 'Uploaded';
          if (profile['bankDocId']?.toString().isNotEmpty == true) _bankStatementPath = 'Uploaded';

          if (profile['dynamicProfileData'] != null) {
             final dyn = profile['dynamicProfileData'];
             _mcaUsernameController.text = dyn['mcaUsername'] ?? '';
             _mcaPasswordController.text = dyn['mcaPassword'] ?? '';
             _natureOfBusinessController.text = dyn['natureOfBusiness'] ?? '';
             _cityController.text = dyn['city'] ?? '';
             _stateController.text = dyn['state'] ?? '';
             _postalCodeController.text = dyn['postalCode'] ?? '';
             _directorAadhaarController.text = dyn['directorAadhaar'] ?? '';
             _udyamNumberController.text = dyn['udyamNumber'] ?? '';
             _trademarkNoController.text = dyn['trademarkNo'] ?? '';
             _isoCertNoController.text = dyn['isoCertNo'] ?? '';
             _dpiitRefNoController.text = dyn['dpiitRefNo'] ?? '';
             if (dyn['businessType'] != null && _businessTypes.contains(dyn['businessType'])) {
                _businessType = dyn['businessType'];
             }
             if (dyn['annualTurnover'] != null) {
                _annualTurnover = dyn['annualTurnover'];
             }
             if (dyn['udyamCertFile']?.toString().isNotEmpty == true) _udyamCertPath = 'Uploaded';
             if (dyn['trademarkCertFile']?.toString().isNotEmpty == true) _trademarkCertPath = 'Uploaded';
             if (dyn['isoCertFile']?.toString().isNotEmpty == true) _isoCertPath = 'Uploaded';
             
             // populate dynamic schema fields
             for (var key in _dynamicControllers.keys) {
               _dynamicControllers[key]!.text = dyn[key]?.toString() ?? '';
             }
             for (var key in _dynamicFilePaths.keys) {
               if (dyn['${key}File']?.toString().isNotEmpty == true) {
                 _dynamicFilePaths[key] = 'Uploaded';
               }
             }
             for (var key in _dynamicFormData.keys) {
               if (dyn[key] != null) _dynamicFormData[key] = dyn[key];
             }
          }
        });
      }
    } catch (e) {
      debugPrint('Error fetching profile: $e');
    }
  }

  @override
  void dispose() {
    _companyNameController.dispose();
    _companyPanController.dispose();
    _cinController.dispose();
    _incorporationDateController.dispose();
    _natureOfBusinessController.dispose();
    _registeredAddressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _postalCodeController.dispose();
    _companyEmailController.dispose();
    _companyPhoneController.dispose();
    _directorNameController.dispose();
    _directorDinController.dispose();
    _directorPanController.dispose();
    _directorAadhaarController.dispose();
    _directorEmailController.dispose();
    _directorMobileController.dispose();
    _gstinController.dispose();
    _udyamNumberController.dispose();
    _trademarkNoController.dispose();
    _isoCertNoController.dispose();
    _dpiitRefNoController.dispose();
    _mcaUsernameController.dispose();
    _mcaPasswordController.dispose();
    
    for (var controller in _dynamicControllers.values) {
      controller.dispose();
    }
    
    super.dispose();
  }

  Future<void> _pickFile(Function(String) onPicked,
      {List<String> allowedExtensions = const ['jpg', 'jpeg', 'png', 'pdf']}) async {
    FilePickerResult? result = await FilePickerUtil.pickFiles(
      type: FileType.custom,
      allowedExtensions: allowedExtensions,
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
    if (!_formKey.currentState!.validate()) return;
    if (_coiPath == null || _panPath == null) {
      _showError('Please upload the Certificate of Incorporation and Company PAN Card (required).');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');

      final uri = Uri.parse('$kBaseUrl/api/users/me/mca-profile');
      var request = http.MultipartRequest('POST', uri);
      request.headers['x-user-id'] = uid;

      final rawEntity = ref.read(selectedEntityProvider);
      final user = ref.read(userProfileProvider).value;
      final entityName = (rawEntity == 'All Entities' || rawEntity.isEmpty)
          ? (user?.companyName ?? '')
          : rawEntity;
          
      if (entityName.isNotEmpty) {
        request.fields['entityName'] = entityName;
      }

      // Business Info
      request.fields['companyName'] = _companyNameController.text.trim();
      request.fields['companyPan'] = _companyPanController.text.trim();
      request.fields['cin'] = _cinController.text.trim();
      request.fields['incorporationDate'] = _incorporationDateController.text.trim();
      if (_businessType != null) request.fields['businessType'] = _businessType!;
      request.fields['natureOfBusiness'] = _natureOfBusinessController.text.trim();
      request.fields['annualTurnover'] = _annualTurnover;

      // Contact & Address
      request.fields['registeredAddress'] = _registeredAddressController.text.trim();
      request.fields['city'] = _cityController.text.trim();
      request.fields['state'] = _stateController.text.trim();
      request.fields['postalCode'] = _postalCodeController.text.trim();
      request.fields['companyEmail'] = _companyEmailController.text.trim();
      request.fields['companyPhone'] = _companyPhoneController.text.trim();

      // Director
      request.fields['directorName'] = _directorNameController.text.trim();
      request.fields['directorDin'] = _directorDinController.text.trim();
      request.fields['directorPan'] = _directorPanController.text.trim();
      request.fields['directorAadhaar'] = _directorAadhaarController.text.trim();
      request.fields['directorEmail'] = _directorEmailController.text.trim();
      request.fields['directorMobile'] = _directorMobileController.text.trim();

      // Registration details
      request.fields['gstin'] = _gstinController.text.trim();
      request.fields['udyamNumber'] = _udyamNumberController.text.trim();
      request.fields['trademarkNo'] = _trademarkNoController.text.trim();
      request.fields['isoCertNo'] = _isoCertNoController.text.trim();
      request.fields['dpiitRefNo'] = _dpiitRefNoController.text.trim();
      request.fields['mcaUsername'] = _mcaUsernameController.text.trim();
      request.fields['mcaPassword'] = _mcaPasswordController.text.trim();

      // Files
      Future<void> addFile(String fieldname, String? path) async {
        if (path != null && path != 'Uploaded') {
          request.files.add(await http.MultipartFile.fromPath(fieldname, path));
        }
      }

      await addFile('coi', _coiPath);
      await addFile('pan', _panPath);
      await addFile('moa', _moaPath);
      await addFile('aoa', _aoaPath);
      await addFile('aadhaar', _aadhaarPath);
      await addFile('directorPanDoc', _directorPanPath);
      await addFile('gstCert', _gstCertPath);
      await addFile('udyamCert', _udyamCertPath);
      await addFile('trademarkCert', _trademarkCertPath);
      await addFile('isoCert', _isoCertPath);
      await addFile('bankStatement', _bankStatementPath);

      // Append Dynamic Fields
      _dynamicControllers.forEach((key, controller) {
        if (controller.text.trim().isNotEmpty) {
          request.fields[key] = controller.text.trim();
        }
      });
      _dynamicFormData.forEach((key, value) {
        if (value != null) {
          request.fields[key] = value.toString();
        }
      });
      
      // Append Dynamic Files
      for (var entry in _dynamicFilePaths.entries) {
        await addFile(entry.key, entry.value);
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (!mounted) return;
        final responseData = jsonDecode(response.body);
        
        final extractedData = responseData['extractedData'] as Map<String, dynamic>?;
        final score = responseData['complianceScore'] as int?;
        
        setState(() {
          if (score != null) {
            _complianceScore = score;
          }
          if (extractedData != null) {
            if (extractedData['cin'] != null) _cinController.text = extractedData['cin'];
            if (extractedData['pan'] != null) _companyPanController.text = extractedData['pan'];
            if (extractedData['gstin'] != null) _gstinController.text = extractedData['gstin'];
            if (extractedData['companyName'] != null) _companyNameController.text = extractedData['companyName'];
            if (extractedData['incorporationDate'] != null) {
              _incorporationDateController.text = extractedData['incorporationDate'];
            }
          }
        });
        
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Company Profile saved successfully!'),
          backgroundColor: AppTheme.deepTeal,
        ));
        ref.invalidate(userProfileProvider);
        // Do not pop the screen so user can see extracted data and score
      } else {
        throw Exception('Failed: ${response.body}');
      }
    } catch (e) {
      showGlobalError(e);
      if (!mounted) return;
      _showError('Error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  Future<void> _saveDraft() async {
    final prefs = await SharedPreferences.getInstance();
    final data = <String, dynamic>{
      'companyName': _companyNameController.text,
      'companyPan': _companyPanController.text,
      'cin': _cinController.text,
      'incorporationDate': _incorporationDateController.text,
      'businessType': _businessType,
      'natureOfBusiness': _natureOfBusinessController.text,
      'annualTurnover': _annualTurnover,
      'registeredAddress': _registeredAddressController.text,
      'city': _cityController.text,
      'state': _stateController.text,
      'postalCode': _postalCodeController.text,
      'companyEmail': _companyEmailController.text,
      'companyPhone': _companyPhoneController.text,
      'directorName': _directorNameController.text,
      'directorDin': _directorDinController.text,
      'directorPan': _directorPanController.text,
      'directorAadhaar': _directorAadhaarController.text,
      'directorEmail': _directorEmailController.text,
      'directorMobile': _directorMobileController.text,
      'gstin': _gstinController.text,
      'udyamNumber': _udyamNumberController.text,
      'trademarkNo': _trademarkNoController.text,
      'isoCertNo': _isoCertNoController.text,
      'dpiitRefNo': _dpiitRefNoController.text,
      'mcaUsername': _mcaUsernameController.text,
      'mcaPassword': _mcaPasswordController.text,
    };
    await prefs.setString('draft_mca_profile', jsonEncode(data));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Draft saved!'),
        backgroundColor: AppTheme.deepTeal,
      ));
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
                style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(80, 36)),
                onPressed: () async {
                  await _saveDraft();
                  if (context.mounted) Navigator.of(context).pop(true);
                },
                child: Text('Save Draft',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.corporateBlue, fontWeight: FontWeight.bold)),
              ),
              TextButton(
                style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(60, 36)),
                onPressed: () => Navigator.of(context).pop(false),
                child: Text('Cancel', style: Theme.of(context).textTheme.bodyMedium),
              ),
              TextButton(
                style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(60, 36)),
                onPressed: () => Navigator.of(context).pop(true),
                child: Text('Discard', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.red)),
              ),
            ],
          ),
        ],
      ),
    );
    return shouldPop ?? false;
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final shouldPop = await _onWillPop();
        if (shouldPop && context.mounted) Navigator.of(context).pop();
      },
      child: Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('Company Profile',
            style: TextStyle(color: Colors.black, fontWeight: FontWeight.w800, fontSize: 16)),
        centerTitle: true,
        backgroundColor: AppTheme.backgroundLight,
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
                  Text('Complete Company Profile',
                      style: GoogleFonts.outfit(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.corporateBlue)),
                  const SizedBox(height: 6),
                  Text(
                    'This information is used across all your services — fill once, apply everywhere.',
                    style: GoogleFonts.inter(
                        fontSize: 12, color: Colors.grey.shade500, height: 1.5),
                  ),
                  const SizedBox(height: 20),



                  // ─── Section 1: Business Information ──────────────────────
                  _buildSectionContainer(
                    title: 'Business Information',
                    icon: Icons.business_outlined,
                    children: [
                      _buildField('Company / Business Name', '', _companyNameController, isRequired: true),
                      _buildField('Company PAN', '', _companyPanController, isRequired: true),
                      _buildField('CIN (Company Identification No.)', '', _cinController),
                      _buildField('Date of Incorporation', '', _incorporationDateController, isDate: true),
                      _buildDropdownField('Type of Business Entity', _businessType, _businessTypes,
                          (val) => setState(() => _businessType = val), isRequired: true),
                      _buildField('Nature of Business / Activity', '', _natureOfBusinessController, isRequired: true),
                      _buildRadioGroup(
                        'Expected Annual Turnover',
                        '',
                        ['Less than ₹20 Lakhs', '₹20 Lakhs – ₹50 Lakhs', 'Above ₹50 Lakhs'],
                        _annualTurnover,
                        (v) => setState(() => _annualTurnover = v),
                      ),
                    ],
                  ),

                  // ─── Section 2: Contact & Address ─────────────────────────
                  _buildSectionContainer(
                    title: 'Contact & Address',
                    icon: Icons.location_on_outlined,
                    children: [
                      _buildField('Registered Office Address', '', _registeredAddressController,
                          isRequired: true, maxLines: 3),
                      Row(
                        children: [
                          Expanded(child: _buildField('City', '', _cityController, isRequired: true)),
                          const SizedBox(width: 12),
                          Expanded(child: _buildField('State', '', _stateController, isRequired: true)),
                        ],
                      ),
                      _buildField('PIN Code', '', _postalCodeController,
                          isRequired: true, keyboardType: TextInputType.number),
                      _buildField('Company Email', '', _companyEmailController,
                          isRequired: true, keyboardType: TextInputType.emailAddress),
                      PhoneInputField(
                        controller: _companyPhoneController,
                        label: 'Company Phone Number',
                        isRequired: true,
                      ),
                    ],
                  ),

                  // ─── Section 3: Director / Authorized Signatory ───────────
                  _buildSectionContainer(
                    title: 'Director / Authorized Signatory',
                    icon: Icons.person_outline,
                    children: [
                      _buildField('Director / Proprietor Name', '', _directorNameController, isRequired: true),
                      _buildField('Director DIN', '', _directorDinController),
                      _buildField('Director PAN', '', _directorPanController),
                      _buildField('Director Aadhaar Number', '', _directorAadhaarController,
                          keyboardType: TextInputType.number),
                      _buildField('Director Email', '', _directorEmailController,
                          keyboardType: TextInputType.emailAddress),
                      PhoneInputField(
                        controller: _directorMobileController,
                        label: 'Director Mobile',
                      ),
                    ],
                  ),

                  // ─── Section 4: Registration Details (optional) ───────────
                  _buildSectionContainer(
                    title: 'Registration Details',
                    icon: Icons.verified_outlined,
                    subtitle: 'Optional — fill whatever applies to your business',
                    children: [
                      _buildField('GSTIN', '', _gstinController),
                      _buildField('UDYAM / MSME Number', '', _udyamNumberController),
                      _buildField('Trademark Registration No.', '', _trademarkNoController),
                      _buildField('ISO Certificate No.', '', _isoCertNoController),
                      _buildField('DPIIT Reference No.', '', _dpiitRefNoController),
                      _buildField('MCA Portal Username', '', _mcaUsernameController),
                      _buildPasswordField('MCA Portal Password', '', _mcaPasswordController),
                    ],
                  ),

                  // ─── Section 5: Documents ─────────────────────────────────
                  _buildSectionContainer(
                    title: 'Documents',
                    icon: Icons.attach_file_outlined,
                    children: [
                      _buildFileRow('Certificate of Incorporation (COI)', _coiPath,
                          () => _pickFile((p) => setState(() => _coiPath = p)), isRequired: true),
                      _buildFileRow('Company PAN Card', _panPath,
                          () => _pickFile((p) => setState(() => _panPath = p)), isRequired: true),
                      _buildFileRow('MOA (Memorandum of Association)', _moaPath,
                          () => _pickFile((p) => setState(() => _moaPath = p))),
                      _buildFileRow('AOA (Articles of Association)', _aoaPath,
                          () => _pickFile((p) => setState(() => _aoaPath = p))),
                      _buildFileRow('Director Aadhaar', _aadhaarPath,
                          () => _pickFile((p) => setState(() => _aadhaarPath = p))),
                      _buildFileRow('Director PAN', _directorPanPath,
                          () => _pickFile((p) => setState(() => _directorPanPath = p))),
                      _buildFileRow('GST Certificate', _gstCertPath,
                          () => _pickFile((p) => setState(() => _gstCertPath = p))),
                      _buildFileRow('UDYAM / MSME Certificate', _udyamCertPath,
                          () => _pickFile((p) => setState(() => _udyamCertPath = p))),
                      _buildFileRow('Trademark Certificate', _trademarkCertPath,
                          () => _pickFile((p) => setState(() => _trademarkCertPath = p))),
                      _buildFileRow('ISO Certificate', _isoCertPath,
                          () => _pickFile((p) => setState(() => _isoCertPath = p))),
                      _buildFileRow('Last FY Bank Statement', _bankStatementPath,
                          () => _pickFile((p) => setState(() => _bankStatementPath = p))),
                    ],
                  ),
                  
                  _buildDynamicFields(),

                  const SizedBox(height: 8),
                  ElevatedButton(
                    onPressed: _submitDetails,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.corporateBlue,
                      minimumSize: const Size(double.infinity, 52),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                    child: const Text('Save Company Profile',
                        style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
                  ),
                   const SizedBox(height: 40),
                ],
              ),
            ),
      ),
    );
  }

  // ── Builders ───────────────────────────────────────────────────────────────

  Widget _buildDynamicFields() {
    if (_schema == null || _schema!.fields.isEmpty) return const SizedBox.shrink();

    return _buildSectionContainer(
      title: 'Additional Details',
      icon: Icons.more_horiz,
      subtitle: 'Custom fields requested by the administration',
      children: _schema!.fields.map((field) {
        if (field.type == 'text' || field.type == 'number' || field.type == 'email' || field.type == 'phone' || field.type == 'date') {
          TextInputType kbType = TextInputType.text;
          if (field.type == 'number') kbType = TextInputType.number;
          if (field.type == 'email') kbType = TextInputType.emailAddress;
          if (field.type == 'phone') kbType = TextInputType.phone;
          
          if (field.type == 'phone') {
            return PhoneInputField(
              controller: _dynamicControllers[field.name] ?? TextEditingController(),
              label: field.label,
              isRequired: field.required,
            );
          }
          
          return _buildField(
            field.label,
            '',
            _dynamicControllers[field.name] ?? TextEditingController(),
            isRequired: field.required,
            keyboardType: kbType,
            isDate: field.type == 'date',
          );
        } else if (field.type == 'dropdown' && field.options != null) {
           return Padding(
             padding: const EdgeInsets.only(bottom: 20),
             child: Column(
               crossAxisAlignment: CrossAxisAlignment.start,
               children: [
                 Text(field.label, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.deepTeal)),
                 const SizedBox(height: 8),
                 DropdownButtonFormField<String>(
                   value: _dynamicFormData[field.name],
                   decoration: InputDecoration(
                     border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                     contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                   ),
                   items: field.options!.map((opt) => DropdownMenuItem(value: opt, child: Text(opt))).toList(),
                   onChanged: (val) {
                     setState(() {
                       _dynamicFormData[field.name] = val;
                     });
                   },
                 ),
               ],
             ),
           );
        } else if (field.type == 'file') {
           return _buildFileRow(
             field.label,
             _dynamicFilePaths[field.name],
             () => _pickFile((p) => setState(() => _dynamicFilePaths[field.name] = p)),
             isRequired: field.required
           );
        }
        return const SizedBox.shrink();
      }).toList(),
    );
  }

  Widget _buildSectionContainer({
    required String title,
    required IconData icon,
    required List<Widget> children,
    String? subtitle,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: AppTheme.corporateBlue.withValues(alpha: 0.05),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Row(
              children: [
                Icon(icon, color: AppTheme.corporateBlue, size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title,
                          style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.deepTeal)),
                      if (subtitle != null) ...[
                        const SizedBox(height: 2),
                        Text(subtitle,
                            style: GoogleFonts.inter(
                                fontSize: 11,
                                color: Colors.grey.shade500,
                                fontWeight: FontWeight.w500)),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: children,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildField(
    String label,
    String hint,
    TextEditingController controller, {
    bool isRequired = false,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    bool isDate = false,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: label,
              style: GoogleFonts.inter(
                  fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.deepTeal),
              children: [
                if (isRequired) const TextSpan(text: ' *', style: TextStyle(color: Colors.red)),
              ],
            ),
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: controller,
            keyboardType: keyboardType,
            maxLines: maxLines,
            readOnly: isDate,
            onTap: isDate
                ? () async {
                    final date = await showCustomDatePicker(context);
                    if (date != null) {
                      controller.text =
                          '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
                    }
                  }
                : null,
            style: GoogleFonts.inter(fontSize: 13, color: Colors.black87),
            decoration: InputDecoration(
              hintText: HintHelper.getExampleHint(label, hint: hint),
              hintStyle: GoogleFonts.inter(fontSize: 13, color: Colors.grey.shade400),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade300)),
              enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade300)),
              focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.corporateBlue, width: 1.5)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              suffixIcon: isDate
                  ? const Icon(Icons.calendar_today, size: 18, color: Colors.grey)
                  : null,
              filled: true,
              fillColor: Colors.grey.shade50,
            ),
            validator: (v) {
              if (isRequired && (v == null || v.trim().isEmpty)) return 'Required';
              if (v != null && v.trim().isNotEmpty) {
                final l = label.toLowerCase();
                if (l.contains('pan')) {
                  if (!RegExp(r'^[a-zA-Z]{5}[0-9]{4}[a-zA-Z]{1}$').hasMatch(v.trim())) {
                    return 'Enter a valid PAN (ABCDE1234F)';
                  }
                }
                if (l.contains('email') || l.contains('mail')) {
                  if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(v.trim())) {
                    return 'Enter a valid email';
                  }
                }
                if (l.contains('aadhaar') || l.contains('aadhar')) {
                  if (!RegExp(r'^[2-9]{1}[0-9]{11}$').hasMatch(v.trim())) {
                    return 'Enter valid 12-digit Aadhaar';
                  }
                }
              }
              return null;
            },
          ),
        ],
      ),
    );
  }

  Widget _buildDropdownField(
    String label,
    String? value,
    List<String> options,
    ValueChanged<String?> onChanged, {
    bool isRequired = false,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: label,
              style: GoogleFonts.inter(
                  fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.deepTeal),
              children: [
                if (isRequired) const TextSpan(text: ' *', style: TextStyle(color: Colors.red)),
              ],
            ),
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: value,
            isExpanded: true,
            alignment: Alignment.centerLeft,
            style: GoogleFonts.inter(fontSize: 13, color: Colors.black87),
            decoration: InputDecoration(
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade300)),
              enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade300)),
              focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.corporateBlue, width: 1.5)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              filled: true,
              fillColor: Colors.grey.shade50,
            ),
            hint: Text('Select type',
                style: GoogleFonts.inter(fontSize: 13, color: Colors.grey.shade400),
                textAlign: TextAlign.left),
            selectedItemBuilder: (context) => options
                .map((o) => Align(
                    alignment: Alignment.centerLeft,
                    child: Text(o,
                        style: GoogleFonts.inter(fontSize: 13, color: Colors.black87),
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.left)))
                .toList(),
            items: options
                .map((o) => DropdownMenuItem(
                    value: o,
                    child: Text(o,
                        style: GoogleFonts.inter(fontSize: 13),
                        overflow: TextOverflow.ellipsis)))
                .toList(),
            onChanged: onChanged,
            validator: isRequired
                ? (v) => (v == null || v.isEmpty) ? 'Required' : null
                : null,
          ),
        ],
      ),
    );
  }

  Widget _buildPasswordField(String label, String hint, TextEditingController controller,
      {bool isRequired = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: label,
              style: GoogleFonts.inter(
                  fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.deepTeal),
              children: [
                if (isRequired) const TextSpan(text: ' *', style: TextStyle(color: Colors.red)),
              ],
            ),
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: controller,
            obscureText: _obscurePassword,
            style: GoogleFonts.inter(fontSize: 13, color: Colors.black87),
            decoration: InputDecoration(
              hintText: HintHelper.getExampleHint(label, hint: hint),
              hintStyle: GoogleFonts.inter(fontSize: 13, color: Colors.grey.shade400),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade300)),
              enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade300)),
              focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.corporateBlue, width: 1.5)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              filled: true,
              fillColor: Colors.grey.shade50,
              suffixIcon: IconButton(
                icon:
                    Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility, color: Colors.grey, size: 18),
                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRadioGroup(String label, String hint, List<String> options, String currentValue,
      ValueChanged<String> onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: label,
              style: GoogleFonts.inter(
                  fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.deepTeal),
              children: const [TextSpan(text: ' *', style: TextStyle(color: Colors.red))],
            ),
          ),
          const SizedBox(height: 8),
          ...options.map((option) => InkWell(
                onTap: () => onChanged(option),
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Radio<String>(
                        value: option,
                        groupValue: currentValue,
                        onChanged: (v) { if (v != null) onChanged(v); },
                        activeColor: AppTheme.corporateBlue,
                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        visualDensity: VisualDensity.compact,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                          child: Text(option,
                              style: GoogleFonts.inter(fontSize: 13, color: AppTheme.deepTeal))),
                    ],
                  ),
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildFileRow(String label, String? path, VoidCallback onPick, {bool isRequired = false}) {
    final bool hasFile = path != null;
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: label,
              style: GoogleFonts.inter(
                  fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.deepTeal),
              children: [
                if (isRequired) const TextSpan(text: ' *', style: TextStyle(color: Colors.red)),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: hasFile
                  ? AppTheme.corporateBlue.withValues(alpha: 0.04)
                  : Colors.grey.shade50,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: hasFile ? AppTheme.corporateBlue.withValues(alpha: 0.4) : Colors.grey.shade300,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  hasFile ? Icons.check_circle_outline : Icons.upload_file_outlined,
                  size: 18,
                  color: hasFile ? AppTheme.corporateBlue : Colors.grey.shade500,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    hasFile ? path.split('/').last : 'No file selected',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: hasFile ? AppTheme.corporateBlue : Colors.grey.shade500,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                OutlinedButton(
                  onPressed: onPick,
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(
                        color: hasFile ? AppTheme.corporateBlue : Colors.grey.shade400),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    minimumSize: const Size(72, 32),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  ),
                  child: Text(
                    hasFile ? 'Change' : 'Upload',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: hasFile ? AppTheme.corporateBlue : Colors.black87,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
