import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io';
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
  late final List<DirectorFormData> _directors;
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    final assignedNumStr = widget.order.details['assignedNumberOfDirectors']?.toString();
    final numStr = assignedNumStr ?? widget.order.details['numberOfDirectors']?.toString() ?? '1';
    final int count = int.tryParse(numStr) ?? 1;
    _directors = List.generate(count, (_) => DirectorFormData());
  }

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
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please fill all required fields.'),
        backgroundColor: Colors.red,
      ));
      return;
    }
    
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
      final existingDetails = Map<String, dynamic>.from(widget.order.details);
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

Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
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
                            ],
                          ),
                          const SizedBox(height: 8),
                          const Text('Please provide the following information for registration (Later it can\'t be changed)', style: TextStyle(color: Colors.grey, fontSize: 13)),
                          const SizedBox(height: 24),
                          
                          _buildField('Full name', 'Enter your complete name as it appears on your official documents. Include your first name, middle name (if any), and last name.', data.fullNameController, isRequired: true),
                          _buildField('Father\'s name', 'Enter your father\'s complete name as it appears on your official documents.', data.fatherNameController, isRequired: true),
                          _buildField('DOB', 'Enter your date of birth in DD/MM/YYYY format. This should match the date on your official documents.', data.dobController, isRequired: true, isDate: true),
                          _buildField('Place of birth', 'Enter the city and state where you were born. This should match your birth certificate or other official documents.', data.placeOfBirthController, isRequired: true),
                          
                          _buildRadioGroup('Nationality', 'Select your nationality. Choose "Indian" if you are an Indian citizen, or "Others" if you are a foreign national or NRI.', ['Indian', 'Others'], data.nationality, (v) => setState(() => data.nationality = v)),
                          
                          _buildRadioGroup('Select the occupation that best describes your current professional status.', '', ['Business', 'Employment', 'House wife', 'Student'], data.occupationController.text, (v) => setState(() => data.occupationController.text = v)),

                          _buildField('Education', '', data.educationController, isRequired: true),
                          _buildField('Email', 'Enter your personal email address. This will be used for all communications related to your application.', data.emailController, isRequired: true, keyboardType: TextInputType.emailAddress),
                          _buildField('Phone number', 'Enter your mobile number. This should be a number that you can always be reached on.', data.phoneController, isRequired: true, keyboardType: TextInputType.phone),
                          _buildField('Address', 'Enter your complete residential address where you currently live. with Pin code', data.addressController, isRequired: true),
                          _buildField('PAN', 'Enter your 10-character PAN (Permanent Account Number) issued by the Income Tax Department.', data.panController, isRequired: true),
                          _buildField('Aadhaar Number', 'Enter your 12-digit Aadhaar number issued by UIDAI.', data.aadhaarController, isRequired: true),
                          _buildField('DIN Number', 'Enter your 8-digit DIN (Director Identification Number) if you are already a director in another company. Leave blank if this is your first directorship.', data.dinController, isRequired: false),
                          
                          _buildRadioGroup('I need DSC', 'Select "Yes" if you need a Digital Signature Certificate (DSC) for signing documents electronically.', ['Yes', 'No', 'Maybe'], data.needDsc, (v) => setState(() => data.needDsc = v)),
                          
                          _buildRadioGroup('Select your role in the company. You can be a Director, Shareholder, or both Director and Shareholder.', '', ['Director', 'Shareholder', 'Director & Shareholder'], data.role, (v) => setState(() => data.role = v)),
                          
                          _buildField('Share holding percentage', 'Enter the percentage of shares you will hold in the company. This should be between 0 and 100.', data.shareholdingController, isRequired: true, keyboardType: TextInputType.number),
                          
                          _buildRadioGroup('I\'m Authorized signatory', 'Select "Yes" if you will be an authorized signatory for the company\'s bank accounts and official documents. Yes, I want to be the authorized signatory', ['Yes', 'No'], data.isAuthSignatory, (v) => setState(() => data.isAuthSignatory = v)),
                          
                          const SizedBox(height: 24),
                          const Text('Document Uploads', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppTheme.deepTeal)),
                          const SizedBox(height: 16),
                          
                          _buildFileRow('Photo', 'Upload a recent passport-size photograph (3.5cm x 4.5cm) with a white background.', data.photoPath, () => _pickFile(data, 'photo')),
                          _buildFileRow('Signature', 'Upload a clear image of your signature. This is required if you are an authorized signatory.', data.signaturePath, () => _pickFile(data, 'signature')),
                          _buildFileRow('Residential address proof', 'Upload proof of your residential address (utility bill, bank statement, etc.). This proof should be on the name of the person and should not be older than two months', data.addressProofPath, () => _pickFile(data, 'addressProof')),
                          _buildFileRow('Aadhaar Card', 'Upload Aadhaar card with front and back side pdf. The system will verify the document using OCR and cross-check with the details provided above.', data.aadhaarPath, () => _pickFile(data, 'aadhaar')),
                          _buildFileRow('PAN Card', 'Upload PAN card. The system will verify the document using OCR and cross-check with the details provided above.', data.panPath, () => _pickFile(data, 'pan')),
                        ],
                      ),
                    );
                  }),
                  

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
    ));
  }

  Widget _buildRadioGroup(String label, String hint, List<String> options, String currentValue, Function(String) onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
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
          Wrap(
            spacing: 16,
            children: options.map((opt) {
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Radio<String>(
                    value: opt,
                    groupValue: currentValue,
                    onChanged: (v) {
                      if (v != null) onChanged(v);
                    },
                    activeColor: AppTheme.corporateBlue,
                  ),
                  Text(opt, style: const TextStyle(fontSize: 14)),
                ],
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildField(String label, String hint, TextEditingController controller, {bool isRequired = false, TextInputType keyboardType = TextInputType.text, bool isDate = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
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
            readOnly: isDate,
            onTap: isDate ? () async {
              final date = await showDatePicker(
                context: context,
                initialDate: DateTime.now(),
                firstDate: DateTime(1900),
                lastDate: DateTime(2100),
              );
              if (date != null) {
                controller.text = "${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}";
              }
            } : null,
            decoration: InputDecoration(
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.black, width: 1.5)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              suffixIcon: isDate ? const Icon(Icons.calendar_today, size: 20, color: Colors.grey) : null,
            ),
            validator: isRequired ? (v) => v == null || v.isEmpty ? 'This is a required question' : null : null,
          ),
        ],
      ),
    );
  }

  Widget _buildFileRow(String label, String hint, String? path, VoidCallback onPick) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
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
