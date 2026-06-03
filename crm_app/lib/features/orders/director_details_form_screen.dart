import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;

import '../../core/constants/port.dart';
import '../../core/theme/app_theme.dart';
import '../../models/order_model.dart';
import '../../providers/auth_provider.dart';

class DirectorFormData {
  final TextEditingController fullNameController = TextEditingController();
  final TextEditingController fatherNameController = TextEditingController();
  final TextEditingController dobController = TextEditingController();
  final TextEditingController placeOfBirthController = TextEditingController();
  final TextEditingController occupationController = TextEditingController();
  final TextEditingController educationController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController phoneController = TextEditingController();
  final TextEditingController addressController = TextEditingController();
  final TextEditingController panController = TextEditingController();
  final TextEditingController aadhaarController = TextEditingController();
  final TextEditingController dinController = TextEditingController();
  final TextEditingController shareholdingController = TextEditingController();

  String nationality = 'Indian';
  String needDsc = 'Yes';
  String role = 'Director';
  String isAuthSignatory = 'Yes';

  String? photoPath;
  String? signaturePath;
  String? addressProofPath;
  String? aadhaarPath;
  String? panPath;

  Map<String, dynamic> toJson() {
    return {
      'fullName': fullNameController.text,
      'fatherName': fatherNameController.text,
      'dob': dobController.text,
      'placeOfBirth': placeOfBirthController.text,
      'occupation': occupationController.text,
      'education': educationController.text,
      'email': emailController.text,
      'phone': phoneController.text,
      'address': addressController.text,
      'pan': panController.text,
      'aadhaar': aadhaarController.text,
      'din': dinController.text,
      'shareholding': shareholdingController.text,
      'nationality': nationality,
      'needDsc': needDsc,
      'role': role,
      'isAuthSignatory': isAuthSignatory,
    };
  }

  void dispose() {
    fullNameController.dispose();
    fatherNameController.dispose();
    dobController.dispose();
    placeOfBirthController.dispose();
    occupationController.dispose();
    educationController.dispose();
    emailController.dispose();
    phoneController.dispose();
    addressController.dispose();
    panController.dispose();
    aadhaarController.dispose();
    dinController.dispose();
    shareholdingController.dispose();
  }
}

class DirectorDetailsFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const DirectorDetailsFormScreen({super.key, required this.order});

  @override
  ConsumerState<DirectorDetailsFormScreen> createState() => _DirectorDetailsFormScreenState();
}

class _DirectorDetailsFormScreenState extends ConsumerState<DirectorDetailsFormScreen> {
  final List<DirectorFormData> _directors = [DirectorFormData()];
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  @override
  void dispose() {
    for (var d in _directors) {
      d.dispose();
    }
    super.dispose();
  }

