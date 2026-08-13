import 'package:crm_app/core/utils/error_handler.dart';
import 'package:crm_app/core/utils/file_picker_util.dart';
import 'package:flutter/material.dart';
import '../../providers/draft_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;
import 'package:intl/intl.dart';

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

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16.0),
      child: Text(
        title,
        style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.corporateBlue),
      ),
    );
  }

  Widget _buildFilePickerField(String label, String? path, Function() onPick, {bool isRequired = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(label, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500)),
            if (isRequired) Text(' *', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.red)),
          ],
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: onPick,
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(8),
              color: Colors.grey.shade50,
            ),
            child: Row(
              children: [
                Icon(Icons.upload_file, color: path != null ? Colors.green : Colors.grey),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    path != null ? path.split('/').last : 'Tap to upload file (Max 2 MB)',
                    style: GoogleFonts.inter(
                      color: path != null ? Colors.green.shade700 : Colors.grey.shade600,
                      fontWeight: path != null ? FontWeight.w500 : FontWeight.normal,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Future<void> _selectDate(BuildContext context, TextEditingController controller) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() {
        controller.text = DateFormat('yyyy-MM-dd').format(picked);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
              TextFormField(
                controller: _applicantFirstNameController,
                decoration: const InputDecoration(labelText: 'First Name *', border: OutlineInputBorder()),
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _applicantLastNameController,
                decoration: const InputDecoration(labelText: 'Last Name *', border: OutlineInputBorder()),
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _applicantEmailController,
                decoration: const InputDecoration(labelText: 'Email *', border: OutlineInputBorder()),
                keyboardType: TextInputType.emailAddress,
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _applicantMobileController,
                decoration: const InputDecoration(labelText: 'Mobile No *', border: OutlineInputBorder()),
                keyboardType: TextInputType.phone,
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _applicantAddressController,
                decoration: const InputDecoration(labelText: 'Address *', border: OutlineInputBorder()),
                maxLines: 3,
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),

              _buildSectionHeader('2. Applicant Documents'),
              _buildFilePickerField(
                'Applicant PAN Card',
                _applicantPanPath,
                () => _pickFile((path) => _applicantPanPath = path),
                isRequired: true,
              ),
              _buildFilePickerField(
                'Applicant Address Proof',
                _applicantAddressProofPath,
                () => _pickFile((path) => _applicantAddressProofPath = path),
                isRequired: true,
              ),

              _buildSectionHeader('3. Company Details'),
              TextFormField(
                controller: _companyNameController,
                decoration: const InputDecoration(labelText: 'Company Name *', border: OutlineInputBorder()),
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _companyPanNumberController,
                decoration: const InputDecoration(labelText: 'Company PAN Number *', border: OutlineInputBorder()),
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _nameOnCompanyPanController,
                decoration: const InputDecoration(labelText: 'Name on Company PAN *', border: OutlineInputBorder()),
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              InkWell(
                onTap: () => _selectDate(context, _dateOfIncorporationController),
                child: IgnorePointer(
                  child: TextFormField(
                    controller: _dateOfIncorporationController,
                    decoration: const InputDecoration(labelText: 'Date of Incorporation *', border: OutlineInputBorder(), suffixIcon: Icon(Icons.calendar_today)),
                    validator: (v) => v!.isEmpty ? 'Required' : null,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _gstinController,
                decoration: const InputDecoration(labelText: 'GSTIN *', border: OutlineInputBorder()),
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _companyMobileNumberController,
                decoration: const InputDecoration(labelText: 'Company Mobile Number *', border: OutlineInputBorder()),
                keyboardType: TextInputType.phone,
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _companyMailIdController,
                decoration: const InputDecoration(labelText: 'Company Mail ID *', border: OutlineInputBorder()),
                keyboardType: TextInputType.emailAddress,
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),

              _buildSectionHeader('4. Director Details'),
              SwitchListTile(
                title: Text('Include Director / Partner Details?', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                value: _hasDirectorDetails,
                onChanged: (v) => setState(() => _hasDirectorDetails = v),
                activeColor: AppTheme.corporateBlue,
                contentPadding: EdgeInsets.zero,
              ),
              if (_hasDirectorDetails) ...[
                const SizedBox(height: 12),
                TextFormField(
                  controller: _directorDinController,
                  decoration: const InputDecoration(labelText: 'DIN *', border: OutlineInputBorder()),
                  validator: (v) => v!.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _directorPanNameController,
                  decoration: const InputDecoration(labelText: 'Director 1 PAN Name *', border: OutlineInputBorder()),
                  validator: (v) => v!.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _directorPanNumberController,
                  decoration: const InputDecoration(labelText: 'Director 1 PAN Number *', border: OutlineInputBorder()),
                  validator: (v) => v!.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                InkWell(
                  onTap: () => _selectDate(context, _directorPanDobController),
                  child: IgnorePointer(
                    child: TextFormField(
                      controller: _directorPanDobController,
                      decoration: const InputDecoration(labelText: 'Director 1 PAN DOB *', border: OutlineInputBorder(), suffixIcon: Icon(Icons.calendar_today)),
                      validator: (v) => v!.isEmpty ? 'Required' : null,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _directorFatherNameController,
                  decoration: const InputDecoration(labelText: 'Father Name *', border: OutlineInputBorder()),
                  validator: (v) => v!.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _directorAddressController,
                  decoration: const InputDecoration(labelText: 'Address *', border: OutlineInputBorder()),
                  maxLines: 3,
                  validator: (v) => v!.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _directorPhoneNumberController,
                  decoration: const InputDecoration(labelText: 'Phone Number *', border: OutlineInputBorder()),
                  keyboardType: TextInputType.phone,
                  validator: (v) => v!.isEmpty ? 'Required' : null,
                ),

                _buildSectionHeader('5. Director Documents'),
                _buildFilePickerField(
                  'Director/Partner PAN Card',
                  _directorPanPath,
                  () => _pickFile((path) => _directorPanPath = path),
                  isRequired: true,
                ),
                _buildFilePickerField(
                  'Director/Partner Address Proof',
                  _directorAddressProofPath,
                  () => _pickFile((path) => _directorAddressProofPath = path),
                  isRequired: true,
                ),
              ],

              _buildSectionHeader('6. Bank Details'),
              TextFormField(
                controller: _bankAccountNumberController,
                decoration: const InputDecoration(labelText: 'Bank Account Number *', border: OutlineInputBorder()),
                keyboardType: TextInputType.number,
                obscureText: true,
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _bankAccountHolderNameController,
                decoration: const InputDecoration(labelText: 'Bank Account Holder Name *', border: OutlineInputBorder()),
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _ifscCodeController,
                decoration: const InputDecoration(labelText: 'IFSC Code *', border: OutlineInputBorder()),
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _bankNameController,
                decoration: const InputDecoration(labelText: 'Bank Name *', border: OutlineInputBorder()),
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),

              _buildSectionHeader('7. Bank Documents'),
              _buildFilePickerField(
                'Bank Account First Page',
                _bankAccountFirstPagePath,
                () => _pickFile((path) => _bankAccountFirstPagePath = path),
                isRequired: true,
              ),

              const SizedBox(height: 24),
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
                    : Text('Submit Details', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
