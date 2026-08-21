import 'package:crm_app/core/utils/error_handler.dart';
import 'package:crm_app/core/utils/hint_helper.dart';
import 'package:crm_app/core/utils/file_picker_util.dart';
import 'package:crm_app/core/utils/form_ui_helper.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;

import '../../core/constants/port.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';

class McaProfileFormScreen extends ConsumerStatefulWidget {
  const McaProfileFormScreen({super.key});

  @override
  ConsumerState<McaProfileFormScreen> createState() => _McaProfileFormScreenState();
}

class _McaProfileFormScreenState extends ConsumerState<McaProfileFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  bool _obscurePassword = true;

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
        if (path != null) {
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

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Company Profile saved successfully!'),
          backgroundColor: AppTheme.deepTeal,
        ));
        ref.invalidate(userProfileProvider);
        Navigator.pop(context, true);
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Company Profile',
            style: TextStyle(color: Colors.black, fontWeight: FontWeight.w800, fontSize: 16)),
        centerTitle: true,
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
    );
  }

  // ── Builders ───────────────────────────────────────────────────────────────

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
