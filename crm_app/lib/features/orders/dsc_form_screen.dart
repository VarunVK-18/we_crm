import 'package:flutter/material.dart';
import '../../providers/draft_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;

import '../../core/constants/port.dart';
import '../../core/theme/app_theme.dart';
import '../../models/order_model.dart';
import '../../providers/auth_provider.dart';

class DscFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const DscFormScreen({super.key, required this.order});

  @override
  ConsumerState<DscFormScreen> createState() => _DscFormScreenState();
}

class _DscFormScreenState extends ConsumerState<DscFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  String _applyingFor = 'Individual DSC for Company Incorporation / Registration';
  final _applicantNameController = TextEditingController();
  final _applicantMailController = TextEditingController();
  final _applicantPhoneController = TextEditingController();
  final _organizationNameController = TextEditingController();
  final _organizationTypeController = TextEditingController();
  final _officeAddressController = TextEditingController();
  final _courierAddressController = TextEditingController();

  String? _applicantPanPath;
  String? _applicantAadhaarPath;
  String? _applicantPhotoPath;
  String? _coiPath;
  String? _organizationPanPath;
  String? _gstPath;
  String? _msmePath;
  String? _otherDirectorPanPath;

  bool _isVerified = false;

  @override
    @override
  void initState() {
    super.initState();
    _loadDraft();
  }

  void dispose() {
    _applicantNameController.dispose();
    _applicantMailController.dispose();
    _applicantPhoneController.dispose();
    _organizationNameController.dispose();
    _organizationTypeController.dispose();
    _officeAddressController.dispose();
    _courierAddressController.dispose();
    super.dispose();
  }

  Future<void> _pickFile(Function(String) onPicked) async {
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
        onPicked(result.files.single.path!);
      });
    }
  }

  
  Future<void> _loadDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final draft = await draftService.loadDraft(widget.order.id, 'DscFormScreen');
    if (draft != null) {
      if (mounted) {
        setState(() {
        if (draft.containsKey('applicantName')) _applicantNameController.text = draft['applicantName'];
        if (draft.containsKey('applicantMail')) _applicantMailController.text = draft['applicantMail'];
        if (draft.containsKey('applicantPhone')) _applicantPhoneController.text = draft['applicantPhone'];
        if (draft.containsKey('organizationName')) _organizationNameController.text = draft['organizationName'];
        if (draft.containsKey('organizationType')) _organizationTypeController.text = draft['organizationType'];
        if (draft.containsKey('officeAddress')) _officeAddressController.text = draft['officeAddress'];
        if (draft.containsKey('courierAddress')) _courierAddressController.text = draft['courierAddress'];
        if (draft.containsKey('applyingFor')) _applyingFor = draft['applyingFor'];

                if (draft.containsKey('applicantPanPath')) _applicantPanPath = draft['applicantPanPath'];
        if (draft.containsKey('applicantAadhaarPath')) _applicantAadhaarPath = draft['applicantAadhaarPath'];
        if (draft.containsKey('applicantPhotoPath')) _applicantPhotoPath = draft['applicantPhotoPath'];
        if (draft.containsKey('coiPath')) _coiPath = draft['coiPath'];
        if (draft.containsKey('organizationPanPath')) _organizationPanPath = draft['organizationPanPath'];
        if (draft.containsKey('gstPath')) _gstPath = draft['gstPath'];
        if (draft.containsKey('msmePath')) _msmePath = draft['msmePath'];
        if (draft.containsKey('otherDirectorPanPath')) _otherDirectorPanPath = draft['otherDirectorPanPath'];
});
      }
    }
  }

  Future<void> _saveDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final data = <String, dynamic>{
      'applicantName': _applicantNameController.text,
      'applicantMail': _applicantMailController.text,
      'applicantPhone': _applicantPhoneController.text,
      'organizationName': _organizationNameController.text,
      'organizationType': _organizationTypeController.text,
      'officeAddress': _officeAddressController.text,
      'courierAddress': _courierAddressController.text,
      'applyingFor': _applyingFor,

          'applicantPanPath': _applicantPanPath,
      'applicantAadhaarPath': _applicantAadhaarPath,
      'applicantPhotoPath': _applicantPhotoPath,
      'coiPath': _coiPath,
      'organizationPanPath': _organizationPanPath,
      'gstPath': _gstPath,
      'msmePath': _msmePath,
      'otherDirectorPanPath': _otherDirectorPanPath,
};
    await draftService.saveDraft(widget.order.id, 'DscFormScreen', data);
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

    if (_applicantPanPath == null) {
      _showError("Please upload Applicant PAN Card.");
      return;
    }
    if (_applicantAadhaarPath == null) {
      _showError("Please upload Applicant Aadhaar Card.");
      return;
    }
    if (_applicantPhotoPath == null) {
      _showError("Please upload Applicant Photo.");
      return;
    }

    if (!_isVerified) {
      _showError("Please check the verification checkbox.");
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');

      final uri = Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-dsc-form');
      var request = http.MultipartRequest('POST', uri);
      request.headers['x-user-id'] = uid;

      request.fields['applyingFor'] = _applyingFor;
      request.fields['applicantName'] = _applicantNameController.text;
      request.fields['applicantMail'] = _applicantMailController.text;
      request.fields['applicantPhone'] = _applicantPhoneController.text;
      request.fields['organizationName'] = _organizationNameController.text;
      request.fields['organizationType'] = _organizationTypeController.text;
      request.fields['officeAddress'] = _officeAddressController.text;
      request.fields['courierAddress'] = _courierAddressController.text;

      // Add files
      request.files.add(await http.MultipartFile.fromPath('applicantPan', _applicantPanPath!));
      request.files.add(await http.MultipartFile.fromPath('applicantAadhaar', _applicantAadhaarPath!));
      request.files.add(await http.MultipartFile.fromPath('applicantPhoto', _applicantPhotoPath!));

      if (_coiPath != null) {
        request.files.add(await http.MultipartFile.fromPath('certificateOfIncorporation', _coiPath!));
      }
      if (_organizationPanPath != null) {
        request.files.add(await http.MultipartFile.fromPath('organizationPan', _organizationPanPath!));
      }
      if (_gstPath != null) {
        request.files.add(await http.MultipartFile.fromPath('gstCertificate', _gstPath!));
      }
      if (_msmePath != null) {
        request.files.add(await http.MultipartFile.fromPath('msmeCertificate', _msmePath!));
      }
      if (_otherDirectorPanPath != null) {
        request.files.add(await http.MultipartFile.fromPath('otherDirectorPan', _otherDirectorPanPath!));
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
        ref.read(draftServiceProvider).clearDraft(widget.order.id, 'DscFormScreen');
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
                  Text('Complete Details', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800, color: AppTheme.corporateBlue)),
                  const SizedBox(height: 16),
                  
                  _buildSectionContainer(
                    title: 'Application Information',
                    children: [
                      _buildRadioGroup('I\'m applying for', '', [
                        'Individual DSC for Company Incorporation / Registration',
                        'Organization DSC for DPIIT Certificate Purpose'
                      ], _applyingFor, (v) => setState(() => _applyingFor = v)),
                      
                      _buildField('Applicant Name (As per PAN)', '', _applicantNameController, isRequired: true),
                      _buildField('Applicant Mail ID / Office Mail ID', 'For OTPs', _applicantMailController, isRequired: true, keyboardType: TextInputType.emailAddress),
                      _buildField('Applicant Phone Number', 'For OTPs', _applicantPhoneController, isRequired: true, keyboardType: TextInputType.phone),
                      _buildField('Organization Name', '', _organizationNameController, isRequired: true),
                      _buildField('Organization Type', '', _organizationTypeController, isRequired: true),
                      _buildField('Office Address', '', _officeAddressController, isRequired: true, maxLines: 3),
                      _buildField('Address for couriering the DSC', 'Full Address with PIN code', _courierAddressController, isRequired: true, maxLines: 3),
                    ],
                  ),

                  _buildSectionContainer(
                    title: 'Mandatory Documents',
                    children: [
                      _buildFileRow('Applicant PAN Card', 'Upload 1 supported file: PDF or image. Max 2 MB.', _applicantPanPath, () => _pickFile((path) => _applicantPanPath = path)),
                      _buildFileRow('Applicant Aadhaar Card', 'Upload 1 supported file: PDF or image. Max 2 MB.', _applicantAadhaarPath, () => _pickFile((path) => _applicantAadhaarPath = path)),
                      _buildFileRow('Applicant Photo', 'Upload 1 supported file: PDF or image. Max 2 MB.', _applicantPhotoPath, () => _pickFile((path) => _applicantPhotoPath = path)),
                    ],
                  ),

                  _buildSectionContainer(
                    title: 'Optional Documents',
                    children: [
                      _buildFileRow('Certificate of Incorporation', 'Upload 1 supported file: PDF or image. Max 2 MB.', _coiPath, () => _pickFile((path) => _coiPath = path), isRequired: false),
                      _buildFileRow('Organization PAN', 'Upload 1 supported file: PDF or image. Max 2 MB.', _organizationPanPath, () => _pickFile((path) => _organizationPanPath = path), isRequired: false),
                      _buildFileRow('GST Certificate', 'Upload 1 supported file: PDF or image. Max 2 MB.', _gstPath, () => _pickFile((path) => _gstPath = path), isRequired: false),
                      _buildFileRow('MSME (UDYAM) Certificate', 'Upload 1 supported file: PDF or image. Max 2 MB.', _msmePath, () => _pickFile((path) => _msmePath = path), isRequired: false),
                      _buildFileRow('Other Director PAN', 'Upload 1 supported file: PDF or image. Max 2 MB.', _otherDirectorPanPath, () => _pickFile((path) => _otherDirectorPanPath = path), isRequired: false),
                    ],
                  ),

                  // Verification Checkbox
                  _buildSectionContainer(
                    title: 'Verification',
                    children: [
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
                                  text: 'I here verify that above mentioned facts are true and correct to best of my knowledge and belief',
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

  Widget _buildFileRow(String label, String hint, String? path, VoidCallback onPick, {bool isRequired = true}) {
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
