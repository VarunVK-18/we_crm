import 'dart:convert';
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

class TrademarkFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const TrademarkFormScreen({super.key, required this.order});

  @override
  ConsumerState<TrademarkFormScreen> createState() => _TrademarkFormScreenState();
}

class _TrademarkFormScreenState extends ConsumerState<TrademarkFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Form Fields
  final _companyNameController = TextEditingController();
  final _udyamNumberController = TextEditingController();
  final _applicantNameController = TextEditingController(); // Name of the applicant
  final _companyAddressController = TextEditingController();
  final _companyMobileController = TextEditingController();
  final _companyEmailController = TextEditingController();
  final _partnersNameController = TextEditingController();
  final _businessDescriptionController = TextEditingController();
  final _dateFirstUsedController = TextEditingController();
  final _nameOfApplicantController = TextEditingController(); // Name of Applicant (second one requested)

  // Radio Fields
  String _msmeType = 'Micro';
  String _tradeDescription = 'Goods';
  String _categoryOfMark = 'Word mark (it includes one or more words, letters, numerals or anything written in standard character)';

  // Checkbox Fields
  bool _isVerified = false;

  // File Paths
  String? _udyamCertPath;
  String? _trademarkLogoPath;
  String? _signaturePath;

  @override
    @override
  void initState() {
    super.initState();
    _loadDraft();
  }

  void dispose() {
    _companyNameController.dispose();
    _udyamNumberController.dispose();
    _applicantNameController.dispose();
    _companyAddressController.dispose();
    _companyMobileController.dispose();
    _companyEmailController.dispose();
    _partnersNameController.dispose();
    _businessDescriptionController.dispose();
    _dateFirstUsedController.dispose();
    _nameOfApplicantController.dispose();
    super.dispose();
  }

  Future<void> _pickFile(String field) async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
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
        final path = result.files.single.path!;
        switch (field) {
          case 'udyamCert':
            _udyamCertPath = path;
            break;
          case 'trademarkLogo':
            _trademarkLogoPath = path;
            break;
          case 'signature':
            _signaturePath = path;
            break;
        }
      });
    }
  }

  
  Future<void> _loadDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final draft = await draftService.loadDraft(widget.order.id, 'TrademarkFormScreen');
    if (draft != null) {
      if (mounted) {
        setState(() {
        if (draft.containsKey('companyName')) _companyNameController.text = draft['companyName'];
        if (draft.containsKey('udyamNumber')) _udyamNumberController.text = draft['udyamNumber'];
        if (draft.containsKey('applicantName')) _applicantNameController.text = draft['applicantName'];
        if (draft.containsKey('companyAddress')) _companyAddressController.text = draft['companyAddress'];
        if (draft.containsKey('companyMobile')) _companyMobileController.text = draft['companyMobile'];
        if (draft.containsKey('companyEmail')) _companyEmailController.text = draft['companyEmail'];
        if (draft.containsKey('partnersName')) _partnersNameController.text = draft['partnersName'];
        if (draft.containsKey('businessDescription')) _businessDescriptionController.text = draft['businessDescription'];
        if (draft.containsKey('dateFirstUsed')) _dateFirstUsedController.text = draft['dateFirstUsed'];
        if (draft.containsKey('nameOfApplicant')) _nameOfApplicantController.text = draft['nameOfApplicant'];
        if (draft.containsKey('msmeType')) _msmeType = draft['msmeType'];
        if (draft.containsKey('tradeDescription')) _tradeDescription = draft['tradeDescription'];
        if (draft.containsKey('categoryOfMark')) _categoryOfMark = draft['categoryOfMark'];
        if (draft.containsKey('isVerified')) {
          final val = draft['isVerified'];
          _isVerified = val is bool ? val : val == 'true';
        }

        });
      }
    }
  }

  Future<void> _saveDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final data = <String, dynamic>{
      'companyName': _companyNameController.text,
      'udyamNumber': _udyamNumberController.text,
      'applicantName': _applicantNameController.text,
      'companyAddress': _companyAddressController.text,
      'companyMobile': _companyMobileController.text,
      'companyEmail': _companyEmailController.text,
      'partnersName': _partnersNameController.text,
      'businessDescription': _businessDescriptionController.text,
      'dateFirstUsed': _dateFirstUsedController.text,
      'nameOfApplicant': _nameOfApplicantController.text,
      'msmeType': _msmeType,
      'tradeDescription': _tradeDescription,
      'categoryOfMark': _categoryOfMark,
      'isVerified': _isVerified.toString(),

    };
    await draftService.saveDraft(widget.order.id, 'TrademarkFormScreen', data);
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

    if (_udyamCertPath == null || _trademarkLogoPath == null || _signaturePath == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please upload all required files (UDYAM Certificate, Trademark Logo, Signature).'),
        backgroundColor: Colors.red,
      ));
      return;
    }

    if (!_isVerified) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please accept the verification statement at the bottom.'),
        backgroundColor: Colors.red,
      ));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');

      final uri = Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-trademark-form');
      var request = http.MultipartRequest('POST', uri);
      request.headers['x-user-id'] = uid;

      // Add text fields
      request.fields['companyName'] = _companyNameController.text;
      request.fields['udyamNumber'] = _udyamNumberController.text;
      request.fields['applicantName'] = _applicantNameController.text;
      request.fields['companyAddress'] = _companyAddressController.text;
      request.fields['companyMobile'] = _companyMobileController.text;
      request.fields['companyEmail'] = _companyEmailController.text;
      request.fields['partnersName'] = _partnersNameController.text;
      request.fields['businessDescription'] = _businessDescriptionController.text;
      request.fields['dateFirstUsed'] = _dateFirstUsedController.text;
      request.fields['nameOfApplicant'] = _nameOfApplicantController.text;
      
      request.fields['msmeType'] = _msmeType;
      request.fields['tradeDescription'] = _tradeDescription;
      request.fields['categoryOfMark'] = _categoryOfMark;
      request.fields['isVerified'] = _isVerified.toString();

      // Add files
      request.files.add(await http.MultipartFile.fromPath('udyamCert', _udyamCertPath!));
      request.files.add(await http.MultipartFile.fromPath('trademarkLogo', _trademarkLogoPath!));
      request.files.add(await http.MultipartFile.fromPath('signature', _signaturePath!));

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
        ref.read(draftServiceProvider).clearDraft(widget.order.id, 'TrademarkFormScreen');
        Navigator.pop(context, true); // Success
      } else {
        throw Exception('Failed to submit form: ${response.body}');
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Error: $e'),
        backgroundColor: Colors.red,
      ));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  
  Future<bool> _onWillPop() async {
    final shouldPop = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Are You Sure To Exit ?'),
          content: const Text('Any unsaved progress will be lost.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text(
                'Cancel',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: Text(
                'OK',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: const Color.fromARGB(255, 6, 6, 6),
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
        title: const Text('Trademark Registration Form', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w800, fontSize: 16)),
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
                  
                  Container(
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
                        _buildField('Company Name', '', _companyNameController, isRequired: true),
                        _buildFileRow('UDYAM MSME Certificate', 'Upload 1 supported file. Max 2 MB.', _udyamCertPath, () => _pickFile('udyamCert')),
                        _buildField('UDYAM MSME Number', '', _udyamNumberController, isRequired: true),
                        
                        _buildRadioGroup('MSME type of Enterprises', '', [
                          'Micro',
                          'Small',
                          'Medium'
                        ], _msmeType, (v) => setState(() => _msmeType = v)),
                        
                        _buildField('Name of the applicant', '', _applicantNameController, isRequired: true),
                        _buildField('Address of the Company', '', _companyAddressController, isRequired: true),
                        
                        _buildRadioGroup('Trade Description', '', [
                          'Goods',
                          'Services'
                        ], _tradeDescription, (v) => setState(() => _tradeDescription = v)),
                        
                        _buildFileRow('Trade mark Logo', 'Upload 1 supported file. Max 2 MB.', _trademarkLogoPath, () => _pickFile('trademarkLogo')),
                        
                        _buildRadioGroup('Category of mark', '', [
                          'Word mark (it includes one or more words, letters, numerals or anything written in standard character)',
                          'Device mark (it includes any label, sticker, monogram, logo or any geometrical figure other than work mark)'
                        ], _categoryOfMark, (v) => setState(() => _categoryOfMark = v)),
                        
                        _buildField('Company mobile number', '', _companyMobileController, isRequired: true, keyboardType: TextInputType.phone),
                        _buildField('Company Mail ID', '', _companyEmailController, isRequired: true, keyboardType: TextInputType.emailAddress),
                        _buildField('Partners Name if Partnership Firm', 'Leave blank if not applicable.', _partnersNameController, isRequired: false),
                        _buildField('Business Description', '', _businessDescriptionController, isRequired: true),
                        _buildField('Date Of Trade/ Brand Name First Used / Date of Company Incorporation', 'e.g., DD/MM/YYYY', _dateFirstUsedController, isRequired: true, isDate: true),
                        _buildField('Name of Applicant', '', _nameOfApplicantController, isRequired: true),
                        
                        _buildFileRow('Signature with name', 'Upload 1 supported file. Max 2 MB.', _signaturePath, () => _pickFile('signature')),
                      ],
                    ),
                  ),

                  // Verification Checkbox
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
                              text: 'Verification',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.deepTeal),
                              children: [
                                TextSpan(text: ' *\n', style: TextStyle(color: Colors.red)),
                                TextSpan(
                                  text: 'I here verify that above mentioned facts are true and correct to best of my knowledge and belief.',
                                  style: TextStyle(fontWeight: FontWeight.normal, color: Colors.black87),
                                ),
                              ]
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: _isLoading ? null : _saveDraft,
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    side: const BorderSide(color: AppTheme.deepTeal),
                  ),
                  child: Text(
                    'Save as Draft',
                    style: GoogleFonts.outfit(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.deepTeal,
                    ),
                  ),
                ),
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
                ],
              ),
            ),
    ));
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

  Widget _buildField(String label, String hint, TextEditingController controller, {bool isRequired = false, TextInputType keyboardType = TextInputType.text, bool isDate = false}) {
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
