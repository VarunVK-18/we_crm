import 'package:crm_app/core/utils/error_handler.dart';
import 'package:crm_app/core/utils/hint_helper.dart';
import 'package:crm_app/core/utils/file_picker_util.dart';
import 'package:flutter/material.dart';
import '../../../core/widgets/app_dropdown.dart';
import 'package:dropdown_button2/dropdown_button2.dart';
import '../../../providers/draft_provider.dart';
import '../../../providers/entity_profile_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;

import '../../../core/constants/port.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/order_model.dart';
import '../../../providers/auth_provider.dart';
import 'package:crm_app/core/utils/form_ui_helper.dart';

class GstFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const GstFormScreen({super.key, required this.order});

  @override
  ConsumerState<GstFormScreen> createState() => _GstFormScreenState();
}

class _GstFormScreenState extends ConsumerState<GstFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // 1. Business Info
  final _legalNameController = TextEditingController();
  final _panOfBusinessController = TextEditingController();
  final _businessEmailController = TextEditingController();
  final _businessPhoneController = TextEditingController();
  final _tradeNameController = TextEditingController();
  final _incorpDateController = TextEditingController();
  String? _incorpCertPath;

  // 2. Dir 1 Info
  final _dir1FullNameController = TextEditingController();
  final _dir1FatherNameController = TextEditingController();
  final _dir1DobController = TextEditingController();
  final _dir1PhoneController = TextEditingController();
  final _dir1MailController = TextEditingController();
  String _dir1Gender = 'Male';
  final _dir1DinController = TextEditingController();
  final _dir1PanController = TextEditingController();
  final _dir1AddressController = TextEditingController();
  String _dir1AuthSignatory = 'No';

  // 3. Dir 1 Docs
  String? _dir1PhotoPath;
  String? _dir1AuthSignatoryDocPath;

  // 4. Dir 2
  String _hasDirector2 = 'No';
  final _dir2FullNameController = TextEditingController();
  final _dir2FatherNameController = TextEditingController();
  final _dir2DobController = TextEditingController();
  final _dir2PhoneController = TextEditingController();
  final _dir2MailController = TextEditingController();
  String _dir2Gender = 'Male';
  final _dir2DinController = TextEditingController();
  final _dir2PanController = TextEditingController();
  final _dir2AddressController = TextEditingController();
  String _dir2AuthSignatory = 'No';

  String? _dir2PhotoPath;
  String? _dir2AuthSignatoryDocPath;

  // 7. Business Details
  final _businessAddressController = TextEditingController();
  String _premisesType = 'Own';
  final _businessDescriptionController = TextEditingController();

  // 8. Business Docs
  String? _ebBillPath;
  String? _rentalAgreementPath;
  String? _propertyTaxReceiptPath;

  // 9. Additional Places
  String _hasAdditionalPlaces = 'No';
  final _secondPlaceAddressController = TextEditingController();
  final _thirdPlaceAddressController = TextEditingController();

  // 10. Company Docs
  String? _companyPanFilePath;

  // 11. Bank Details
  final _accountNumberController = TextEditingController();
  String _accountType = 'Current';
  final _ifscCodeController = TextEditingController();

  final _accountTypeOptions = ['Current', 'Savings', 'Cash Credit', 'Overdraft'];

  // 12. Bank Docs
  String? _bankDocumentPath;

  // 13. Declaration
  bool _isDeclared = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) { _autoFillFromProfile(); });
    _loadDraft();
  }

  @override
  void dispose() {
    _legalNameController.dispose();
    _panOfBusinessController.dispose();
    _businessEmailController.dispose();
    _businessPhoneController.dispose();
    _tradeNameController.dispose();
    _incorpDateController.dispose();
    
    _dir1FullNameController.dispose();
    _dir1FatherNameController.dispose();
    _dir1DobController.dispose();
    _dir1PhoneController.dispose();
    _dir1MailController.dispose();
    _dir1DinController.dispose();
    _dir1PanController.dispose();
    _dir1AddressController.dispose();

    _dir2FullNameController.dispose();
    _dir2FatherNameController.dispose();
    _dir2DobController.dispose();
    _dir2PhoneController.dispose();
    _dir2MailController.dispose();
    _dir2DinController.dispose();
    _dir2PanController.dispose();
    _dir2AddressController.dispose();

    _businessAddressController.dispose();
    _businessDescriptionController.dispose();
    
    _secondPlaceAddressController.dispose();
    _thirdPlaceAddressController.dispose();

    _accountNumberController.dispose();
    _ifscCodeController.dispose();

    super.dispose();
  }

  Future<void> _pickFile(Function(String) onPicked, {bool isPhoto = false}) async {
    FilePickerResult? result = await FilePickerUtil.pickFiles(
      type: isPhoto ? FileType.image : FileType.custom,
      allowedExtensions: isPhoto ? null : ['pdf', 'jpg', 'jpeg', 'png'],
    );
    if (result != null && result.files.single.path != null) {
      final maxSize = isPhoto ? 1 * 1024 * 1024 : 2 * 1024 * 1024;
      final errSize = isPhoto ? '1 MB' : '2 MB';

      if (result.files.single.size > maxSize) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Upload a file less than or equal to $errSize.'),
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
    final draft = await draftService.loadDraft(widget.order.id, 'GstFormScreen');
    if (draft != null && mounted) {
      setState(() {
        if (draft.containsKey('legalName')) _legalNameController.text = draft['legalName'];
        if (draft.containsKey('panOfBusiness')) _panOfBusinessController.text = draft['panOfBusiness'];
        if (draft.containsKey('businessEmail')) _businessEmailController.text = draft['businessEmail'];
        if (draft.containsKey('businessPhone')) _businessPhoneController.text = draft['businessPhone'];
        if (draft.containsKey('tradeName')) _tradeNameController.text = draft['tradeName'];
        if (draft.containsKey('incorpDate')) _incorpDateController.text = draft['incorpDate'];

        if (draft.containsKey('dir1FullName')) _dir1FullNameController.text = draft['dir1FullName'];
        if (draft.containsKey('dir1FatherName')) _dir1FatherNameController.text = draft['dir1FatherName'];
        if (draft.containsKey('dir1Dob')) _dir1DobController.text = draft['dir1Dob'];
        if (draft.containsKey('dir1Phone')) _dir1PhoneController.text = draft['dir1Phone'];
        if (draft.containsKey('dir1Mail')) _dir1MailController.text = draft['dir1Mail'];
        if (draft.containsKey('dir1Gender')) _dir1Gender = draft['dir1Gender'];
        if (draft.containsKey('dir1Din')) _dir1DinController.text = draft['dir1Din'];
        if (draft.containsKey('dir1Pan')) _dir1PanController.text = draft['dir1Pan'];
        if (draft.containsKey('dir1Address')) _dir1AddressController.text = draft['dir1Address'];
        if (draft.containsKey('dir1AuthSignatory')) _dir1AuthSignatory = draft['dir1AuthSignatory'];

        if (draft.containsKey('hasDirector2')) _hasDirector2 = draft['hasDirector2'];
        if (draft.containsKey('dir2FullName')) _dir2FullNameController.text = draft['dir2FullName'];
        if (draft.containsKey('dir2FatherName')) _dir2FatherNameController.text = draft['dir2FatherName'];
        if (draft.containsKey('dir2Dob')) _dir2DobController.text = draft['dir2Dob'];
        if (draft.containsKey('dir2Phone')) _dir2PhoneController.text = draft['dir2Phone'];
        if (draft.containsKey('dir2Mail')) _dir2MailController.text = draft['dir2Mail'];
        if (draft.containsKey('dir2Gender')) _dir2Gender = draft['dir2Gender'];
        if (draft.containsKey('dir2Din')) _dir2DinController.text = draft['dir2Din'];
        if (draft.containsKey('dir2Pan')) _dir2PanController.text = draft['dir2Pan'];
        if (draft.containsKey('dir2Address')) _dir2AddressController.text = draft['dir2Address'];
        if (draft.containsKey('dir2AuthSignatory')) _dir2AuthSignatory = draft['dir2AuthSignatory'];

        if (draft.containsKey('businessAddress')) _businessAddressController.text = draft['businessAddress'];
        if (draft.containsKey('premisesType')) _premisesType = draft['premisesType'];
        if (draft.containsKey('businessDescription')) _businessDescriptionController.text = draft['businessDescription'];

        if (draft.containsKey('hasAdditionalPlaces')) _hasAdditionalPlaces = draft['hasAdditionalPlaces'];
        if (draft.containsKey('secondPlaceAddress')) _secondPlaceAddressController.text = draft['secondPlaceAddress'];
        if (draft.containsKey('thirdPlaceAddress')) _thirdPlaceAddressController.text = draft['thirdPlaceAddress'];

        if (draft.containsKey('accountNumber')) _accountNumberController.text = draft['accountNumber'];
        if (draft.containsKey('accountType')) _accountType = draft['accountType'];
        if (draft.containsKey('ifscCode')) _ifscCodeController.text = draft['ifscCode'];

        // File paths (optional logic for caching locally if needed, but omitted for simplicity as paths expire)
      });
    }
  }

  Future<void> _saveDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final data = <String, dynamic>{
      'legalName': _legalNameController.text,
      'panOfBusiness': _panOfBusinessController.text,
      'businessEmail': _businessEmailController.text,
      'businessPhone': _businessPhoneController.text,
      'tradeName': _tradeNameController.text,
      'incorpDate': _incorpDateController.text,
      
      'dir1FullName': _dir1FullNameController.text,
      'dir1FatherName': _dir1FatherNameController.text,
      'dir1Dob': _dir1DobController.text,
      'dir1Phone': _dir1PhoneController.text,
      'dir1Mail': _dir1MailController.text,
      'dir1Gender': _dir1Gender,
      'dir1Din': _dir1DinController.text,
      'dir1Pan': _dir1PanController.text,
      'dir1Address': _dir1AddressController.text,
      'dir1AuthSignatory': _dir1AuthSignatory,

      'hasDirector2': _hasDirector2,
      'dir2FullName': _dir2FullNameController.text,
      'dir2FatherName': _dir2FatherNameController.text,
      'dir2Dob': _dir2DobController.text,
      'dir2Phone': _dir2PhoneController.text,
      'dir2Mail': _dir2MailController.text,
      'dir2Gender': _dir2Gender,
      'dir2Din': _dir2DinController.text,
      'dir2Pan': _dir2PanController.text,
      'dir2Address': _dir2AddressController.text,
      'dir2AuthSignatory': _dir2AuthSignatory,

      'businessAddress': _businessAddressController.text,
      'premisesType': _premisesType,
      'businessDescription': _businessDescriptionController.text,

      'hasAdditionalPlaces': _hasAdditionalPlaces,
      'secondPlaceAddress': _secondPlaceAddressController.text,
      'thirdPlaceAddress': _thirdPlaceAddressController.text,

      'accountNumber': _accountNumberController.text,
      'accountType': _accountType,
      'ifscCode': _ifscCodeController.text,
    };
    await draftService.saveDraft(widget.order.id, 'GstFormScreen', data);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Draft saved successfully!'),
        backgroundColor: AppTheme.deepTeal,
      ));
    }
  }

  Future<void> _submitDetails() async {
    if (!_formKey.currentState!.validate()) {
      _showError('Please fill all required fields correctly.');
      return;
    }

    if (_hasDirector2 == 'Yes') {
      if (_dir2FullNameController.text.isEmpty || _dir2PanController.text.isEmpty) {
        _showError('Please fill Director 2 required fields.');
        return;
      }
    }

    if (_hasAdditionalPlaces == 'Yes' && _secondPlaceAddressController.text.isEmpty) {
      _showError('Please fill Second Place of Business Address.');
      return;
    }

    if (_incorpCertPath == null) { _showError("Please upload Incorporation Certificate."); return; }
    if (_companyPanFilePath == null) { _showError("Please upload Company PAN."); return; }
    if (_dir1PhotoPath == null) { _showError("Please upload Director 1 Photo."); return; }
    if (_dir1AuthSignatory == 'Yes' && _dir1AuthSignatoryDocPath == null) { _showError("Please upload Director 1 Authorized Signatory Proof."); return; }
    
    if (_hasDirector2 == 'Yes') {
      if (_dir2PhotoPath == null) { _showError("Please upload Director 2 Photo."); return; }
      if (_dir2AuthSignatory == 'Yes' && _dir2AuthSignatoryDocPath == null) { _showError("Please upload Director 2 Authorized Signatory Proof."); return; }
    }

    if (_ebBillPath == null) { _showError("Please upload Latest EB Bill."); return; }
    if (_premisesType == 'Rent' && _rentalAgreementPath == null) { _showError("Please upload Rental Agreement."); return; }
    if (_premisesType == 'Own' && _propertyTaxReceiptPath == null) { _showError("Please upload Property Tax Receipt."); return; }
    if (_bankDocumentPath == null) { _showError("Please upload Bank Document."); return; }

    if (!_isDeclared) {
      _showError("Please check the declaration checkbox.");
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');

      final uri = Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-gst-form');
      var request = http.MultipartRequest('POST', uri);
      request.headers['x-user-id'] = uid;

      request.fields['legalName'] = _legalNameController.text;
      request.fields['panOfBusiness'] = _panOfBusinessController.text;
      request.fields['businessEmail'] = _businessEmailController.text;
      request.fields['businessPhone'] = _businessPhoneController.text;
      request.fields['tradeName'] = _tradeNameController.text;
      request.fields['incorpDate'] = _incorpDateController.text;

      request.fields['dir1FullName'] = _dir1FullNameController.text;
      request.fields['dir1FatherName'] = _dir1FatherNameController.text;
      request.fields['dir1Dob'] = _dir1DobController.text;
      request.fields['dir1Phone'] = _dir1PhoneController.text;
      request.fields['dir1Mail'] = _dir1MailController.text;
      request.fields['dir1Gender'] = _dir1Gender;
      request.fields['dir1Din'] = _dir1DinController.text;
      request.fields['dir1Pan'] = _dir1PanController.text;
      request.fields['dir1Address'] = _dir1AddressController.text;
      request.fields['dir1AuthSignatory'] = _dir1AuthSignatory;

      request.fields['hasDirector2'] = _hasDirector2;
      if (_hasDirector2 == 'Yes') {
        request.fields['dir2FullName'] = _dir2FullNameController.text;
        request.fields['dir2FatherName'] = _dir2FatherNameController.text;
        request.fields['dir2Dob'] = _dir2DobController.text;
        request.fields['dir2Phone'] = _dir2PhoneController.text;
        request.fields['dir2Mail'] = _dir2MailController.text;
        request.fields['dir2Gender'] = _dir2Gender;
        request.fields['dir2Din'] = _dir2DinController.text;
        request.fields['dir2Pan'] = _dir2PanController.text;
        request.fields['dir2Address'] = _dir2AddressController.text;
        request.fields['dir2AuthSignatory'] = _dir2AuthSignatory;
      }

      request.fields['businessAddress'] = _businessAddressController.text;
      request.fields['premisesType'] = _premisesType;
      request.fields['businessDescription'] = _businessDescriptionController.text;

      request.fields['hasAdditionalPlaces'] = _hasAdditionalPlaces;
      if (_hasAdditionalPlaces == 'Yes') {
        request.fields['secondPlaceAddress'] = _secondPlaceAddressController.text;
        request.fields['thirdPlaceAddress'] = _thirdPlaceAddressController.text;
      }

      request.fields['accountNumber'] = _accountNumberController.text;
      request.fields['accountType'] = _accountType;
      request.fields['ifscCode'] = _ifscCodeController.text;

      request.files.add(await http.MultipartFile.fromPath('incorpCert', _incorpCertPath!));
      request.files.add(await http.MultipartFile.fromPath('companyPanFile', _companyPanFilePath!));
      request.files.add(await http.MultipartFile.fromPath('dir1Photo', _dir1PhotoPath!));
      if (_dir1AuthSignatory == 'Yes') request.files.add(await http.MultipartFile.fromPath('dir1AuthSignatoryDoc', _dir1AuthSignatoryDocPath!));

      if (_hasDirector2 == 'Yes') {
        request.files.add(await http.MultipartFile.fromPath('dir2Photo', _dir2PhotoPath!));
        if (_dir2AuthSignatory == 'Yes') request.files.add(await http.MultipartFile.fromPath('dir2AuthSignatoryDoc', _dir2AuthSignatoryDocPath!));
      }

      request.files.add(await http.MultipartFile.fromPath('ebBill', _ebBillPath!));
      if (_premisesType == 'Rent') request.files.add(await http.MultipartFile.fromPath('rentalAgreement', _rentalAgreementPath!));
      if (_premisesType == 'Own') request.files.add(await http.MultipartFile.fromPath('propertyTaxReceipt', _propertyTaxReceiptPath!));
      request.files.add(await http.MultipartFile.fromPath('bankDocument', _bankDocumentPath!));

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        final uid = ref.read(authStateProvider).value?.uid;
        if (uid != null) {
          ref.read(entityCacheServiceProvider).saveTextFields(uid, {
            'entityName': _tradeNameController.text.isNotEmpty ? _tradeNameController.text : _legalNameController.text,
            'pan': _panOfBusinessController.text,
            'email': _businessEmailController.text,
            'phone': _businessPhoneController.text,
            'address': _businessAddressController.text,
            'directorName': _dir1FullNameController.text,
            'directorEmail': _dir1MailController.text,
            'directorPhone': _dir1PhoneController.text,
            'directorPan': _dir1PanController.text,
            'directorDin': _dir1DinController.text,
            'bankAccount': _accountNumberController.text,
            'bankIfsc': _ifscCodeController.text,
          });
          if (_incorpCertPath != null) {
            ref.read(entityCacheServiceProvider).uploadDocument(
              uid: uid,
              docKey: 'incorpCert',
              filePath: _incorpCertPath!,
              fileName: _incorpCertPath!.split('/').last.split('\\').last,
            );
          }
          if (_companyPanFilePath != null) {
            ref.read(entityCacheServiceProvider).uploadDocument(
              uid: uid,
              docKey: 'panCard',
              filePath: _companyPanFilePath!,
              fileName: _companyPanFilePath!.split('/').last.split('\\').last,
            );
          }
          if (_bankDocumentPath != null) {
            ref.read(entityCacheServiceProvider).uploadDocument(
              uid: uid,
              docKey: 'bank',
              filePath: _bankDocumentPath!,
              fileName: _bankDocumentPath!.split('/').last.split('\\').last,
            );
          }
        }
        if (!mounted) return;
        await showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Success'),
            content: const Text('Form submitted successfully!'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK')),
            ],
          ),
        );
        if (!mounted) return;
        ref.read(draftServiceProvider).clearDraft(widget.order.id, 'GstFormScreen');
        Navigator.pop(context, true);
      } else {
        throw Exception('Failed to submit form: ${response.body}');
      }
    } catch (e) {
      showGlobalError(e);
      if (mounted) _showError('Error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
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


  void _autoFillFromProfile() {
    final user = ref.read(userProfileProvider).value;
    if (user == null) return;
    setState(() {
      if (_businessEmailController.text.isEmpty && user.email.isNotEmpty) _businessEmailController.text = user.email;
      if (_businessPhoneController.text.isEmpty && user.phone.isNotEmpty) _businessPhoneController.text = user.phone;
    });
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(title: const Text('Complete Details', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w600, fontSize: 15)), backgroundColor: Colors.white, elevation: 0, iconTheme: const IconThemeData(color: Colors.black)),
        body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  Text('Complete Details', style: GoogleFonts.outfit(fontSize: 17, fontWeight: FontWeight.w500, color: AppTheme.corporateBlue)),
                  const SizedBox(height: 16),
                  
                  // 1. Business Info
                  _buildSectionContainer(title: 'Business Information', children: [
                    _buildField('Legal Name of Business', '', _legalNameController, isRequired: true),
                    _buildField('PAN of Business', '', _panOfBusinessController, isRequired: true),
                    _buildField('Business Email ID', '', _businessEmailController, isRequired: true, keyboardType: TextInputType.emailAddress),
                    PhoneInputField(
                        controller: _businessPhoneController,
                        label: 'Business Phone',
                        isRequired: true,
                      ),
                    _buildField('Trade Name (if Any)', '', _tradeNameController),
                    _buildField('Date of Incorporation', 'DD/MM/YYYY', _incorpDateController, isRequired: true, isDate: true),
                    _buildFileRow('Incorporation Certificate', 'PDF. Max 2 MB.', _incorpCertPath, () => _pickFile((path) => _incorpCertPath = path)),
                  ]),

                  // 2 & 3. Dir 1
                  _buildSectionContainer(title: 'Director 1 Personal Information', children: [
                    _buildField('Full Name (As per PAN)', '', _dir1FullNameController, isRequired: true),
                    _buildField('Father Name (As per PAN)', '', _dir1FatherNameController, isRequired: true),
                    _buildField('DOB', 'DD/MM/YYYY', _dir1DobController, isRequired: true, isDate: true),
                    PhoneInputField(
                        controller: _dir1PhoneController,
                        label: 'Phone Number',
                        isRequired: true,
                      ),
                    _buildField('Mail ID', '', _dir1MailController, isRequired: true, keyboardType: TextInputType.emailAddress),
                    _buildRadioGroup('Gender', '', ['Male', 'Female', 'Others'], _dir1Gender, (v) => setState(() => _dir1Gender = v)),
                    _buildField('DIN', '', _dir1DinController, isRequired: true),
                    _buildField('PAN Number', '', _dir1PanController, isRequired: true),
                    _buildField('Enter Full Residential Address', '', _dir1AddressController, isRequired: true, maxLines: 3),
                    _buildRadioGroup('Are you Authorized Signatory?', '', ['Yes', 'No'], _dir1AuthSignatory, (v) => setState(() => _dir1AuthSignatory = v)),
                    const Divider(),
                    _buildFileRow('Director Photo', 'Max 1 MB.', _dir1PhotoPath, () => _pickFile((path) => _dir1PhotoPath = path, isPhoto: true)),
                    if (_dir1AuthSignatory == 'Yes')
                      _buildFileRow('Authorized Signatory Proof', 'Max 2 MB.', _dir1AuthSignatoryDocPath, () => _pickFile((path) => _dir1AuthSignatoryDocPath = path)),
                  ]),

                  // Dir 2 Logic
                  _buildSectionContainer(title: 'Director 2', children: [
                    _buildRadioGroup('Do you want to add Director 2?', '', ['Yes', 'No'], _hasDirector2, (v) => setState(() => _hasDirector2 = v)),
                  ]),

                  if (_hasDirector2 == 'Yes')
                    _buildSectionContainer(title: 'Director 2 Personal Information', children: [
                      _buildField('Full Name (As per PAN)', '', _dir2FullNameController, isRequired: true),
                      _buildField('Father Name (As per PAN)', '', _dir2FatherNameController, isRequired: true),
                      _buildField('DOB', 'DD/MM/YYYY', _dir2DobController, isRequired: true, isDate: true),
                      PhoneInputField(
                        controller: _dir2PhoneController,
                        label: 'Phone Number',
                        isRequired: true,
                      ),
                      _buildField('Mail ID', '', _dir2MailController, isRequired: true, keyboardType: TextInputType.emailAddress),
                      _buildRadioGroup('Gender', '', ['Male', 'Female', 'Others'], _dir2Gender, (v) => setState(() => _dir2Gender = v)),
                      _buildField('DIN', '', _dir2DinController, isRequired: true),
                      _buildField('PAN Number', '', _dir2PanController, isRequired: true),
                      _buildField('Enter Full Residential Address', '', _dir2AddressController, isRequired: true, maxLines: 3),
                      _buildRadioGroup('Are you Authorized Signatory?', '', ['Yes', 'No'], _dir2AuthSignatory, (v) => setState(() => _dir2AuthSignatory = v)),
                      const Divider(),
                      _buildFileRow('Director Photo', 'Max 1 MB.', _dir2PhotoPath, () => _pickFile((path) => _dir2PhotoPath = path, isPhoto: true)),
                      if (_dir2AuthSignatory == 'Yes')
                        _buildFileRow('Authorized Signatory Proof', 'Max 2 MB.', _dir2AuthSignatoryDocPath, () => _pickFile((path) => _dir2AuthSignatoryDocPath = path)),
                    ]),

                  // 7. Business Details
                  _buildSectionContainer(title: 'Business Details', children: [
                    _buildField('Full Address with PIN Code', '', _businessAddressController, isRequired: true, maxLines: 3),
                    _buildRadioGroup('Premises Type', '', ['Own', 'Rent'], _premisesType, (v) => setState(() => _premisesType = v)),
                    _buildField('Explain Your Business Description', '', _businessDescriptionController, isRequired: true, maxLines: 2),
                  ]),

                  // 9. Additional Places
                  _buildSectionContainer(title: 'Additional Business Places', children: [
                    _buildRadioGroup('Do you have Additional Place of Business?', '', ['Yes', 'No'], _hasAdditionalPlaces, (v) => setState(() => _hasAdditionalPlaces = v)),
                    if (_hasAdditionalPlaces == 'Yes') ...[
                      _buildField('Second Place Address', '', _secondPlaceAddressController, isRequired: true, maxLines: 2),
                      _buildField('Third Place Address', 'Optional', _thirdPlaceAddressController, isRequired: false, maxLines: 2),
                    ]
                  ]),

                  // 8 & 10. Business & Company Docs
                  _buildSectionContainer(title: 'Business & Company Documents', children: [
                    _buildFileRow('Company PAN', 'Max 2 MB.', _companyPanFilePath, () => _pickFile((path) => _companyPanFilePath = path)),
                    _buildFileRow('Latest EB Bill', 'Max 2 MB.', _ebBillPath, () => _pickFile((path) => _ebBillPath = path)),
                    if (_premisesType == 'Rent')
                      _buildFileRow('Rental Agreement', 'Max 2 MB.', _rentalAgreementPath, () => _pickFile((path) => _rentalAgreementPath = path)),
                    if (_premisesType == 'Own')
                      _buildFileRow('Property Tax Receipt', 'Max 2 MB.', _propertyTaxReceiptPath, () => _pickFile((path) => _propertyTaxReceiptPath = path)),
                  ]),

                  // 11 & 12. Bank
                  _buildSectionContainer(title: 'Bank Details', children: [
                    _buildField('Bank Account Number', '', _accountNumberController, isRequired: true, keyboardType: TextInputType.number),
                    _buildDropdown('Type of Account', _accountTypeOptions, _accountType, (v) => setState(() => _accountType = v!)),
                    _buildField('Bank IFSC Code', '', _ifscCodeController, isRequired: true),
                    const Divider(),
                    _buildFileRow('Bank Document (Statement/Cheque/Passbook)', 'Max 2 MB.', _bankDocumentPath, () => _pickFile((path) => _bankDocumentPath = path)),
                  ]),

                  // 13. Declaration
                  _buildSectionContainer(title: 'Declaration', children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Checkbox(value: _isDeclared, activeColor: AppTheme.corporateBlue, onChanged: (val) => setState(() => _isDeclared = val ?? false)),
                        Expanded(child: Padding(padding: const EdgeInsets.only(top: 12.0), child: RichText(text: const TextSpan(text: 'I hereby declare that all information provided is true and correct to the best of my knowledge.', style: TextStyle(fontWeight: FontWeight.w500, fontSize: 13, color: AppTheme.deepTeal), children: [TextSpan(text: ' *\n', style: TextStyle(color: Colors.red))])))),
                      ],
                    ),
                  ]),

                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _submitDetails,
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.corporateBlue, minimumSize: const Size(double.infinity, 50), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    child: const Text('Submit Application', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
      ),
    );
  }

  Widget _buildDropdown(String label, List<String> options, String currentValue, void Function(String?) onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(text: TextSpan(text: label, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 12, color: AppTheme.deepTeal), children: const [TextSpan(text: ' *', style: TextStyle(color: Colors.red))])),
          const SizedBox(height: 8),
          AppDropdownFormField<String>(
            value: currentValue,
            items: options.map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 13)))).toList(),
            onChanged: onChanged,
            decoration: InputDecoration(border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)), contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12)),
          )
        ],
      ),
    );
  }

  Widget _buildSectionContainer({required String title, required List<Widget> children}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 32),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.blue.shade50.withOpacity(0.3), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.blue.shade100)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.deepTeal)),
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
          RichText(text: TextSpan(text: label, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 12, color: AppTheme.deepTeal), children: const [TextSpan(text: ' *', style: TextStyle(color: Colors.red))])),
          if (hint.isNotEmpty) ...[const SizedBox(height: 4), Text(hint, style: TextStyle(fontSize: 11, color: Colors.grey[500]))],
          const SizedBox(height: 12),
          ...options.map((opt) => InkWell(
            onTap: () => onChanged(opt),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  Radio<String>(value: opt, groupValue: currentValue, onChanged: (v) { if (v != null) onChanged(v); }, activeColor: AppTheme.corporateBlue, materialTapTargetSize: MaterialTapTargetSize.shrinkWrap),
                  const SizedBox(width: 8),
                  Expanded(child: Padding(padding: const EdgeInsets.only(top: 12.0), child: Text(opt, style: const TextStyle(fontSize: 13)))),
                ],
              ),
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildField(String label, String hint, TextEditingController controller, {bool isRequired = false, TextInputType keyboardType = TextInputType.text, int maxLines = 1, bool isDate = false}) {
    if (keyboardType == TextInputType.phone) {
      return PhoneInputField(
        controller: controller,
        label: label,
        isRequired: isRequired,
        hintText: hint,
        validator: null,
      );
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(text: TextSpan(text: label, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 12, color: AppTheme.deepTeal), children: [if (isRequired) const TextSpan(text: ' *', style: TextStyle(color: Colors.red))])),
          if (hint.isNotEmpty) ...[const SizedBox(height: 4), Text(hint, style: TextStyle(fontSize: 11, color: Colors.grey[500]))],
          const SizedBox(height: 8),
          TextFormField(
            controller: controller,
            keyboardType: keyboardType,
            readOnly: isDate,
            onTap: isDate ? () async {
              final date = await showCustomDatePicker(context);
              if (date != null) controller.text = "${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}";
            } : null,
            maxLines: maxLines,
            decoration: InputDecoration(hintText: hint.isNotEmpty ? hint : "Enter ${label.replaceAll('*', '').trim()}", hintStyle: const TextStyle(fontSize: 13, color: Colors.grey), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)), focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.black, width: 1.5)), contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12), suffixIcon: isDate ? const Icon(Icons.calendar_today, size: 20, color: Colors.grey) : null),
            autovalidateMode: AutovalidateMode.onUserInteraction,
            validator: (v) {
              if (isRequired && (v == null || v.trim().isEmpty)) return 'This is a required question';
              if (v != null && v.trim().isNotEmpty) {
                final labelLower = label.toLowerCase();
                if ((labelLower.contains('phone') || labelLower.contains('mobile')) && !RegExp(r'^[0-9]{10}$').hasMatch(v.trim())) return 'Enter a valid 10-digit phone number';
                if (labelLower.contains('mail') && !RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(v.trim())) return 'Enter a valid email address';
                if (labelLower.contains('pan') && !RegExp(r'^[a-zA-Z]{5}[0-9]{4}[a-zA-Z]{1}$').hasMatch(v.trim())) return 'Enter a valid PAN';
              }
              return null;
            },
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
          RichText(text: TextSpan(text: label, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 12, color: AppTheme.deepTeal), children: const [TextSpan(text: ' *', style: TextStyle(color: Colors.red))])),
          if (hint.isNotEmpty) ...[const SizedBox(height: 4), Text(hint, style: TextStyle(fontSize: 11, color: Colors.grey[500]))],
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(child: Text(path == null ? 'No file chosen' : path.split('/').last, style: TextStyle(fontSize: 13, color: path == null ? Colors.grey[500] : AppTheme.corporateBlue), overflow: TextOverflow.ellipsis)),
              const SizedBox(width: 8),
              OutlinedButton(onPressed: onPick, style: OutlinedButton.styleFrom(side: BorderSide(color: path == null ? Colors.grey[400]! : AppTheme.corporateBlue), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))), child: Text(path == null ? 'Upload' : 'Change', style: TextStyle(color: path == null ? Colors.black87 : AppTheme.corporateBlue))),
            ],
          ),
        ],
      ),
    );
  }
}