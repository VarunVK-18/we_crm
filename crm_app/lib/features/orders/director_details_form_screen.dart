import 'package:crm_app/core/utils/error_handler.dart';
import 'package:crm_app/core/utils/file_picker_util.dart';
import 'dart:convert';
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
  String alreadyDirector = 'No';

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
      'alreadyDirector': alreadyDirector,
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
    _loadDraft();
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

  Future<void> _pickFile(DirectorFormData data, String field, {List<String> allowedExtensions = const ['jpg', 'jpeg', 'png', 'pdf']}) async {
    FilePickerResult? result = await FilePickerUtil.pickFiles(
      type: FileType.custom,
      allowedExtensions: allowedExtensions,
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

  
  Future<void> _loadDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final draft = await draftService.loadDraft(widget.order.id, 'DirectorDetailsFormScreen');
    if (draft != null) {
      if (mounted) {
        setState(() {

        });
      }
    }
  }

  Future<void> _saveDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final data = <String, dynamic>{

    };
    await draftService.saveDraft(widget.order.id, 'DirectorDetailsFormScreen', data);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Draft saved successfully!'),
        backgroundColor: AppTheme.deepTeal,
      ));
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
        ref.read(draftServiceProvider).clearDraft(widget.order.id, 'DirectorDetailsFormScreen');
        Navigator.pop(context, true); // Success
      } else {
        throw Exception('Failed to upload files: ${response.body}');
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
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Complete Details', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w800, fontSize: 16)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
        actions: const [],
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
                          
                          _buildRadioGroup('Already a Director in another company?', '', ['Yes', 'No'], data.alreadyDirector, (v) => setState(() => data.alreadyDirector = v)),
                          
                          _buildField('Full name', 'Enter your complete name as it appears on your official documents. Include your first name, middle name (if any), and last name.', data.fullNameController, isRequired: true),
                          _buildField('Email', 'Enter your personal email address. This will be used for all communications related to your application.', data.emailController, isRequired: true, keyboardType: TextInputType.emailAddress),
                          _buildField('Phone number', 'Enter your mobile number. This should be a number that you can always be reached on.', data.phoneController, isRequired: true, keyboardType: TextInputType.phone),
                          
                          if (data.alreadyDirector == 'No') ...[
                            _buildField('Father\'s name', 'Enter your father\'s complete name as it appears on your official documents.', data.fatherNameController, isRequired: true),
                            _buildField('DOB', 'Enter your date of birth in DD/MM/YYYY format. This should match the date on your official documents.', data.dobController, isRequired: true, isDate: true),
                            _buildField('Place of birth', 'Enter the city and state where you were born. This should match your birth certificate or other official documents.', data.placeOfBirthController, isRequired: true),
                            
                            _buildRadioGroup('Nationality', 'Select your nationality. Choose "Indian" if you are an Indian citizen, or "Others" if you are a foreign national or NRI.', ['Indian', 'Others'], data.nationality, (v) => setState(() => data.nationality = v)),
                            
                            _buildRadioGroup('Select the occupation that best describes your current professional status.', '', ['Business', 'Employment', 'House wife', 'Student'], data.occupationController.text, (v) => setState(() => data.occupationController.text = v)),

                            _buildField('Education', '', data.educationController, isRequired: true),
                            _buildField('Address', 'Enter your complete residential address where you currently live. with Pin code', data.addressController, isRequired: true),
                            _buildField('PAN', 'Enter your 10-character PAN (Permanent Account Number) issued by the Income Tax Department.', data.panController, isRequired: true),
                            _buildField('Aadhaar Number', 'Enter your 12-digit Aadhaar number issued by UIDAI.', data.aadhaarController, isRequired: true),
                          ],
                          
                          _buildField('DIN Number', 'Enter your 8-digit DIN (Director Identification Number) if you are already a director in another company.', data.dinController, isRequired: data.alreadyDirector == 'Yes'),
                          
                          _buildRadioGroup('I need DSC', 'Select "Yes" if you need a Digital Signature Certificate (DSC) for signing documents electronically.', ['Yes', 'No'], data.needDsc, (v) => setState(() => data.needDsc = v)),
                          
                          _buildRadioGroup('Select your role in the company. You can be a Director, Shareholder, or both Director and Shareholder.', '', ['Director', 'Shareholder', 'Director & Shareholder'], data.role, (v) => setState(() => data.role = v)),
                          
                          _buildField(
                            'Share holding percentage', 
                            'Enter the percentage of shares you will hold in the company. This should be between 0 and 100.', 
                            data.shareholdingController, 
                            isRequired: true, 
                            keyboardType: TextInputType.number,
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) return 'This is a required question';
                              
                              int totalSum = 0;
                              for (var d in _directors) {
                                totalSum += int.tryParse(d.shareholdingController.text) ?? 0;
                              }

                              if (_directors.length == 1 && v == '100') {
                                return 'A single director cannot hold 100% in a Private Limited Company.';
                              }
                              
                              if (totalSum > 100) {
                                return 'Total shareholding cannot exceed 100%. Current total: $totalSum%';
                              }

                              if (index == _directors.length - 1) {
                                bool allFilled = _directors.every((d) => d.shareholdingController.text.isNotEmpty);
                                if (allFilled && totalSum != 100) {
                                  return 'Total must be exactly 100%. Please enter the remaining percentage.';
                                }
                              }
                              return null;
                            },
                          ),
                          if (index == 0)
                            _buildRadioGroup('I\'m Authorized signatory', 'Select "Yes" if you will be an authorized signatory for the company\'s bank accounts and official documents. Yes, I want to be the authorized signatory', ['Yes', 'No'], data.isAuthSignatory, (v) => setState(() => data.isAuthSignatory = v)),
                          
                          const SizedBox(height: 24),
                          const Text('Document Uploads', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppTheme.deepTeal)),
                          const SizedBox(height: 16),
                          
                          _buildFileRow('Photo', 'Upload a recent passport-size photograph (3.5cm x 4.5cm) with a white background.', data.photoPath, () => _pickFile(data, 'photo', allowedExtensions: ['jpg', 'jpeg', 'png'])),
                          _buildFileRow('Signature', 'Upload a clear image of your signature. This is required if you are an authorized signatory.', data.signaturePath, () => _pickFile(data, 'signature', allowedExtensions: ['jpg', 'jpeg', 'png'])),
                          _buildFileRow('Residential address proof', 'Upload proof of your residential address (utility bill, bank statement, etc.). This proof should be on the name of the person and should not be older than two months', data.addressProofPath, () => _pickFile(data, 'addressProof', allowedExtensions: ['pdf'])),
                          _buildFileRow('Aadhaar Card', 'Upload Aadhaar card with front and back side pdf. The system will verify the document using OCR and cross-check with the details provided above.', data.aadhaarPath, () => _pickFile(data, 'aadhaar', allowedExtensions: ['pdf'])),
                          _buildFileRow('PAN Card', 'Upload PAN card. The system will verify the document using OCR and cross-check with the details provided above.', data.panPath, () => _pickFile(data, 'pan', allowedExtensions: ['pdf'])),
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

  Widget _buildField(String label, String hint, TextEditingController controller, {bool isRequired = false, TextInputType keyboardType = TextInputType.text, bool isDate = false, String? Function(String?)? validator}) {
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
              hintText: hint.isNotEmpty ? hint : 'Enter ${label.replaceAll("*", "").trim()}',
              hintStyle: const TextStyle(fontSize: 13, color: Colors.grey, fontWeight: FontWeight.normal),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.black, width: 1.5)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              suffixIcon: isDate ? const Icon(Icons.calendar_today, size: 20, color: Colors.grey) : null,
            ),
            autovalidateMode: AutovalidateMode.onUserInteraction,
            onChanged: (_) {
              if (label.toLowerCase().contains('share holding')) {
                _formKey.currentState?.validate();
              }
            },
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
  if (validator != null) return validator(v);
  return null;
},
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
}
