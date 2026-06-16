import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;

import '../../core/constants/port.dart';
import '../../core/theme/app_theme.dart';
import '../../models/order_model.dart';
import '../../providers/auth_provider.dart';

class GstComplianceFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const GstComplianceFormScreen({super.key, required this.order});

  @override
  ConsumerState<GstComplianceFormScreen> createState() => _GstComplianceFormScreenState();
}

class _GstComplianceFormScreenState extends ConsumerState<GstComplianceFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Document
  String? _bankStatementPath;

  Future<void> _pickFile(Function(String) onPicked) async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
    );
    if (result != null && result.files.single.path != null) {
      if (result.files.single.size > 5 * 1024 * 1024) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Upload a file less than 5 MB or equal to 5 MB.'),
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
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_bankStatementPath == null) {
      _showError("Please upload the Last 3 months Bank Statement.");
      return;
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');

      final uri = Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-gst-compliance-form');
      var request = http.MultipartRequest('POST', uri);
      request.headers['x-user-id'] = uid;

      // Add files
      request.files.add(await http.MultipartFile.fromPath('bankStatement', _bankStatementPath!));

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
          title: const Text('Are You Sure To Exit ?', style: TextStyle(fontWeight: FontWeight.bold)),
          content: const Text('Any unsaved progress will be lost.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('No'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              child: const Text('Yes', style: TextStyle(color: Colors.white)),
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
        title: const Text('GST Compliance Form', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w800, fontSize: 16)),
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
                  
                  // Documents
                  _buildSectionContainer(
                    title: 'Documents',
                    children: [
                      _buildFileRow('Last 3 months Bank Statement', 'Current Account. Upload 1 supported file. Max 5 MB.', _bankStatementPath, () => _pickFile((path) => _bankStatementPath = path)),
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
}
