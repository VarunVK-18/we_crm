import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import '../../core/theme/app_theme.dart';
import '../../core/services/ocr_service.dart';
import '../../providers/pan_provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/port.dart';

class PanUploadScreen extends ConsumerStatefulWidget {
  const PanUploadScreen({super.key});

  @override
  ConsumerState<PanUploadScreen> createState() => _PanUploadScreenState();
}

class _PanUploadScreenState extends ConsumerState<PanUploadScreen> {
  final ImagePicker _picker = ImagePicker();
  final OcrService _ocrService = OcrService();
  
  File? _imageFile;
  bool _isScanning = false;
  ExtractedPanData? _extractedData;

  // Controllers for verification
  final TextEditingController _panController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _fatherNameController = TextEditingController();
  final TextEditingController _dobController = TextEditingController();

  @override
  void dispose() {
    _ocrService.dispose();
    _panController.dispose();
    _nameController.dispose();
    _fatherNameController.dispose();
    _dobController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? pickedFile = await _picker.pickImage(source: source);
      if (pickedFile != null) {
        final file = File(pickedFile.path);
        final int fileSize = await file.length();
        const int maxSize = 2 * 1024 * 1024; // 2MB
        if (fileSize > maxSize) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('File too large! Maximum allowed size is 2 MB.')),
          );
          return;
        }
        setState(() {
          _imageFile = file;
          _extractedData = null; // reset
        });
        _scanImage();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error picking image: $e')),
      );
    }
  }

  Future<void> _scanImage() async {
    if (_imageFile == null) return;

    setState(() {
      _isScanning = true;
    });

    try {
      final data = await _ocrService.extractPanData(_imageFile!);
      setState(() {
        _extractedData = data;
        _panController.text = data.panNumber;
        _nameController.text = data.name;
        _fatherNameController.text = data.fatherName;
        _dobController.text = data.dob;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to extract text: $e')),
      );
    } finally {
      setState(() {
        _isScanning = false;
      });
    }
  }

  Future<void> _saveData() async {
    // Collect verified data
    final verifiedData = {
      'panNumber': _panController.text,
      'name': _nameController.text,
      'fatherName': _fatherNameController.text,
      'dob': _dobController.text,
    };

    final user = ref.read(userProfileProvider).value;
    if (user != null) {
      try {
        final uri = Uri.parse('$kBaseUrl/api/users/profile/${user.id}/pan');
        final request = http.MultipartRequest('POST', uri);
        request.fields['panNumber'] = verifiedData['panNumber']!;
        request.fields['name'] = verifiedData['name']!;
        request.fields['fatherName'] = verifiedData['fatherName']!;
        request.fields['dob'] = verifiedData['dob']!;
        
        if (_imageFile != null) {
          request.files.add(await http.MultipartFile.fromPath('panFile', _imageFile!.path));
        }

        final response = await request.send();
        if (response.statusCode != 200) {
          throw Exception('Failed to save to backend');
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to sync to backend: $e'), backgroundColor: Colors.red),
          );
        }
        return;
      }
    }

    // Save to our local PAN Provider for auto-fill
    ref.read(panProvider.notifier).addPanCard(ExtractedPanData(
      panNumber: verifiedData['panNumber']!,
      name: verifiedData['name']!,
      fatherName: verifiedData['fatherName']!,
      dob: verifiedData['dob']!,
    ));

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('PAN Card verified and saved successfully!'),
          backgroundColor: Colors.green,
        ),
      );
      // Pop screen or navigate back
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppTheme.backgroundLight,
        elevation: 0,
        title: const Text(
          'Upload PAN Card',
          style: TextStyle(
            color: AppTheme.deepTeal,
            fontWeight: FontWeight.w900,
          ),
        ),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: AppTheme.deepTeal),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Image Preview or Placeholder
            Stack(
              children: [
                GestureDetector(
                  onTap: () => _showPickerOptions(context),
                  child: Container(
                    height: 200,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: AppTheme.deepTeal.withOpacity(0.1),
                        width: 2,
                      ),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: _imageFile != null
                        ? Image.file(
                            _imageFile!,
                            fit: BoxFit.cover,
                            width: double.infinity,
                          )
                        : Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                LucideIcons.uploadCloud,
                                size: 48,
                                color: AppTheme.deepTeal.withOpacity(0.4),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                'Tap to upload PAN Card',
                                style: TextStyle(
                                  color: AppTheme.deepTeal.withOpacity(0.6),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                  ),
                ),
                if (_imageFile != null)
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Material(
                      color: Colors.transparent,
                      child: IconButton(
                        icon: const Icon(LucideIcons.eye, color: Colors.white),
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.black.withOpacity(0.6),
                        ),
                        onPressed: () => _showFullScreenImage(context),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 24),

            if (_isScanning)
              const Center(
                child: Column(
                  children: [
                    CircularProgressIndicator(color: AppTheme.deepTeal),
                    SizedBox(height: 16),
                    Text('Analyzing PAN Card using AI...'),
                  ],
                ),
              )
            else if (_extractedData != null)
              _buildVerificationForm(),
            
            const SizedBox(height: 32),
            _buildSavedPanList(),
          ],
        ),
      ),
    );
  }

  Widget _buildSavedPanList() {
    final savedPans = ref.watch(panProvider);
    
    if (savedPans.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Saved PAN Cards',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: AppTheme.deepTeal,
          ),
        ),
        const SizedBox(height: 16),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: savedPans.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final pan = savedPans[index];
            return Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.corporateBlue.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(LucideIcons.creditCard, color: AppTheme.corporateBlue),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          pan.name.isNotEmpty ? pan.name : 'Unknown Name',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        Text(
                          pan.panNumber,
                          style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(LucideIcons.trash2, color: Colors.redAccent, size: 20),
                    onPressed: () {
                      ref.read(panProvider.notifier).removePanCard(pan.panNumber);
                    },
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildVerificationForm() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Verify Extracted Details',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: AppTheme.deepTeal,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Please verify the details extracted by AI and correct any mistakes.',
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 24),
          _buildTextField('PAN Number', _panController, LucideIcons.creditCard),
          const SizedBox(height: 16),
          _buildTextField('Name', _nameController, LucideIcons.user),
          const SizedBox(height: 16),
          _buildTextField('Father\'s Name', _fatherNameController, LucideIcons.users),
          const SizedBox(height: 16),
          _buildTextField('Date of Birth', _dobController, LucideIcons.calendar),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _saveData,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.deepTeal,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: const Text(
                'Verify & Save',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, IconData icon) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: AppTheme.deepTeal.withOpacity(0.5)),
        filled: true,
        fillColor: AppTheme.backgroundLight,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.accentCyan, width: 2),
        ),
      ),
    );
  }

  void _showFullScreenImage(BuildContext context) {
    if (_imageFile == null) return;
    showDialog(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: EdgeInsets.zero,
        child: Stack(
          fit: StackFit.expand,
          children: [
            InteractiveViewer(
              child: Image.file(_imageFile!, fit: BoxFit.contain),
            ),
            Positioned(
              top: 40,
              right: 16,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 30),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showPickerOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(LucideIcons.camera, color: AppTheme.deepTeal),
              title: const Text('Take a Photo'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(LucideIcons.image, color: AppTheme.deepTeal),
              title: const Text('Choose from Gallery'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }
}
