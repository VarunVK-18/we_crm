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

class McaComplianceFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const McaComplianceFormScreen({super.key, required this.order});

  @override
  ConsumerState<McaComplianceFormScreen> createState() => _McaComplianceFormScreenState();
}

class _McaComplianceFormScreenState extends ConsumerState<McaComplianceFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  
  String _annualTurnover = 'Less than ₹20 Lakhs';

  // Document paths
  String? _coiPath;
  String? _panPath;
  String? _moaPath;
  String? _aoaPath;
  String? _bankStatementPath;
  String? _salesInvoicePath;
  String? _purchaseBillsPath;

  Future<void> _pickFile(Function(String) onPicked) async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
    );
    if (result != null && result.files.single.path != null) {
      if (result.files.single.size > 5 * 1024 * 1024) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Upload a file less than 5 MB.'),
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
    final draft = await draftService.loadDraft(widget.order.id, 'McaComplianceFormScreen');
    if (draft != null) {
      if (mounted) {
        setState(() {
        if (draft.containsKey('mcaUsername')) _usernameController.text = draft['mcaUsername'];
        if (draft.containsKey('mcaPassword')) _passwordController.text = draft['mcaPassword'];
        if (draft.containsKey('annualTurnover')) _annualTurnover = draft['annualTurnover'];

                if (draft.containsKey('coiPath')) _coiPath = draft['coiPath'];
        if (draft.containsKey('panPath')) _panPath = draft['panPath'];
        if (draft.containsKey('moaPath')) _moaPath = draft['moaPath'];
        if (draft.containsKey('aoaPath')) _aoaPath = draft['aoaPath'];
        if (draft.containsKey('bankStatementPath')) _bankStatementPath = draft['bankStatementPath'];
        if (draft.containsKey('salesInvoicePath')) _salesInvoicePath = draft['salesInvoicePath'];
        if (draft.containsKey('purchaseBillsPath')) _purchaseBillsPath = draft['purchaseBillsPath'];
});
      }
    }
  }

  Future<void> _saveDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final data = <String, dynamic>{
      'mcaUsername': _usernameController.text,
      'mcaPassword': _passwordController.text,
      'annualTurnover': _annualTurnover,

          'coiPath': _coiPath,
      'panPath': _panPath,
      'moaPath': _moaPath,
      'aoaPath': _aoaPath,
      'bankStatementPath': _bankStatementPath,
      'salesInvoicePath': _salesInvoicePath,
      'purchaseBillsPath': _purchaseBillsPath,
};
    await draftService.saveDraft(widget.order.id, 'McaComplianceFormScreen', data);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Draft saved successfully!'),
        backgroundColor: AppTheme.deepTeal,
      ));
    }
  }

  Future<void> _submitDetails() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_coiPath == null || _panPath == null || _moaPath == null || _aoaPath == null || _bankStatementPath == null || _salesInvoicePath == null || _purchaseBillsPath == null) {
      _showError("Please upload all the required documents.");
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');

      final uri = Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-mca-form');
      var request = http.MultipartRequest('POST', uri);
      request.headers['x-user-id'] = uid;

      request.fields['mcaUsername'] = _usernameController.text;
      request.fields['mcaPassword'] = _passwordController.text;
      request.fields['annualTurnover'] = _annualTurnover;

      request.files.add(await http.MultipartFile.fromPath('coi', _coiPath!));
      request.files.add(await http.MultipartFile.fromPath('pan', _panPath!));
      request.files.add(await http.MultipartFile.fromPath('moa', _moaPath!));
      request.files.add(await http.MultipartFile.fromPath('aoa', _aoaPath!));
      request.files.add(await http.MultipartFile.fromPath('bankStatement', _bankStatementPath!));
      request.files.add(await http.MultipartFile.fromPath('salesInvoice', _salesInvoicePath!));
      request.files.add(await http.MultipartFile.fromPath('purchaseBills', _purchaseBillsPath!));

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
        ref.read(draftServiceProvider).clearDraft(widget.order.id, 'McaComplianceFormScreen');
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

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvoked: (didPop) async {
        if (didPop) return;
        final shouldPop = await _onWillPop();
        if (shouldPop && context.mounted) {
          Navigator.of(context).pop();
        }
      },
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
                    title: 'Business Details',
                    children: [
                      _buildRadioGroup(
                        'Expected Annual Turnover',
                        '',
                        ['Less than ₹20 Lakhs', 'Greater than ₹20 Lakhs and Less than ₹50 Lakhs', 'Greater than ₹50 Lakhs'],
                        _annualTurnover,
                        (v) => setState(() => _annualTurnover = v),
                      ),
                    ],
                  ),

                  _buildSectionContainer(
                    title: 'Credentials (Optional)',
                    children: [
                      _buildField('MCA Username', 'Enter username if available', _usernameController),
                      _buildField('MCA Password', 'Enter password if available', _passwordController),
                    ],
                  ),

                  // Documents
                  _buildSectionContainer(
                    title: 'Documents Required',
                    children: [
                      _buildFileRow('Certificate of Incorporation', '', _coiPath, () => _pickFile((path) => _coiPath = path)),
                      _buildFileRow('PAN Card of the Company', '', _panPath, () => _pickFile((path) => _panPath = path)),
                      _buildFileRow('Memorandum of Association (MOA)', '', _moaPath, () => _pickFile((path) => _moaPath = path)),
                      _buildFileRow('Articles of Association (AOA)', '', _aoaPath, () => _pickFile((path) => _aoaPath = path)),
                      _buildFileRow('Last FY Bank statements', '', _bankStatementPath, () => _pickFile((path) => _bankStatementPath = path)),
                      _buildFileRow('Sales Invoice copies of last FY', '', _salesInvoicePath, () => _pickFile((path) => _salesInvoicePath = path)),
                      _buildFileRow('Purchase bills of last FY', '', _purchaseBillsPath, () => _pickFile((path) => _purchaseBillsPath = path)),
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

  Widget _buildField(String label, String hint, TextEditingController controller, {bool isRequired = false, TextInputType keyboardType = TextInputType.text}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
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
            decoration: InputDecoration(
              hintText: hint.isNotEmpty ? hint : 'Enter ${label.replaceAll("*", "").trim()}',
              hintStyle: const TextStyle(fontSize: 13, color: Colors.grey, fontWeight: FontWeight.normal),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.black, width: 1.5)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            validator: isRequired ? (v) => v == null || v.isEmpty ? 'This is a required field' : null : null,
          ),
        ],
      ),
    );
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

  Widget _buildFileRow(String label, String hint, String? path, VoidCallback onPick) {
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
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  path == null ? 'Upload 1 supported file. Max 5 MB.' : path.split('/').last, 
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

  Widget _buildRadioGroup(String label, String hint, List<String> options, String currentValue, ValueChanged<String> onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
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
          const SizedBox(height: 8),
          Column(
            children: options.map((option) {
              return RadioListTile<String>(
                contentPadding: EdgeInsets.zero,
                title: Text(option, style: const TextStyle(fontSize: 14)),
                value: option,
                groupValue: currentValue,
                activeColor: AppTheme.corporateBlue,
                onChanged: (value) {
                  if (value != null) onChanged(value);
                },
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