  Future<void> _pickFile(DirectorFormData data, String field) async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
    );
    if (result != null && result.files.single.path != null) {
      setState(() {
        final path = result.files.single.path!;
        switch (field) {
          case 'photo':
            data.photoPath = path;
            break;
          case 'signature':
            data.signaturePath = path;
            break;
          case 'addressProof':
            data.addressProofPath = path;
            break;
          case 'aadhaar':
            data.aadhaarPath = path;
            break;
          case 'pan':
            data.panPath = path;
            break;
        }
      });
    }
  }

  Future<void> _submitDetails() async {
    if (!_formKey.currentState!.validate()) return;
    
    // Check if required files are uploaded for all directors
    for (int i = 0; i < _directors.length; i++) {
      final d = _directors[i];
      if (d.photoPath == null || d.signaturePath == null || d.addressProofPath == null || d.aadhaarPath == null || d.panPath == null) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Please upload all required files for Person ${i + 1}'),
          backgroundColor: Colors.red,
        ));
        return;
      }
    }

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');

      final uri = Uri.parse('$kBaseUrl/api/checklists/${widget.order.id}/upload-documents');
      var request = http.MultipartRequest('POST', uri);
      request.headers['x-user-id'] = uid;

      // First, we update the details JSON
      final existingDetails = widget.order.details;
      final directorsList = _directors.map((d) => d.toJson()).toList();
      existingDetails['directors'] = jsonEncode(directorsList);

      final patchUri = Uri.parse('$kBaseUrl/api/checklists/${widget.order.id}');
      final patchRes = await http.patch(
        patchUri,
        headers: {
          'x-user-id': uid,
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'details': existingDetails}),
      );

      if (patchRes.statusCode != 200) {
        throw Exception('Failed to update details');
      }

      // Then upload files
      for (int i = 0; i < _directors.length; i++) {
        final d = _directors[i];
        request.files.add(await http.MultipartFile.fromPath('director_${i + 1}_photo', d.photoPath!));
        request.files.add(await http.MultipartFile.fromPath('director_${i + 1}_signature', d.signaturePath!));
        request.files.add(await http.MultipartFile.fromPath('director_${i + 1}_addressProof', d.addressProofPath!));
        request.files.add(await http.MultipartFile.fromPath('director_${i + 1}_aadhaar', d.aadhaarPath!));
        request.files.add(await http.MultipartFile.fromPath('director_${i + 1}_pan', d.panPath!));
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (!mounted) return;
        Navigator.pop(context, true); // Success
      } else {
        throw Exception('Failed to upload files: ${response.body}');
      }
    } catch (e) {
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
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Complete Director Details', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w800, fontSize: 16)),
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
                  ..._directors.asMap().entries.map((entry) {
                    final index = entry.key;
                    final data = entry.value;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 24),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey[50],
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.grey[200]!),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Person ${index + 1} Registration', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.deepTeal)),
                              if (_directors.length > 1)
                                IconButton(
                                  icon: const Icon(LucideIcons.trash2, color: Colors.red),
                                  onPressed: () => setState(() => _directors.removeAt(index)),
                                ),
                            ],
                          ),
                          const SizedBox(height: 24),
                          _buildField('Full name', data.fullNameController, isRequired: true),
                          _buildField('Father\'s name', data.fatherNameController, isRequired: true),
                          _buildField('DOB (DD/MM/YYYY)', data.dobController, isRequired: true),
                          _buildField('Place of birth', data.placeOfBirthController, isRequired: true),
                          _buildField('Occupation', data.occupationController, isRequired: true),
                          _buildField('Education', data.educationController, isRequired: true),
                          _buildField('Email', data.emailController, isRequired: true, keyboardType: TextInputType.emailAddress),
                          _buildField('Phone number', data.phoneController, isRequired: true, keyboardType: TextInputType.phone),
                          _buildField('Address', data.addressController, isRequired: true),
                          _buildField('PAN', data.panController, isRequired: true),
                          _buildField('Aadhaar Number', data.aadhaarController, isRequired: true),
                          _buildField('DIN Number', data.dinController, isRequired: false),
                          _buildField('Share holding percentage', data.shareholdingController, isRequired: true, keyboardType: TextInputType.number),
                          
                          const SizedBox(height: 16),
                          const Text('Role in the company', style: TextStyle(fontWeight: FontWeight.w700, color: AppTheme.deepTeal)),
                          DropdownButtonFormField<String>(
                            value: data.role,
                            items: ['Director', 'Shareholder', 'Director & Shareholder']
                                .map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
                            onChanged: (v) => setState(() => data.role = v!),
                          ),
                          const SizedBox(height: 24),

                          const Text('Document Uploads', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppTheme.deepTeal)),
                          const SizedBox(height: 16),
                          _buildFileRow('Photo', data.photoPath, () => _pickFile(data, 'photo')),
                          _buildFileRow('Signature', data.signaturePath, () => _pickFile(data, 'signature')),
                          _buildFileRow('Address Proof', data.addressProofPath, () => _pickFile(data, 'addressProof')),
                          _buildFileRow('Aadhaar', data.aadhaarPath, () => _pickFile(data, 'aadhaar')),
                          _buildFileRow('PAN', data.panPath, () => _pickFile(data, 'pan')),
                        ],
                      ),
                    );
                  }),
                  
                  OutlinedButton.icon(
                    onPressed: () => setState(() => _directors.add(DirectorFormData())),
                    icon: const Icon(LucideIcons.plus, size: 18),
                    label: const Text('Add Person'),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 50),
                      side: const BorderSide(color: AppTheme.corporateBlue),
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _submitDetails,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.corporateBlue,
                      minimumSize: const Size(double.infinity, 50),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Submit Details', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildField(String label, TextEditingController controller, {bool isRequired = false, TextInputType keyboardType = TextInputType.text}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          labelText: label + (isRequired ? ' *' : ''),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
        validator: isRequired ? (v) => v == null || v.isEmpty ? 'Required' : null : null,
      ),
    );
  }

  Widget _buildFileRow(String label, String? path, VoidCallback onPick) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600))),
          if (path != null) const Icon(LucideIcons.checkCircle, color: Colors.green, size: 20),
          TextButton(onPressed: onPick, child: Text(path == null ? 'Upload' : 'Change')),
        ],
      ),
    );
  }
}
