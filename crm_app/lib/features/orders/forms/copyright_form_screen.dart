import 'package:crm_app/core/utils/error_handler.dart';
import 'package:crm_app/core/utils/file_picker_util.dart';
import 'package:flutter/material.dart';
import '../../../../providers/draft_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;
import 'package:crm_app/core/utils/validation_utils.dart';
import 'package:dropdown_button2/dropdown_button2.dart';

import '../../../../core/constants/port.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../models/order_model.dart';
import '../../../../providers/auth_provider.dart';

class CopyrightFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const CopyrightFormScreen({super.key, required this.order});

  @override
  ConsumerState<CopyrightFormScreen> createState() => _CopyrightFormScreenState();
}

class _CopyrightFormScreenState extends ConsumerState<CopyrightFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // 1. Applicant Details
  final _applicantNameController = TextEditingController();
  final _applicantEmailController = TextEditingController();
  final _applicantPhoneController = TextEditingController();
  final _applicantAddressController = TextEditingController();

  // 2. Work Details
  final _workTitleController = TextEditingController();
  String _workType = 'Literary / Dramatic';
  final List<String> _workTypeOptions = [
    'Literary / Dramatic',
    'Musical',
    'Artistic',
    'Cinematograph Film',
    'Sound Recording',
    'Computer Software / IT',
  ];
  final _languageController = TextEditingController();
  final _workDescriptionController = TextEditingController();

  // 3. Author Details
  String _isApplicantAuthor = 'Yes';
  final _authorNameController = TextEditingController();
  final _authorAddressController = TextEditingController();

  // 4. Files
  String? _copyOfWorkPath;
  String? _nocFromAuthorPath;
  String? _nocFromPublisherPath;
  String? _incorporationCertPath;
  String? _boardResolutionPath;
  String? _idProofPath;

  // 5. Declaration
  bool _declaration = false;

  @override
  void initState() {
    super.initState();
    // Auto-fill from user profile
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _autoFillFromProfile();
      _loadDraft();
    });
  }

  void _autoFillFromProfile() {
    final user = ref.read(userProfileProvider).value;
    if (user == null) return;

    if (_applicantNameController.text.isEmpty && user.name.isNotEmpty) {
      _applicantNameController.text = user.name;
    }
    if (_applicantEmailController.text.isEmpty && user.email.isNotEmpty) {
      _applicantEmailController.text = user.email;
    }
    if (_applicantPhoneController.text.isEmpty && user.phone.isNotEmpty) {
      _applicantPhoneController.text = user.phone;
    }
  }

  @override
  void dispose() {
    _applicantNameController.dispose();
    _applicantEmailController.dispose();
    _applicantPhoneController.dispose();
    _applicantAddressController.dispose();
    _workTitleController.dispose();
    _languageController.dispose();
    _workDescriptionController.dispose();
    _authorNameController.dispose();
    _authorAddressController.dispose();
    super.dispose();
  }

  Future<void> _loadDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final draft = await draftService.loadDraft(widget.order.id, 'CopyrightFormScreen');
    if (draft != null && mounted) {
      setState(() {
        if (draft.containsKey('applicantName')) _applicantNameController.text = draft['applicantName'];
        if (draft.containsKey('applicantEmail')) _applicantEmailController.text = draft['applicantEmail'];
        if (draft.containsKey('applicantPhone')) _applicantPhoneController.text = draft['applicantPhone'];
        if (draft.containsKey('applicantAddress')) _applicantAddressController.text = draft['applicantAddress'];
        if (draft.containsKey('workTitle')) _workTitleController.text = draft['workTitle'];
        if (draft.containsKey('workType')) _workType = draft['workType'];
        if (draft.containsKey('language')) _languageController.text = draft['language'];
        if (draft.containsKey('workDescription')) _workDescriptionController.text = draft['workDescription'];
        if (draft.containsKey('isApplicantAuthor')) _isApplicantAuthor = draft['isApplicantAuthor'];
        if (draft.containsKey('authorName')) _authorNameController.text = draft['authorName'];
        if (draft.containsKey('authorAddress')) _authorAddressController.text = draft['authorAddress'];
        if (draft.containsKey('declaration')) {
          final val = draft['declaration'];
          _declaration = val is bool ? val : val == 'true';
        }
        if (draft.containsKey('copyOfWorkPath')) _copyOfWorkPath = draft['copyOfWorkPath'];
        if (draft.containsKey('nocFromAuthorPath')) _nocFromAuthorPath = draft['nocFromAuthorPath'];
        if (draft.containsKey('nocFromPublisherPath')) _nocFromPublisherPath = draft['nocFromPublisherPath'];
        if (draft.containsKey('incorporationCertPath')) _incorporationCertPath = draft['incorporationCertPath'];
        if (draft.containsKey('boardResolutionPath')) _boardResolutionPath = draft['boardResolutionPath'];
        if (draft.containsKey('idProofPath')) _idProofPath = draft['idProofPath'];
      });
    }
  }

  Future<void> _saveDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final data = <String, dynamic>{
      'applicantName': _applicantNameController.text,
      'applicantEmail': _applicantEmailController.text,
      'applicantPhone': _applicantPhoneController.text,
      'applicantAddress': _applicantAddressController.text,
      'workTitle': _workTitleController.text,
      'workType': _workType,
      'language': _languageController.text,
      'workDescription': _workDescriptionController.text,
      'isApplicantAuthor': _isApplicantAuthor,
      'authorName': _authorNameController.text,
      'authorAddress': _authorAddressController.text,
      'declaration': _declaration.toString(),
      'copyOfWorkPath': _copyOfWorkPath,
      'nocFromAuthorPath': _nocFromAuthorPath,
      'nocFromPublisherPath': _nocFromPublisherPath,
      'incorporationCertPath': _incorporationCertPath,
      'boardResolutionPath': _boardResolutionPath,
      'idProofPath': _idProofPath,
    };
    await draftService.saveDraft(widget.order.id, 'CopyrightFormScreen', data);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Draft saved successfully!'),
        backgroundColor: AppTheme.deepTeal,
      ));
    }
  }

  Future<void> _pickFile(String field) async {
    FilePickerResult? result = await FilePickerUtil.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'mp3', 'mp4', 'zip'],
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
          case 'copyOfWork': _copyOfWorkPath = path; break;
          case 'nocFromAuthor': _nocFromAuthorPath = path; break;
          case 'nocFromPublisher': _nocFromPublisherPath = path; break;
          case 'incorporationCert': _incorporationCertPath = path; break;
          case 'boardResolution': _boardResolutionPath = path; break;
          case 'idProof': _idProofPath = path; break;
        }
      });
    }
  }

  Future<bool> _onWillPop() async {
    final shouldPop = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
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
        );
      },
    );
    return shouldPop ?? false;
  }

  Future<void> _submitDetails() async {
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please fill all required fields.'),
        backgroundColor: Colors.red,
      ));
      return;
    }

    if (_copyOfWorkPath == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please upload a copy of the work.'),
        backgroundColor: Colors.red,
      ));
      return;
    }

    if (_isApplicantAuthor == 'No' &&
        (_authorNameController.text.trim().isEmpty || _authorAddressController.text.trim().isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please provide author details since applicant is not the author.'),
        backgroundColor: Colors.red,
      ));
      return;
    }

    if (!_declaration) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please accept the declaration at the bottom.'),
        backgroundColor: Colors.red,
      ));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');

      final uri = Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-copyright-form');
      var request = http.MultipartRequest('POST', uri);
      request.headers['x-user-id'] = uid;

      // Text fields
      request.fields['applicantName'] = _applicantNameController.text;
      request.fields['applicantEmail'] = _applicantEmailController.text;
      request.fields['applicantPhone'] = _applicantPhoneController.text;
      request.fields['applicantAddress'] = _applicantAddressController.text;
      request.fields['workTitle'] = _workTitleController.text;
      request.fields['workType'] = _workType;
      request.fields['language'] = _languageController.text;
      request.fields['workDescription'] = _workDescriptionController.text;
      request.fields['isApplicantAuthor'] = _isApplicantAuthor;
      request.fields['authorName'] = _authorNameController.text;
      request.fields['authorAddress'] = _authorAddressController.text;
      request.fields['declaration'] = _declaration.toString();

      // Files
      if (_copyOfWorkPath != null) request.files.add(await http.MultipartFile.fromPath('copyOfWork', _copyOfWorkPath!));
      if (_nocFromAuthorPath != null) request.files.add(await http.MultipartFile.fromPath('nocFromAuthor', _nocFromAuthorPath!));
      if (_nocFromPublisherPath != null) request.files.add(await http.MultipartFile.fromPath('nocFromPublisher', _nocFromPublisherPath!));
      if (_incorporationCertPath != null) request.files.add(await http.MultipartFile.fromPath('incorporationCertificate', _incorporationCertPath!));
      if (_boardResolutionPath != null) request.files.add(await http.MultipartFile.fromPath('boardResolution', _boardResolutionPath!));
      if (_idProofPath != null) request.files.add(await http.MultipartFile.fromPath('idProof', _idProofPath!));

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (!mounted) return;
        await showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Success'),
            content: const Text('Copyright form submitted successfully!'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('OK'),
              ),
            ],
          ),
        );
        if (!mounted) return;
        ref.read(draftServiceProvider).clearDraft(widget.order.id, 'CopyrightFormScreen');
        Navigator.pop(context, true);
      } else {
        throw Exception('Failed to submit form: ${response.body}');
      }
    } catch (e) {
      showGlobalError(e);
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
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          title: const Text('Copyright Registration',
              style: TextStyle(color: Colors.black, fontWeight: FontWeight.w800, fontSize: 16)),
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
                    Text('Copyright Registration Form',
                        style: GoogleFonts.outfit(
                            fontSize: 22, fontWeight: FontWeight.w600, color: AppTheme.corporateBlue)),
                    const SizedBox(height: 6),
                    Text('Provide details for your Copyright registration',
                        style: GoogleFonts.outfit(fontSize: 13, color: Colors.grey[600])),
                    const SizedBox(height: 24),

                    // --- Section 1: Applicant Details ---
                    _buildSectionCard('1. Applicant Details', [
                      _buildField('Applicant Name', '', _applicantNameController, isRequired: true),
                      _buildField('Applicant Email', '', _applicantEmailController,
                          isRequired: true,
                          keyboardType: TextInputType.emailAddress,
                          validator: (v) => ValidationUtils.isValidEmail(v) ? null : 'Enter a valid email'),
                      _buildField('Applicant Phone Number', '10 digits', _applicantPhoneController,
                          isRequired: true,
                          keyboardType: TextInputType.phone,
                          validator: (v) => ValidationUtils.isValidPhone(v) ? null : 'Enter a valid 10-digit phone number'),
                      _buildField('Applicant Address', '', _applicantAddressController, isRequired: true),
                    ]),

                    // --- Section 2: Work Details ---
                    _buildSectionCard('2. Details of the Work', [
                      _buildField('Title of the Work', '', _workTitleController, isRequired: true),
                      _buildDropdown('Type of Work', _workTypeOptions, _workType, (v) => setState(() => _workType = v!)),
                      _buildField('Language of the Work', '', _languageController, isRequired: true),
                      _buildField('Brief Description of the Work', '', _workDescriptionController, isRequired: true, maxLines: 3),
                    ]),

                    // --- Section 3: Author Details ---
                    _buildSectionCard('3. Author Details', [
                      _buildDropdown(
                        'Is the Applicant the Author of the work?',
                        ['Yes', 'No'],
                        _isApplicantAuthor,
                        (v) => setState(() => _isApplicantAuthor = v!),
                      ),
                      if (_isApplicantAuthor == 'No') ...[
                        _buildField('Author Name', '', _authorNameController, isRequired: true),
                        _buildField('Author Address', '', _authorAddressController, isRequired: true),
                      ],
                    ]),

                    // --- Section 4: Documents ---
                    _buildSectionCard('4. Document Uploads', [
                      _buildFileRow('Copy of the Work', 'Required. Max 2 MB.', _copyOfWorkPath,
                          () => _pickFile('copyOfWork'), isRequired: true),
                      _buildFileRow('NOC from Author', 'Optional — upload if applicant is not the author.',
                          _nocFromAuthorPath, () => _pickFile('nocFromAuthor'), isRequired: false),
                      _buildFileRow('NOC from Publisher', 'Optional.', _nocFromPublisherPath,
                          () => _pickFile('nocFromPublisher'), isRequired: false),
                      _buildFileRow('Incorporation Certificate (If Company)', 'Optional.',
                          _incorporationCertPath, () => _pickFile('incorporationCert'), isRequired: false),
                      _buildFileRow('Board Resolution (If Company)', 'Optional.',
                          _boardResolutionPath, () => _pickFile('boardResolution'), isRequired: false),
                      _buildFileRow('ID Proof', 'Optional.', _idProofPath,
                          () => _pickFile('idProof'), isRequired: false),
                    ]),

                    // --- Section 5: Declaration ---
                    Container(
                      margin: const EdgeInsets.only(bottom: 24),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.blue.shade100),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('5. Declaration',
                              style: GoogleFonts.outfit(
                                  fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.deepTeal)),
                          const SizedBox(height: 12),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Checkbox(
                                value: _declaration,
                                activeColor: AppTheme.corporateBlue,
                                onChanged: (val) => setState(() => _declaration = val ?? false),
                              ),
                              const Expanded(
                                child: Padding(
                                  padding: EdgeInsets.only(top: 12.0),
                                  child: Text(
                                    'I hereby declare that the work is original and all information provided is true and correct.',
                                    style: TextStyle(fontSize: 13, color: Colors.black87, height: 1.4),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: _submitDetails,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.corporateBlue,
                        minimumSize: const Size(double.infinity, 50),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Submit Application',
                          style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildSectionCard(String title, List<Widget> children) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.shade50.withOpacity(0.3),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.blue.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: GoogleFonts.outfit(
                  fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.deepTeal)),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }

  Widget _buildDropdown(String label, List<String> options, String current, ValueChanged<String?> onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: label,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.deepTeal),
              children: const [TextSpan(text: ' *', style: TextStyle(color: Colors.red))],
            ),
          ),
          const SizedBox(height: 8),
          DropdownButton2<String>(
            isExpanded: true,
            underline: const SizedBox(),
            valueListenable: ValueNotifier<String?>(current),
            onChanged: onChanged,
            buttonStyleData: ButtonStyleData(
              height: 48,
              padding: const EdgeInsets.only(left: 16, right: 8),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade400),
                borderRadius: BorderRadius.circular(12),
                color: Colors.white,
              ),
            ),
            dropdownStyleData: DropdownStyleData(
              decoration: BoxDecoration(borderRadius: BorderRadius.circular(12)),
            ),
            items: options.map((o) => DropdownItem<String>(value: o, child: Text(o, style: const TextStyle(fontSize: 14)))).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildField(String label, String hint, TextEditingController controller,
      {bool isRequired = false,
      TextInputType keyboardType = TextInputType.text,
      int maxLines = 1,
      String? Function(String?)? validator}) {
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
                if (isRequired) const TextSpan(text: ' *', style: TextStyle(color: Colors.red)),
              ],
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
            maxLines: maxLines,
            decoration: InputDecoration(
              hintText: hint.isNotEmpty ? hint : 'Enter ${label.replaceAll('*', '').trim()}',
              hintStyle: const TextStyle(fontSize: 13, color: Colors.grey, fontWeight: FontWeight.normal),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.black, width: 1.5)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            validator: validator ?? (isRequired ? (v) => v == null || v.trim().isEmpty ? 'This is a required question' : null : null),
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
                if (isRequired) const TextSpan(text: ' *', style: TextStyle(color: Colors.red)),
              ],
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
                  path == null ? 'No file chosen' : path.split('/').last,
                  style: TextStyle(
                      fontSize: 13, color: path == null ? Colors.grey[500] : AppTheme.corporateBlue),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: onPick,
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: path == null ? Colors.grey[400]! : AppTheme.corporateBlue),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  minimumSize: const Size(80, 32),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                ),
                child: Text(path == null ? 'Upload' : 'Change',
                    style: TextStyle(color: path == null ? Colors.black87 : AppTheme.corporateBlue)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
