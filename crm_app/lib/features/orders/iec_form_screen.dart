import 'package:crm_app/core/utils/file_picker_util.dart';
import 'package:flutter/material.dart';
import '../../providers/entity_profile_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;

import '../../core/constants/port.dart';
import '../../core/theme/app_theme.dart';
import '../../models/order_model.dart';
import '../../providers/auth_provider.dart';

class IecFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const IecFormScreen({super.key, required this.order});

  @override
  ConsumerState<IecFormScreen> createState() => _IecFormScreenState();
}

class _IecFormScreenState extends ConsumerState<IecFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // 1. Applicant Details
  final _applicantFirstNameController = TextEditingController();
  final _applicantLastNameController = TextEditingController();
  final _applicantEmailController = TextEditingController();
  final _applicantMobileController = TextEditingController();
  final _applicantAddressController = TextEditingController();

  // 2. Applicant Documents
  String? _applicantPanPath;
  String? _applicantAddressProofPath;

  // 3. Company Details
  final _companyNameController = TextEditingController();
  final _companyPanNumberController = TextEditingController();
  final _nameOnCompanyPanController = TextEditingController();
  final _dateOfIncorporationController = TextEditingController();
  final _gstinController = TextEditingController();
  final _companyMobileNumberController = TextEditingController();
  final _companyMailIdController = TextEditingController();

  // 4. Director Details
  bool _hasDirectorDetails = false;
  final _directorDinController = TextEditingController();
  final _directorPanNameController = TextEditingController();
  final _directorPanNumberController = TextEditingController();
  final _directorPanDobController = TextEditingController();
  final _directorFatherNameController = TextEditingController();
  final _directorAddressController = TextEditingController();
  final _directorPhoneNumberController = TextEditingController();

  // 5. Director Documents
  String? _directorPanPath;
  String? _directorAddressProofPath;

  // 6. Bank Details
  final _bankAccountNumberController = TextEditingController();
  final _bankAccountHolderNameController = TextEditingController();
  final _ifscCodeController = TextEditingController();
  final _bankNameController = TextEditingController();

  // 7. Bank Documents
  String? _bankAccountFirstPagePath;

  bool _declaration = false;

  @override
  void initState() {
    super.initState();
    _loadDraft();
    _loadEntityPrefill();
  }

  Future<void> _loadEntityPrefill() async {
    final uid = ref.read(authStateProvider).value?.uid;
    if (uid == null) return;
    final profile = await ref.read(entityCacheServiceProvider).fetchProfile(uid);
    if (!mounted) return;
    setState(() {
      if (_applicantFirstNameController.text.isEmpty && profile.directorName.isNotEmpty) {
        final parts = profile.directorName.split(' ');
        _applicantFirstNameController.text = parts.first;
        if (parts.length > 1) _applicantLastNameController.text = parts.sublist(1).join(' ');
      }
      if (_applicantEmailController.text.isEmpty && profile.email.isNotEmpty)
        _applicantEmailController.text = profile.email;
      if (_applicantMobileController.text.isEmpty && profile.phone.isNotEmpty)
        _applicantMobileController.text = profile.phone;
      if (_companyNameController.text.isEmpty && profile.entityName.isNotEmpty)
        _companyNameController.text = profile.entityName;
      if (_companyPanNumberController.text.isEmpty && profile.pan.isNotEmpty)
        _companyPanNumberController.text = profile.pan;
      if (_gstinController.text.isEmpty && profile.gstin.isNotEmpty)
        _gstinController.text = profile.gstin;
      if (_companyMailIdController.text.isEmpty && profile.email.isNotEmpty)
        _companyMailIdController.text = profile.email;
      if (_companyMobileNumberController.text.isEmpty && profile.phone.isNotEmpty)
        _companyMobileNumberController.text = profile.phone;
      if (_bankAccountNumberController.text.isEmpty && profile.bankAccount.isNotEmpty)
        _bankAccountNumberController.text = profile.bankAccount;
      if (_ifscCodeController.text.isEmpty && profile.bankIfsc.isNotEmpty)
        _ifscCodeController.text = profile.bankIfsc;
      if (_bankNameController.text.isEmpty && profile.bankName.isNotEmpty)
        _bankNameController.text = profile.bankName;
    });
  }

  @override
  void dispose() {
    _applicantFirstNameController.dispose();
    _applicantLastNameController.dispose();
    _applicantEmailController.dispose();
    _applicantMobileController.dispose();
    _applicantAddressController.dispose();
    _companyNameController.dispose();
    _companyPanNumberController.dispose();
    _nameOnCompanyPanController.dispose();
    _dateOfIncorporationController.dispose();
    _gstinController.dispose();
    _companyMobileNumberController.dispose();
    _companyMailIdController.dispose();
    _directorDinController.dispose();
    _directorPanNameController.dispose();
    _directorPanNumberController.dispose();
    _directorPanDobController.dispose();
    _directorFatherNameController.dispose();
    _directorAddressController.dispose();
    _directorPhoneNumberController.dispose();
    _bankAccountNumberController.dispose();
    _bankAccountHolderNameController.dispose();
    _ifscCodeController.dispose();
    _bankNameController.dispose();
    super.dispose();
  }

  Future<void> _pickFile(Function(String) onPicked, {List<String> allowedExtensions = const ['jpg', 'jpeg', 'png', 'pdf']}) async {
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

  Future<void> _loadDraft() async {}
  void _saveDraft() {}

  Future<bool> _onWillPop() async {
    final shouldPop = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Save as Draft?'),
        content: const Text('Do you want to save your progress before exiting?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text('Discard', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.red)),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text('Cancel', style: Theme.of(context).textTheme.bodyMedium),
          ),
          TextButton(
            onPressed: () async {
              _saveDraft();
              if (context.mounted) Navigator.of(context).pop(true);
            },
            child: Text('Save as Draft', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.corporateBlue, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
    return shouldPop ?? false;
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all required fields.')));
      return;
    }
    if (!_declaration) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please accept the declaration.'), backgroundColor: Colors.red));
      return;
    }
    
    // Validate documents
    if (_applicantPanPath == null || _applicantAddressProofPath == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please upload all mandatory applicant documents.'), backgroundColor: Colors.red));
      return;
    }
    
    if (_hasDirectorDetails && (_directorPanPath == null || _directorAddressProofPath == null)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please upload all mandatory director documents.'), backgroundColor: Colors.red));
      return;
    }

    if (_bankAccountFirstPagePath == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please upload all mandatory bank documents.'), backgroundColor: Colors.red));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-iec-form'),
      );
      if (uid != null) {
        request.headers['x-user-id'] = uid;
      }

      request.fields['applicantFirstName'] = _applicantFirstNameController.text.trim();
      request.fields['applicantLastName'] = _applicantLastNameController.text.trim();
      request.fields['applicantEmail'] = _applicantEmailController.text.trim();
      request.fields['applicantMobile'] = _applicantMobileController.text.trim();
      request.fields['applicantAddress'] = _applicantAddressController.text.trim();

      request.fields['companyName'] = _companyNameController.text.trim();
      request.fields['companyPanNumber'] = _companyPanNumberController.text.trim();
      request.fields['nameOnCompanyPan'] = _nameOnCompanyPanController.text.trim();
      request.fields['dateOfIncorporation'] = _dateOfIncorporationController.text.trim();
      request.fields['gstin'] = _gstinController.text.trim();
      request.fields['companyMobileNumber'] = _companyMobileNumberController.text.trim();
      request.fields['companyMailId'] = _companyMailIdController.text.trim();

      request.fields['hasDirectorDetails'] = _hasDirectorDetails.toString();
      
      if (_hasDirectorDetails) {
        request.fields['directorDin'] = _directorDinController.text.trim();
        request.fields['directorPanName'] = _directorPanNameController.text.trim();
        request.fields['directorPanNumber'] = _directorPanNumberController.text.trim();
        request.fields['directorPanDob'] = _directorPanDobController.text.trim();
        request.fields['directorFatherName'] = _directorFatherNameController.text.trim();
        request.fields['directorAddress'] = _directorAddressController.text.trim();
        request.fields['directorPhoneNumber'] = _directorPhoneNumberController.text.trim();
        
        request.files.add(await http.MultipartFile.fromPath('directorPanDoc', _directorPanPath!));
        request.files.add(await http.MultipartFile.fromPath('directorAddressProofDoc', _directorAddressProofPath!));
      }

      request.fields['bankAccountNumber'] = _bankAccountNumberController.text.trim();
      request.fields['bankAccountHolderName'] = _bankAccountHolderNameController.text.trim();
      request.fields['ifscCode'] = _ifscCodeController.text.trim();
      request.fields['bankName'] = _bankNameController.text.trim();

      request.files.add(await http.MultipartFile.fromPath('applicantPanDoc', _applicantPanPath!));
      request.files.add(await http.MultipartFile.fromPath('applicantAddressProofDoc', _applicantAddressProofPath!));
      request.files.add(await http.MultipartFile.fromPath('bankAccountFirstPage', _bankAccountFirstPagePath!));

      var response = await request.send();
      if (response.statusCode == 200 || response.statusCode == 201) {
        if (uid != null) {
          ref.read(entityCacheServiceProvider).saveTextFields(uid, {
            'entityName': _companyNameController.text,
            'pan': _companyPanNumberController.text,
            'email': _applicantEmailController.text,
            'phone': _applicantMobileController.text,
            'gstin': _gstinController.text,
            'directorName': '${_applicantFirstNameController.text} ${_applicantLastNameController.text}'.trim(),
            'bankAccount': _bankAccountNumberController.text,
            'bankIfsc': _ifscCodeController.text,
            'bankName': _bankNameController.text,
          });
        }
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('IEC Form submitted successfully!'), backgroundColor: Colors.green),
          );
          Navigator.of(context).pop(true);
        }
      } else {
        throw Exception('Failed to submit form: ${response.statusCode}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  
  Widget _buildField(String label, TextEditingController controller, {
    bool isRequired = false,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    bool isDate = false,
    bool readOnly = false,
    bool obscureText = false,
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
              text: label.replaceAll(' *', '').replaceAll('*', '').trim(),
              style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 12, color: AppTheme.deepTeal),
              children: [if (label.contains('*') || isRequired) const TextSpan(text: ' *', style: TextStyle(color: Colors.red))],
            ),
          ),
          const SizedBox(height: 6),
          TextFormField(
            controller: controller,
            keyboardType: keyboardType,
            maxLines: maxLines,
            maxLength: maxLength,
            readOnly: readOnly || isDate,
            obscureText: obscureText,
            textCapitalization: textCapitalization,
            onChanged: (_) => _saveDraft(),
            onTap: isDate ? () async {
               final date = await showDatePicker(
                 context: context,
                 initialDate: DateTime.now().subtract(const Duration(days: 365)),
                 firstDate: DateTime(1900),
                 lastDate: DateTime.now(),
               );
               if (date != null) {
                 setState(() {
                   controller.text = "${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}";
                 });
                 _saveDraft();
               }
            } : null,
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
              if ((label.contains('*') || isRequired) && (v == null || v.trim().isEmpty)) return 'This is a required field';
              return null;
            },
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

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
      appBar: AppBar(
        title: Text('IEC Registration', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildSectionHeader('1. Applicant Details'),
              _buildField('First Name *', _applicantFirstNameController),
              _buildField('Last Name *', _applicantLastNameController),
              _buildField('Email *', _applicantEmailController, keyboardType: TextInputType.emailAddress),
              _buildField('Mobile No *', _applicantMobileController, keyboardType: TextInputType.phone),
              _buildField('Address *', _applicantAddressController, maxLines: 3),
              _buildField('Company Name *', _companyNameController),
              _buildField('Company PAN Number *', _companyPanNumberController),
              _buildField('Name on Company PAN *', _nameOnCompanyPanController),
              _buildField('Date of Incorporation *', _dateOfIncorporationController, isDate: true),
              _buildField('GSTIN *', _gstinController),
              _buildField('Company Mobile Number *', _companyMobileNumberController, keyboardType: TextInputType.phone),
              _buildField('Company Mail ID *', _companyMailIdController, keyboardType: TextInputType.emailAddress),
              SwitchListTile(
                title: Text('Include Director / Partner Details?', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                value: _hasDirectorDetails,
                onChanged: (v) => setState(() => _hasDirectorDetails = v),
                activeColor: AppTheme.corporateBlue,
                contentPadding: EdgeInsets.zero,
              ),
              if (_hasDirectorDetails) ...[
                const SizedBox(height: 12),
                _buildField('DIN *', _directorDinController),
                _buildField('Director 1 PAN Name *', _directorPanNameController),
                _buildField('Director 1 PAN Number *', _directorPanNumberController),
                _buildField('Director 1 PAN DOB *', _directorPanDobController, isDate: true),
                _buildField('Father Name *', _directorFatherNameController),
                _buildField('Address *', _directorAddressController, maxLines: 3),
                _buildField('Phone Number *', _directorPhoneNumberController, keyboardType: TextInputType.phone),
              ],
              _buildField('Bank Account Number *', _bankAccountNumberController, keyboardType: TextInputType.number, obscureText: true),
              _buildField('Bank Account Holder Name *', _bankAccountHolderNameController),
              _buildField('IFSC Code *', _ifscCodeController),
              _buildField('Bank Name *', _bankNameController),
              CheckboxListTile(
                title: Text('I hereby declare that all the information provided is true and correct.', style: GoogleFonts.inter(fontSize: 13)),
                value: _declaration,
                onChanged: (v) => setState(() => _declaration = v ?? false),
                controlAffinity: ListTileControlAffinity.leading,
                contentPadding: EdgeInsets.zero,
                activeColor: AppTheme.corporateBlue,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isLoading ? null : _submitForm,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.corporateBlue,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: _isLoading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text('Submit Details', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
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
