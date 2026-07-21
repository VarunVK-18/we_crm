import 'package:flutter/material.dart';
import '../../providers/draft_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;

import '../../core/constants/port.dart';
import '../../core/theme/app_theme.dart';
import '../../models/order_model.dart';
import '../../providers/auth_provider.dart';
import 'package:crm_app/core/utils/error_handler.dart';
import 'package:crm_app/core/utils/file_picker_util.dart';

class ItrFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const ItrFormScreen({super.key, required this.order});

  @override
  ConsumerState<ItrFormScreen> createState() => _ItrFormScreenState();
}

class _ItrFormScreenState extends ConsumerState<ItrFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Document Uploads
  String? _bankStatementsPath;
  String? _purchaseBillsPath;
  String? _salesInvoicesPath;
  String? _companyPanPath;
  String? _additionalDocsPath;

  @override
  void initState() {
    super.initState();
    _loadDraft();
  }

  @override
  void dispose() {
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
    final draft = await draftService.loadDraft(widget.order.id, 'ItrFormScreen');
    if (draft != null) {
      if (mounted) {
        setState(() {
          if (draft.containsKey('bankStatementsPath')) _bankStatementsPath = draft['bankStatementsPath'];
          if (draft.containsKey('purchaseBillsPath')) _purchaseBillsPath = draft['purchaseBillsPath'];
          if (draft.containsKey('salesInvoicesPath')) _salesInvoicesPath = draft['salesInvoicesPath'];
          if (draft.containsKey('companyPanPath')) _companyPanPath = draft['companyPanPath'];
          if (draft.containsKey('additionalDocsPath')) _additionalDocsPath = draft['additionalDocsPath'];
        });
      }
    }
  }

  Future<void> _saveDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final data = <String, dynamic>{
      'bankStatementsPath': _bankStatementsPath,
      'purchaseBillsPath': _purchaseBillsPath,
      'salesInvoicesPath': _salesInvoicesPath,
      'companyPanPath': _companyPanPath,
      'additionalDocsPath': _additionalDocsPath,
    };
    await draftService.saveDraft(widget.order.id, 'ItrFormScreen', data);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Draft saved successfully!'),
        backgroundColor: AppTheme.deepTeal,
      ));
    }
  }

  Future<void> _submitDetails() async {
    if (!_formKey.currentState!.validate()) {
      _showError('Please fill all required fields.');
      return;
    }

    if (_bankStatementsPath == null || _purchaseBillsPath == null || _salesInvoicesPath == null || _companyPanPath == null) {
      _showError("Please upload all required documents.");
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');

      final uri = Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-itr-form');
      var request = http.MultipartRequest('POST', uri);
      request.headers['x-user-id'] = uid;

      // Files
      request.files.add(await http.MultipartFile.fromPath('bankStatements', _bankStatementsPath!));
      request.files.add(await http.MultipartFile.fromPath('purchaseBills', _purchaseBillsPath!));
      request.files.add(await http.MultipartFile.fromPath('salesInvoices', _salesInvoicesPath!));
      request.files.add(await http.MultipartFile.fromPath('companyPan', _companyPanPath!));
      
      if (_additionalDocsPath != null) {
        request.files.add(await http.MultipartFile.fromPath('additionalDocs', _additionalDocsPath!));
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (!mounted) return;
        await showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Success'),
            content: const Text('ITR Form submitted successfully!'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('OK'),
              ),
            ],
          ),
        );
        if (!mounted) return;
        ref.read(draftServiceProvider).clearDraft(widget.order.id, 'ItrFormScreen');
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
            'ITR Filing Form',
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
                          'Please upload the required documents for your ITR service. Ensure all details are clear and legible.',
                          style: GoogleFonts.inter(fontSize: 13, color: AppTheme.deepTeal),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Required Documents',
                  style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
                ),
                const SizedBox(height: 16),
                _buildFileUploadRow(
                  title: 'Bank Statements (Current Account)',
                  path: _bankStatementsPath,
                  onPick: () => _pickFile((p) => _bankStatementsPath = p),
                  isRequired: true,
                ),
                _buildFileUploadRow(
                  title: 'Purchase Bills',
                  path: _purchaseBillsPath,
                  onPick: () => _pickFile((p) => _purchaseBillsPath = p),
                  isRequired: true,
                ),
                _buildFileUploadRow(
                  title: 'Sales Invoice Copies',
                  path: _salesInvoicesPath,
                  onPick: () => _pickFile((p) => _salesInvoicesPath = p),
                  isRequired: true,
                ),
                _buildFileUploadRow(
                  title: 'Company PAN Card',
                  path: _companyPanPath,
                  onPick: () => _pickFile((p) => _companyPanPath = p),
                  isRequired: true,
                ),
                const SizedBox(height: 24),
                Text(
                  'Optional Documents',
                  style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
                ),
                const SizedBox(height: 16),
                _buildFileUploadRow(
                  title: 'Additional Documents',
                  path: _additionalDocsPath,
                  onPick: () => _pickFile((p) => _additionalDocsPath = p),
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
