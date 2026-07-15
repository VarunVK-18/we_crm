import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;

import '../../core/constants/port.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';

class McaProfileFormScreen extends ConsumerStatefulWidget {
  const McaProfileFormScreen({super.key});

  @override
  ConsumerState<McaProfileFormScreen> createState() => _McaProfileFormScreenState();
}

class _McaProfileFormScreenState extends ConsumerState<McaProfileFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  bool _obscurePassword = true;

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

  Future<void> _pickFile(Function(String) onPicked, {List<String> allowedExtensions = const ['jpg', 'jpeg', 'png', 'pdf']}) async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
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

      final uri = Uri.parse('$kBaseUrl/api/users/me/mca-profile');
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
        // Invalidate the user profile so it refetches automatically
        ref.invalidate(userProfileProvider);
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
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Complete Company Profile', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w800, fontSize: 16)),
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
                  Text('Complete Company Profile', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w600, color: AppTheme.corporateBlue)),
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
                      _buildField('MCA Username', 'Enter MCA Portal Username', _usernameController, isRequired: false),
                      _buildPasswordField('MCA Password', 'Enter MCA Portal Password', _passwordController, isRequired: false),
                    ],
                  ),

                  // Documents
                  _buildSectionContainer(
                    title: 'Documents Required',
                    children: [
                      _buildFileRow('Certificate of Incorporation', '', _coiPath, () => _pickFile((path) => _coiPath = path)),
                      _buildFileRow('PAN Card of the Company', '', _panPath, () => _pickFile((path) => _panPath = path, allowedExtensions: const ['pdf'])),
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
    );
  }

  Widget _buildPasswordField(String label, String hint, TextEditingController controller, {bool isRequired = false}) {
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
            obscureText: _obscurePassword,
            decoration: InputDecoration(
              hintText: hint.isNotEmpty ? hint : 'Enter ${label.replaceAll("*", "").trim()}',
              hintStyle: const TextStyle(fontSize: 13, color: Colors.grey, fontWeight: FontWeight.normal),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.black, width: 1.5)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              suffixIcon: IconButton(
                icon: Icon(_obscurePassword ? Icons.visibility : Icons.visibility_off, color: Colors.grey),
                onPressed: () {
                  setState(() {
                    _obscurePassword = !_obscurePassword;
                  });
                },
              ),
            ),
          ),
        ],
      ),
    );
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
            validator: (v) {
  if (isRequired && (v == null || v.trim().isEmpty)) {
    return 'This is a required question';
  }
  if (v != null && v.trim().isNotEmpty) {
    final text = v.trim();
    final labelLower = label.toLowerCase();
    if (labelLower.contains('phone') || labelLower.contains('mobile') || labelLower.contains('contact') || labelLower.contains('number')) {
      if (labelLower.contains('company') || labelLower.contains('whatsapp') || labelLower.contains('director') || labelLower.contains('business') || labelLower == 'phone number' || labelLower == 'mobile number' || labelLower == 'contact number' || labelLower == 'company number') {
         if (!RegExp(r'^[0-9]{10}$').hasMatch(text)) return 'Enter a valid 10-digit phone number';
      }
    }
    if (labelLower.contains('mail') || labelLower.contains('email')) {
      if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(text)) return 'Enter a valid email address';
    }
    if (labelLower.contains('aadhaar') || labelLower.contains('adhar')) {
      if (!RegExp(r'^[2-9]{1}[0-9]{11}$').hasMatch(text)) return 'Enter a valid 12-digit Aadhaar number';
    }
    if (labelLower.contains('pan ') || labelLower == 'pan' || labelLower.contains('pan number')) {
      if (!RegExp(r'^[a-zA-Z]{5}[0-9]{4}[a-zA-Z]{1}$').hasMatch(text)) return 'Enter a valid PAN (e.g. ABCDE1234F)';
    }
    if (labelLower.contains('tan ') || labelLower == 'tan' || labelLower.contains('tan number')) {
      if (!RegExp(r'^[a-zA-Z]{4}[0-9]{5}[a-zA-Z]{1}$').hasMatch(text)) return 'Enter a valid TAN (e.g. ABCD12345E)';
    }
  }
  return null;
},
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
                  minimumSize: const Size(80, 32),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
