import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;
import 'package:file_picker/file_picker.dart';
import 'package:path/path.dart' as p;
import '../../models/order_model.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/port.dart';
import '../../providers/auth_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/draft_provider.dart';
import 'package:crm_app/core/utils/error_handler.dart';
import 'package:crm_app/core/utils/file_picker_util.dart';

class DunsFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;

  const DunsFormScreen({super.key, required this.order});

  @override
  ConsumerState<DunsFormScreen> createState() => _DunsFormScreenState();
}

class _DunsFormScreenState extends ConsumerState<DunsFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  final TextEditingController _legalBusinessNameCtrl = TextEditingController();
  final TextEditingController _tradeNameCtrl = TextEditingController();
  final TextEditingController _businessTypeOtherCtrl = TextEditingController();
  final TextEditingController _yearOfEstCtrl = TextEditingController();
  final TextEditingController _numEmployeesCtrl = TextEditingController();
  final TextEditingController _regAddressCtrl = TextEditingController();
  final TextEditingController _cityCtrl = TextEditingController();
  final TextEditingController _stateCtrl = TextEditingController();
  final TextEditingController _pinCodeCtrl = TextEditingController();
  final TextEditingController _countryCtrl = TextEditingController(text: 'India');
  final TextEditingController _emailCtrl = TextEditingController();
  final TextEditingController _phoneCtrl = TextEditingController();
  final TextEditingController _websiteCtrl = TextEditingController();
  final TextEditingController _panCtrl = TextEditingController();
  final TextEditingController _gstCtrl = TextEditingController();
  final TextEditingController _cinCtrl = TextEditingController();
  final TextEditingController _natureOfBizCtrl = TextEditingController();
  final TextEditingController _mainProductsCtrl = TextEditingController();
  final TextEditingController _revenueCtrl = TextEditingController();
  final TextEditingController _founderNameCtrl = TextEditingController();
  final TextEditingController _designationCtrl = TextEditingController();
  final TextEditingController _contactNumberCtrl = TextEditingController();

  String _businessType = '';
  File? _incorpCertFile;
  File? _panCardFile;
  File? _addressProofFile;
  bool _declaration = false;

  @override
  void initState() {
    super.initState();
    _loadDraft();
  }

  @override
  void dispose() {
    _legalBusinessNameCtrl.dispose();
    _tradeNameCtrl.dispose();
    _businessTypeOtherCtrl.dispose();
    _yearOfEstCtrl.dispose();
    _numEmployeesCtrl.dispose();
    _regAddressCtrl.dispose();
    _cityCtrl.dispose();
    _stateCtrl.dispose();
    _pinCodeCtrl.dispose();
    _countryCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _websiteCtrl.dispose();
    _panCtrl.dispose();
    _gstCtrl.dispose();
    _cinCtrl.dispose();
    _natureOfBizCtrl.dispose();
    _mainProductsCtrl.dispose();
    _revenueCtrl.dispose();
    _founderNameCtrl.dispose();
    _designationCtrl.dispose();
    _contactNumberCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final draft = await draftService.loadDraft(widget.order.id, 'DunsFormScreen');
    if (draft != null && mounted) {
      setState(() {
        _legalBusinessNameCtrl.text = draft['legalBusinessName'] ?? '';
        _tradeNameCtrl.text = draft['tradeName'] ?? '';
        _businessType = draft['businessType'] ?? '';
        _businessTypeOtherCtrl.text = draft['businessTypeOther'] ?? '';
        _yearOfEstCtrl.text = draft['yearOfEstablishment'] ?? '';
        _numEmployeesCtrl.text = draft['numberOfEmployees'] ?? '';
        _regAddressCtrl.text = draft['registeredAddress'] ?? '';
        _cityCtrl.text = draft['city'] ?? '';
        _stateCtrl.text = draft['state'] ?? '';
        _pinCodeCtrl.text = draft['pinCode'] ?? '';
        _countryCtrl.text = draft['country'] ?? 'India';
        _emailCtrl.text = draft['officialEmail'] ?? '';
        _phoneCtrl.text = draft['businessPhone'] ?? '';
        _websiteCtrl.text = draft['websiteUrl'] ?? '';
        _panCtrl.text = draft['panNumber'] ?? '';
        _gstCtrl.text = draft['gstNumber'] ?? '';
        _cinCtrl.text = draft['cinLlpinNumber'] ?? '';
        _natureOfBizCtrl.text = draft['natureOfBusiness'] ?? '';
        _mainProductsCtrl.text = draft['mainProducts'] ?? '';
        _revenueCtrl.text = draft['annualRevenue'] ?? '';
        _founderNameCtrl.text = draft['founderName'] ?? '';
        _designationCtrl.text = draft['designation'] ?? '';
        _contactNumberCtrl.text = draft['contactNumber'] ?? '';
        _declaration = draft['declaration'] ?? false;
      });
    }
  }

  void _saveDraft() {
    final draftService = ref.read(draftServiceProvider);
    final data = {
      'legalBusinessName': _legalBusinessNameCtrl.text,
      'tradeName': _tradeNameCtrl.text,
      'businessType': _businessType,
      'businessTypeOther': _businessTypeOtherCtrl.text,
      'yearOfEstablishment': _yearOfEstCtrl.text,
      'numberOfEmployees': _numEmployeesCtrl.text,
      'registeredAddress': _regAddressCtrl.text,
      'city': _cityCtrl.text,
      'state': _stateCtrl.text,
      'pinCode': _pinCodeCtrl.text,
      'country': _countryCtrl.text,
      'officialEmail': _emailCtrl.text,
      'businessPhone': _phoneCtrl.text,
      'websiteUrl': _websiteCtrl.text,
      'panNumber': _panCtrl.text,
      'gstNumber': _gstCtrl.text,
      'cinLlpinNumber': _cinCtrl.text,
      'natureOfBusiness': _natureOfBizCtrl.text,
      'mainProducts': _mainProductsCtrl.text,
      'annualRevenue': _revenueCtrl.text,
      'founderName': _founderNameCtrl.text,
      'designation': _designationCtrl.text,
      'contactNumber': _contactNumberCtrl.text,
      'declaration': _declaration,
    };
    draftService.saveDraft(widget.order.id, 'DunsFormScreen', data);
  }

  Future<void> _pickFile(String type) async {
    FilePickerResult? result = await FilePickerUtil.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'png', 'jpg', 'jpeg'],
    );
    if (result != null && result.files.single.path != null) {
      File file = File(result.files.single.path!);
      int sizeInBytes = file.lengthSync();
      double sizeInMb = sizeInBytes / (1024 * 1024);
      if (sizeInMb > 2) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('File must be smaller than 2 MB.'), backgroundColor: Colors.red),
          );
        }
        return;
      }
      setState(() {
        if (type == 'incorpCert') _incorpCertFile = file;
        if (type == 'panCard') _panCardFile = file;
        if (type == 'addressProof') _addressProofFile = file;
      });
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    if (_businessType.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a Business Type.')));
      return;
    }
    if (_incorpCertFile == null || _panCardFile == null || _addressProofFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please upload all required documents.'), backgroundColor: Colors.red),
      );
      return;
    }
    if (!_declaration) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please accept the declaration.'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-duns-form'),
      );
      request.headers['x-user-id'] = uid;

      request.fields['legalBusinessName'] = _legalBusinessNameCtrl.text;
      request.fields['tradeName'] = _tradeNameCtrl.text;
      request.fields['businessType'] = _businessType == 'Other' ? _businessTypeOtherCtrl.text : _businessType;
      request.fields['yearOfEstablishment'] = _yearOfEstCtrl.text;
      request.fields['numberOfEmployees'] = _numEmployeesCtrl.text;
      request.fields['registeredAddress'] = _regAddressCtrl.text;
      request.fields['city'] = _cityCtrl.text;
      request.fields['state'] = _stateCtrl.text;
      request.fields['pinCode'] = _pinCodeCtrl.text;
      request.fields['country'] = _countryCtrl.text;
      request.fields['officialEmail'] = _emailCtrl.text;
      request.fields['businessPhone'] = _phoneCtrl.text;
      request.fields['websiteUrl'] = _websiteCtrl.text;
      request.fields['panNumber'] = _panCtrl.text;
      request.fields['gstNumber'] = _gstCtrl.text;
      request.fields['cinLlpinNumber'] = _cinCtrl.text;
      request.fields['natureOfBusiness'] = _natureOfBizCtrl.text;
      request.fields['mainProducts'] = _mainProductsCtrl.text;
      request.fields['annualRevenue'] = _revenueCtrl.text;
      request.fields['founderName'] = _founderNameCtrl.text;
      request.fields['designation'] = _designationCtrl.text;
      request.fields['contactNumber'] = _contactNumberCtrl.text;

      request.files.add(await http.MultipartFile.fromPath('incorpCert', _incorpCertFile!.path));
      request.files.add(await http.MultipartFile.fromPath('panCard', _panCardFile!.path));
      request.files.add(await http.MultipartFile.fromPath('addressProof', _addressProofFile!.path));

      var response = await request.send();
      if (response.statusCode == 200 || response.statusCode == 201) {
        if (mounted) {
          ref.read(draftServiceProvider).clearDraft(widget.order.id, 'DunsFormScreen');
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('DUNS Form submitted successfully!'), backgroundColor: Colors.green),
          );
          Navigator.pop(context, true);
        }
      } else {
        throw Exception('Failed to submit form: ${response.statusCode}');
      }
    } catch (e) {
      showGlobalError(e);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Widget _buildField({
    required String label,
    required TextEditingController controller,
    bool isRequired = false,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    String? hintText,
    String? Function(String?)? validator,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: label,
              style: const TextStyle(
                fontFamily: 'Inter',
                fontSize: 14.0,
                fontWeight: FontWeight.w500,
                color: AppTheme.deepTeal,
              ),
              children: [
                if (isRequired) const TextSpan(text: ' *', style: TextStyle(color: Colors.red, fontSize: 14.0)),
              ],
            ),
          ),
          const SizedBox(height: 8.0),
          TextFormField(
            controller: controller,
            keyboardType: keyboardType,
            maxLines: maxLines,
            onChanged: (_) => _saveDraft(),
            style: GoogleFonts.inter( fontSize: 14.0, color: AppTheme.deepTeal),
            decoration: InputDecoration(
              hintText: hintText,
              hintStyle: TextStyle(color: Colors.grey.shade600.withOpacity(0.5), fontSize: 14.0),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8.0), borderSide: BorderSide(color: Colors.grey.shade300)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8.0), borderSide: BorderSide(color: Colors.grey.shade300)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8.0), borderSide: const BorderSide(color: AppTheme.corporateBlue)),
              filled: true,
              fillColor: AppTheme.surfaceLight,
            ),
            validator: validator ?? (v) {
              if (isRequired && (v == null || v.trim().isEmpty)) return 'This is a required field';
              return null;
            },
          ),
        ],
      ),
    );
  }

  Widget _buildRadioGroup(String label, List<String> options) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: label,
              style: GoogleFonts.inter( fontSize: 14.0, fontWeight: FontWeight.w500, color: AppTheme.deepTeal),
              children: const [TextSpan(text: ' *', style: TextStyle(color: Colors.red, fontSize: 14.0))],
            ),
          ),
          const SizedBox(height: 8.0),
          Wrap(
            spacing: 12.0,
            runSpacing: 8.0,
            children: options.map((option) {
              return IntrinsicWidth(
                child: RadioListTile<String>(
                  contentPadding: EdgeInsets.zero,
                  title: Text(option, style: GoogleFonts.inter( fontSize: 14.0)),
                  value: option,
                  groupValue: _businessType,
                  activeColor: AppTheme.corporateBlue,
                  onChanged: (val) {
                    setState(() => _businessType = val!);
                    _saveDraft();
                  },
                ),
              );
            }).toList(),
          ),
          if (_businessType == 'Other')
            Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: TextFormField(
                controller: _businessTypeOtherCtrl,
                onChanged: (_) => _saveDraft(),
                decoration: InputDecoration(
                  hintText: 'Please specify',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8.0), borderSide: BorderSide(color: Colors.grey.shade300)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                ),
                validator: (v) => v == null || v.isEmpty ? 'Please specify the business type' : null,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildFileRow(String title, File? file, String type) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: title,
              style: GoogleFonts.inter( fontSize: 14.0, fontWeight: FontWeight.w500, color: AppTheme.deepTeal),
              children: const [TextSpan(text: ' *', style: TextStyle(color: Colors.red, fontSize: 14.0))],
            ),
          ),
          const SizedBox(height: 4.0),
          Text(
            'Upload 1 supported file. Max 2 MB.',
            style: GoogleFonts.inter( fontSize: 12.0, color: Colors.grey.shade600),
          ),
          const SizedBox(height: 8.0),
          Row(
            children: [
              ElevatedButton.icon(
                onPressed: () => _pickFile(type),
                icon: const Icon(LucideIcons.upload, size: 16.0),
                label: const Text('Choose File'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.surfaceLight,
                  foregroundColor: AppTheme.deepTeal,
                  elevation: 0,
                  side: BorderSide(color: Colors.grey.shade300),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.0)),
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                ),
              ),
              const SizedBox(width: 12.0),
              Expanded(
                child: Text(
                  file != null ? p.basename(file.path) : 'No file chosen',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 14.0,
                    color: file != null ? AppTheme.deepTeal : Colors.grey.shade600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: Text(
          'DUNS Registration',
          style: GoogleFonts.outfit( fontSize: 18.0, fontWeight: FontWeight.w600, color: AppTheme.deepTeal),
        ),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: AppTheme.deepTeal, size: 24.0),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.corporateBlue))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16.0),
                      decoration: BoxDecoration(color: AppTheme.corporateBlue.withOpacity(0.05), borderRadius: BorderRadius.circular(12.0)),
                      child: Row(
                        children: [
                          const Icon(LucideIcons.info, color: AppTheme.corporateBlue, size: 24.0),
                          const SizedBox(width: 12.0),
                          Expanded(
                            child: Text(
                              'Standard processing typically takes 5–30 business days, depending on verification by Dun & Bradstreet.',
                              style: GoogleFonts.inter( fontSize: 13.0, color: AppTheme.corporateBlue),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24.0),

                    Text('Company Details', style: GoogleFonts.outfit( fontSize: 18.0, fontWeight: FontWeight.w600, color: AppTheme.deepTeal)),
                    const SizedBox(height: 16.0),
                    _buildField(label: 'Legal Business Name', controller: _legalBusinessNameCtrl, isRequired: true),
                    _buildField(label: 'Trade Name (if any)', controller: _tradeNameCtrl),
                    _buildRadioGroup('Business Type', ['Private Limited', 'LLP', 'Sole Proprietorship', 'Partnership', 'Other']),
                    _buildField(label: 'Year of Establishment', controller: _yearOfEstCtrl, isRequired: true, keyboardType: TextInputType.number),
                    _buildField(label: 'Number of Employees', controller: _numEmployeesCtrl, isRequired: true, keyboardType: TextInputType.number),

                    const SizedBox(height: 24.0),
                    Text('Business Address Details', style: GoogleFonts.outfit( fontSize: 18.0, fontWeight: FontWeight.w600, color: AppTheme.deepTeal)),
                    const SizedBox(height: 16.0),
                    _buildField(label: 'Registered Address', controller: _regAddressCtrl, isRequired: true, maxLines: 3),
                    Row(
                      children: [
                        Expanded(child: _buildField(label: 'City', controller: _cityCtrl, isRequired: true)),
                        const SizedBox(width: 16.0),
                        Expanded(child: _buildField(label: 'State', controller: _stateCtrl, isRequired: true)),
                      ],
                    ),
                    Row(
                      children: [
                        Expanded(child: _buildField(label: 'PIN Code', controller: _pinCodeCtrl, isRequired: true, keyboardType: TextInputType.number)),
                        const SizedBox(width: 16.0),
                        Expanded(child: _buildField(label: 'Country', controller: _countryCtrl, isRequired: true)),
                      ],
                    ),

                    const SizedBox(height: 24.0),
                    Text('Business Registration Details', style: GoogleFonts.outfit( fontSize: 18.0, fontWeight: FontWeight.w600, color: AppTheme.deepTeal)),
                    const SizedBox(height: 16.0),
                    _buildField(label: 'Official Email ID', controller: _emailCtrl, isRequired: true, keyboardType: TextInputType.emailAddress),
                    _buildField(
                      label: 'Business Phone Number',
                      controller: _phoneCtrl,
                      isRequired: true,
                      keyboardType: TextInputType.phone,
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Phone is required';
                        if (!RegExp(r'^\d{10}$').hasMatch(v)) return 'Enter valid 10-digit number';
                        return null;
                      },
                    ),
                    _buildField(label: 'Website URL', controller: _websiteCtrl, keyboardType: TextInputType.url),
                    _buildField(
                      label: 'PAN Number of the Business',
                      controller: _panCtrl,
                      isRequired: true,
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'PAN is required';
                        if (!RegExp(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', caseSensitive: false).hasMatch(v)) return 'Enter valid PAN';
                        return null;
                      }
                    ),
                    _buildField(label: 'GST Number', controller: _gstCtrl),
                    _buildField(label: 'CIN / LLPIN number', controller: _cinCtrl),
                    _buildField(label: 'Nature of Business', controller: _natureOfBizCtrl, isRequired: true),
                    _buildField(label: 'Main Products / Services', controller: _mainProductsCtrl, isRequired: true),
                    _buildField(label: 'Annual Revenue (Approx)', controller: _revenueCtrl, isRequired: true, keyboardType: TextInputType.number),

                    const SizedBox(height: 24.0),
                    Text('Director/Founder Details', style: GoogleFonts.outfit( fontSize: 18.0, fontWeight: FontWeight.w600, color: AppTheme.deepTeal)),
                    const SizedBox(height: 16.0),
                    _buildField(label: 'Founder / Director Name', controller: _founderNameCtrl, isRequired: true),
                    _buildField(label: 'Designation', controller: _designationCtrl, isRequired: true),
                    _buildField(
                      label: 'Contact Number',
                      controller: _contactNumberCtrl,
                      isRequired: true,
                      keyboardType: TextInputType.phone,
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Contact Number is required';
                        if (!RegExp(r'^\d{10}$').hasMatch(v)) return 'Enter valid 10-digit number';
                        return null;
                      },
                    ),

                    const SizedBox(height: 24.0),
                    Text('Document Uploads', style: GoogleFonts.outfit( fontSize: 18.0, fontWeight: FontWeight.w600, color: AppTheme.deepTeal)),
                    const SizedBox(height: 16.0),
                    _buildFileRow('Upload Incorporation Certificate', _incorpCertFile, 'incorpCert'),
                    _buildFileRow('Upload PAN Card of Company', _panCardFile, 'panCard'),
                    _buildFileRow('Upload Address Proof (Utility bill / Bank statement)', _addressProofFile, 'addressProof'),

                    const SizedBox(height: 32.0),
                    Container(
                      padding: const EdgeInsets.all(16.0),
                      decoration: BoxDecoration(color: Colors.red.withOpacity(0.05), border: Border.all(color: Colors.red.withOpacity(0.2)), borderRadius: BorderRadius.circular(12.0)),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SizedBox(
                            width: 24.0,
                            height: 24.0,
                            child: Checkbox(
                              value: _declaration,
                              onChanged: (v) {
                                setState(() => _declaration = v ?? false);
                                _saveDraft();
                              },
                              activeColor: AppTheme.corporateBlue,
                            ),
                          ),
                          const SizedBox(width: 12.0),
                          Expanded(
                            child: RichText(
                              text: TextSpan(
                                text: 'I confirm that the above information is accurate and authorize submission for D-U-N-S registration via Dun & Bradstreet. ',
                                style: GoogleFonts.inter( fontSize: 13.0, color: AppTheme.deepTeal, height: 1.5),
                                children: const [TextSpan(text: '*', style: TextStyle(color: Colors.red))],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32.0),
                    SizedBox(
                      width: double.infinity,
                      height: 50.0,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _submitForm,
                        style: ElevatedButton.styleFrom(backgroundColor: AppTheme.corporateBlue, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.0))),
                        child: Text(
                          _isLoading ? 'Submitting...' : 'Submit Details',
                          style: GoogleFonts.outfit( fontSize: 16.0, fontWeight: FontWeight.w600, color: Colors.white),
                        ),
                      ),
                    ),
                    const SizedBox(height: 40.0),
                  ],
                ),
              ),
            ),
    );
  }
}
