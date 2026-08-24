import 'package:flutter/material.dart';
import 'package:crm_app/core/utils/hint_helper.dart';
import 'package:dropdown_button2/dropdown_button2.dart';
import '../../../providers/draft_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;

import '../../../core/constants/port.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/order_model.dart';
import '../../../providers/auth_provider.dart';
import 'package:crm_app/core/utils/error_handler.dart';
import 'package:crm_app/core/utils/file_picker_util.dart';
import 'package:crm_app/core/utils/form_ui_helper.dart';

class CeRohsFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const CeRohsFormScreen({super.key, required this.order});

  @override
  ConsumerState<CeRohsFormScreen> createState() => _CeRohsFormScreenState();
}

class _CeRohsFormScreenState extends ConsumerState<CeRohsFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Text Fields
  final _productNameController = TextEditingController();
  final _modelNumberController = TextEditingController();
  final _manufacturerNameController = TextEditingController();
  final _companyAddressController = TextEditingController();
  final _contactPersonController = TextEditingController();
  final _emailController = TextEditingController();
  final _whatsappController = TextEditingController();
  final _courierAddressController = TextEditingController();
  final _productSpecsController = TextEditingController();
  
  String? _certificationType;
  final List<String> _certificationTypes = ['CE Certification', 'RoHS Certification', 'CE & RoHS'];

  // Document Uploads
  String? _productDatasheetPath;
  String? _userManualPath;
  String? _circuitDiagramPath;
  String? _bomPath;
  String? _testReportsPath;
  String? _productImagesPath;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) { _autoFillFromProfile(); });
    _loadDraft();
  }

  @override
  void dispose() {
    _productNameController.dispose();
    _modelNumberController.dispose();
    _manufacturerNameController.dispose();
    _companyAddressController.dispose();
    _contactPersonController.dispose();
    _emailController.dispose();
    _whatsappController.dispose();
    _courierAddressController.dispose();
    _productSpecsController.dispose();
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

  Future<void> _loadDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final draft = await draftService.loadDraft(widget.order.id, 'CeRohsFormScreen');
    if (draft != null) {
      if (mounted) {
        setState(() {
          if (draft.containsKey('productName')) _productNameController.text = draft['productName'];
          if (draft.containsKey('modelNumber')) _modelNumberController.text = draft['modelNumber'];
          if (draft.containsKey('manufacturerName')) _manufacturerNameController.text = draft['manufacturerName'];
          if (draft.containsKey('companyAddress')) _companyAddressController.text = draft['companyAddress'];
          if (draft.containsKey('contactPerson')) _contactPersonController.text = draft['contactPerson'];
          if (draft.containsKey('email')) _emailController.text = draft['email'];
          if (draft.containsKey('whatsapp')) _whatsappController.text = draft['whatsapp'];
          if (draft.containsKey('courierAddress')) _courierAddressController.text = draft['courierAddress'];
          if (draft.containsKey('productSpecs')) _productSpecsController.text = draft['productSpecs'];
          if (draft.containsKey('certificationType')) _certificationType = draft['certificationType'];

          if (draft.containsKey('productDatasheetPath')) _productDatasheetPath = draft['productDatasheetPath'];
          if (draft.containsKey('userManualPath')) _userManualPath = draft['userManualPath'];
          if (draft.containsKey('circuitDiagramPath')) _circuitDiagramPath = draft['circuitDiagramPath'];
          if (draft.containsKey('bomPath')) _bomPath = draft['bomPath'];
          if (draft.containsKey('testReportsPath')) _testReportsPath = draft['testReportsPath'];
          if (draft.containsKey('productImagesPath')) _productImagesPath = draft['productImagesPath'];
        });
      }
    }
  }

  Future<void> _saveDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final data = <String, dynamic>{
      'productName': _productNameController.text,
      'modelNumber': _modelNumberController.text,
      'manufacturerName': _manufacturerNameController.text,
      'companyAddress': _companyAddressController.text,
      'contactPerson': _contactPersonController.text,
      'email': _emailController.text,
      'whatsapp': _whatsappController.text,
      'courierAddress': _courierAddressController.text,
      'productSpecs': _productSpecsController.text,
      'certificationType': _certificationType,
      'productDatasheetPath': _productDatasheetPath,
      'userManualPath': _userManualPath,
      'circuitDiagramPath': _circuitDiagramPath,
      'bomPath': _bomPath,
      'testReportsPath': _testReportsPath,
      'productImagesPath': _productImagesPath,
    };
    await draftService.saveDraft(widget.order.id, 'CeRohsFormScreen', data);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Draft saved successfully!'),
        backgroundColor: AppTheme.deepTeal,
      ));
    }
  }

  Future<void> _submitDetails() async {
    if (!_formKey.currentState!.validate() || _certificationType == null) {
      _showError('Please fill all required fields.');
      return;
    }

    if (_productDatasheetPath == null || _userManualPath == null || _bomPath == null || _productImagesPath == null) {
      _showError("Please upload all required documents (Datasheet, Manual, BOM, Images).");
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');

      final uri = Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-ce-rohs-form');
      var request = http.MultipartRequest('POST', uri);
      request.headers['x-user-id'] = uid;

      // Text fields
      request.fields['productName'] = _productNameController.text;
      request.fields['modelNumber'] = _modelNumberController.text;
      request.fields['manufacturerName'] = _manufacturerNameController.text;
      request.fields['companyAddress'] = _companyAddressController.text;
      request.fields['contactPerson'] = _contactPersonController.text;
      request.fields['email'] = _emailController.text;
      request.fields['whatsapp'] = _whatsappController.text;
      request.fields['courierAddress'] = _courierAddressController.text;
      request.fields['productSpecs'] = _productSpecsController.text;
      request.fields['certificationType'] = _certificationType!;

      // Files
      request.files.add(await http.MultipartFile.fromPath('productDatasheet', _productDatasheetPath!));
      request.files.add(await http.MultipartFile.fromPath('userManual', _userManualPath!));
      request.files.add(await http.MultipartFile.fromPath('bom', _bomPath!));
      request.files.add(await http.MultipartFile.fromPath('productImages', _productImagesPath!));
      
      if (_circuitDiagramPath != null) {
        request.files.add(await http.MultipartFile.fromPath('circuitDiagram', _circuitDiagramPath!));
      }
      if (_testReportsPath != null) {
        request.files.add(await http.MultipartFile.fromPath('testReports', _testReportsPath!));
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (!mounted) return;
        await showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Success'),
            content: const Text('CE & RoHS Form submitted successfully!'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('OK'),
              ),
            ],
          ),
        );
        if (!mounted) return;
        ref.read(draftServiceProvider).clearDraft(widget.order.id, 'CeRohsFormScreen');
        Navigator.pop(context, true); // Success
      } else {
        throw Exception('Failed to submit form: ${response.body}');
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
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: Colors.red,
    ));
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
                  style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(80, 36)),
                  onPressed: () async {
                    await _saveDraft();
                    if (context.mounted) Navigator.of(context).pop(true);
                  },
                  child: Text('Save Draft', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.corporateBlue, fontWeight: FontWeight.bold)),
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
        );
      },
    );
    return shouldPop ?? false;
  }

  Widget _buildFileUploadRow({
    required String title,
    required String? path,
    required VoidCallback onPick,
    bool isRequired = true,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade300),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RichText(
                    text: TextSpan(
                      text: title,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                      children: [
                        if (isRequired)
                          const TextSpan(text: ' *', style: TextStyle(color: Colors.red)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 4),
                  if (path != null)
                    Text(
                      path.split('/').last,
                      style: GoogleFonts.inter(fontSize: 12, color: AppTheme.corporateBlue),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    )
                  else
                    Text(
                      'Supported formats: JPG, PNG, PDF',
                      style: GoogleFonts.inter(fontSize: 11, color: Colors.grey.shade500),
                    ),
                ],
              ),
            ),
            ElevatedButton(
              onPressed: onPick,
              style: ElevatedButton.styleFrom(
                backgroundColor: path != null ? Colors.green.shade50 : Colors.blue.shade50,
                foregroundColor: path != null ? Colors.green : AppTheme.corporateBlue,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              child: Text(
                path != null ? 'Re-upload' : 'Upload',
                style: GoogleFonts.inter(fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      ),
    );
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
    if (keyboardType == TextInputType.phone) {
      return PhoneInputField(
        controller: controller,
        label: label,
        isRequired: isRequired,
        hintText: null,
        validator: validator,
      );
    }

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
               final date = await showCustomDatePicker(context);
               if (date != null) {
                 setState(() {
                   controller.text = "${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}";
                 });
                 _saveDraft();
               }
            } : null,
            style: GoogleFonts.inter(fontSize: 13, color: AppTheme.deepTeal),
            decoration: InputDecoration(
              hintText: HintHelper.getExampleHint(label),
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


  void _autoFillFromProfile() {
    final user = ref.read(userProfileProvider).value;
    if (user == null) return;
    setState(() {
      if (_emailController.text.isEmpty && user.email.isNotEmpty) _emailController.text = user.email;
    });
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        backgroundColor: Colors.grey.shade50,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          title: Text(
            'CE & RoHS Form',
            style: GoogleFonts.inter(
              color: Colors.black87,
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
          iconTheme: const IconThemeData(color: Colors.black87),
        ),
        body: Form(
          key: _formKey,
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.deepTeal.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.deepTeal.withOpacity(0.2)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline, color: AppTheme.deepTeal),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Please provide the product details and required documents for CE/RoHS certification.',
                          style: GoogleFonts.inter(fontSize: 13, color: AppTheme.deepTeal),
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 24),
                Text(
                  'Product Details',
                  style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.black87),
                ),
                const SizedBox(height: 16),
                
                DropdownButtonFormField2<String>(
                  valueListenable: ValueNotifier(_certificationType),
                  decoration: InputDecoration(
                    labelText: 'Certification Type *',
                    labelStyle: GoogleFonts.inter(color: Colors.grey.shade600),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  ),
                  buttonStyleData: const FormFieldButtonStyleData(padding: EdgeInsets.zero),
items: _certificationTypes.map((type) => DropdownItem(value: type, child: Transform.translate(offset: const Offset(-12, 0), child: Text(type)))).toList(),
                  onChanged: (v) => setState(() => _certificationType = v),
                  validator: (v) => v == null ? 'Select certification type' : null,
                  dropdownStyleData: DropdownStyleData(
                    decoration: BoxDecoration(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 16),
                
                _buildField('Product Name *', _productNameController),
                
                _buildField('Model Number *', _modelNumberController),
                
                _buildField('Company Legal Name *', _manufacturerNameController),
                
                _buildField('Company Address *', _companyAddressController, maxLines: 3),
                
                _buildField('Contact Person Details *', _contactPersonController),
                
                _buildField('Product Specifications (Voltage, Power, etc.) *', _productSpecsController, maxLines: 3),
                Text(
                  'Documents',
                  style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.black87),
                ),
                const SizedBox(height: 16),
                _buildFileUploadRow(
                  title: 'Product Datasheet',
                  path: _productDatasheetPath,
                  onPick: () => _pickFile((p) => _productDatasheetPath = p),
                  isRequired: true,
                ),
                _buildFileUploadRow(
                  title: 'User Manual',
                  path: _userManualPath,
                  onPick: () => _pickFile((p) => _userManualPath = p),
                  isRequired: true,
                ),
                _buildFileUploadRow(
                  title: 'Bill of Materials (BOM)',
                  path: _bomPath,
                  onPick: () => _pickFile((p) => _bomPath = p),
                  isRequired: true,
                ),
                _buildFileUploadRow(
                  title: 'Product Images',
                  path: _productImagesPath,
                  onPick: () => _pickFile((p) => _productImagesPath = p),
                  isRequired: true,
                ),
                
                const SizedBox(height: 24),
                Text(
                  'Documents',
                  style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.black87),
                ),
                const SizedBox(height: 16),
                _buildFileUploadRow(
                  title: 'Circuit Diagram / PCB Details',
                  path: _circuitDiagramPath,
                  onPick: () => _pickFile((p) => _circuitDiagramPath = p),
                  isRequired: false,
                ),
                _buildFileUploadRow(
                  title: 'Existing Test Reports/Certificates',
                  path: _testReportsPath,
                  onPick: () => _pickFile((p) => _testReportsPath = p),
                  isRequired: false,
                ),
                
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _submitDetails,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.deepTeal,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    child: _isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : Text(
                            'Submit Form',
                            style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600),
                          ),
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
