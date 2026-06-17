import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;

import '../../core/constants/port.dart';
import '../../core/theme/app_theme.dart';
import '../../models/order_model.dart';
import '../../providers/auth_provider.dart';

class GstFilingFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const GstFilingFormScreen({super.key, required this.order});

  @override
  ConsumerState<GstFilingFormScreen> createState() => _GstFilingFormScreenState();
}

class _GstFilingFormScreenState extends ConsumerState<GstFilingFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Step 1: Business Details
  final _businessNameController = TextEditingController();
  final _gstinController = TextEditingController();
  final _legalNameController = TextEditingController();

  // Step 2: Filing Period
  String? _returnType;
  String? _filingMonth;
  String? _filingQuarter;
  final _financialYearController = TextEditingController();

  // Step 3: Documents
  String? _salesReportPath;
  String? _purchaseReportPath;
  String? _gstInvoicesPath;

  final List<String> _returnTypes = [
    'GSTR-1',
    'GSTR-3B',
    'Annual Return',
  ];

  final List<String> _months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  final List<String> _quarters = [
    'Q1 (Apr-Jun)', 'Q2 (Jul-Sep)', 'Q3 (Oct-Dec)', 'Q4 (Jan-Mar)'
  ];

  @override
  void dispose() {
    _businessNameController.dispose();
    _gstinController.dispose();
    _legalNameController.dispose();
    _financialYearController.dispose();
    super.dispose();
  }

  Future<void> _pickFile(Function(String) onPicked) async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf', 'xlsx', 'xls', 'csv', 'zip'],
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

  Future<void> _submitDetails() async {
    if (!_formKey.currentState!.validate() || _returnType == null) {
      _showError('Please fill all required fields.');
      return;
    }

    if (_salesReportPath == null || _purchaseReportPath == null || _gstInvoicesPath == null) {
      _showError("Please upload all required documents.");
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');

      final uri = Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-gst-filing-form');
      var request = http.MultipartRequest('POST', uri);
      request.headers['x-user-id'] = uid;

      // Step 1
      request.fields['businessName'] = _businessNameController.text;
      request.fields['gstin'] = _gstinController.text.toUpperCase();
      request.fields['legalName'] = _legalNameController.text;

      // Step 2
      request.fields['returnType'] = _returnType!;
      request.fields['month'] = _filingMonth ?? '';
      request.fields['quarter'] = _filingQuarter ?? '';
      request.fields['financialYear'] = _financialYearController.text;

      // Step 3
      request.files.add(await http.MultipartFile.fromPath('salesReport', _salesReportPath!));
      request.files.add(await http.MultipartFile.fromPath('purchaseReport', _purchaseReportPath!));
      request.files.add(await http.MultipartFile.fromPath('gstInvoices', _gstInvoicesPath!));

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (!mounted) return;
        await showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Success'),
            content: const Text('GST Filing Form submitted successfully!'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('OK'),
              ),
            ],
          ),
        );
        if (!mounted) return;
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

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('GST Filing Form', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w800, fontSize: 16)),
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
                  
                  // Step 1: Business Details
                  _buildSectionContainer(
                    title: 'Step 1: Business Details',
                    children: [
                      _buildField('Business Name', '', _businessNameController, isRequired: true),
                      _buildField('GSTIN', 'e.g. 29ABCDE1234F1Z5', _gstinController, isRequired: true, isUppercase: true),
                      _buildField('Legal Name', 'As per PAN', _legalNameController, isRequired: true),
                    ],
                  ),

                  // Step 2: Filing Period
                  _buildSectionContainer(
                    title: 'Step 2: Filing Period',
                    children: [
                      _buildDropdownField('Return Type', _returnTypes, _returnType, (val) => setState(() => _returnType = val), isRequired: true),
                      _buildDropdownField('Month', _months, _filingMonth, (val) => setState(() => _filingMonth = val), isRequired: false),
                      _buildDropdownField('Quarter', _quarters, _filingQuarter, (val) => setState(() => _filingQuarter = val), isRequired: false),
                      _buildField('Financial Year', 'e.g. 2023-2024', _financialYearController, isRequired: true),
                    ],
                  ),

                  // Step 3: Document Uploads
                  _buildSectionContainer(
                    title: 'Step 3: Document Uploads',
                    children: [
                      _buildFileRow('Sales Report', 'Max 2 MB.', _salesReportPath, () => _pickFile((path) => _salesReportPath = path)),
                      _buildFileRow('Purchase Report', 'Max 2 MB.', _purchaseReportPath, () => _pickFile((path) => _purchaseReportPath = path)),
                      _buildFileRow('GST Invoices', 'Max 2 MB (ZIP OK).', _gstInvoicesPath, () => _pickFile((path) => _gstInvoicesPath = path)),
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

  Widget _buildDropdownField(String label, List<String> items, String? currentValue, Function(String?) onChanged, {bool isRequired = false}) {
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
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: currentValue,
            decoration: InputDecoration(
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.black, width: 1.5)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            items: items.map((type) => DropdownMenuItem(value: type, child: Text(type))).toList(),
            onChanged: onChanged,
            validator: isRequired ? (value) => value == null ? 'Please select $label' : null : null,
          ),
        ],
      ),
    );
  }

  Widget _buildField(String label, String hint, TextEditingController controller, {bool isRequired = false, TextInputType keyboardType = TextInputType.text, int maxLines = 1, bool isUppercase = false}) {
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
            textCapitalization: isUppercase ? TextCapitalization.characters : TextCapitalization.none,
            maxLines: maxLines,
            decoration: InputDecoration(
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.black, width: 1.5)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            validator: isRequired ? (v) => v == null || v.trim().isEmpty ? 'This is a required field' : null : null,
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  path == null ? 'Upload 1 supported file.' : path.split('/').last, 
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
