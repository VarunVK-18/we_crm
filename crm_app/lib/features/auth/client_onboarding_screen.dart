import 'package:crm_app/core/utils/error_handler.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import 'package:dropdown_button2/dropdown_button2.dart';
import 'login_screen.dart';
import 'dart:async';
import 'package:flutter/services.dart';

class ClientOnboardingScreen extends ConsumerStatefulWidget {
  const ClientOnboardingScreen({super.key});

  @override
  ConsumerState<ClientOnboardingScreen> createState() =>
      _ClientOnboardingScreenState();
}

class _ClientOnboardingScreenState extends ConsumerState<ClientOnboardingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _companyNameController = TextEditingController();
  final _serviceController = TextEditingController();
  
  late final ValueNotifier<String?> _serviceNotifier = ValueNotifier(_serviceController.text.isEmpty ? null : _serviceController.text);
  final _serviceSearchController = TextEditingController();

  final List<String> _servicesList = [
    'Private Limited Incorporation',
    'LLP Incorporation',
    'OPC Incorporation',
    'Proprietorship Registration',
    'MSME Registration',
    'MCA Compliance',
    'TDS Return Filing',
    'PF Registration & Compliance',
    'Trademark Registration',
    'Copyright Registration',
    'Patent Registration',
    'GST Registration',
    'GST Returns Filing',
    'GST Cancellation',
    'Income Tax Return (ITR)',
    'DUNS Number',
    'DPIIT Recognition',
    'ISO Certification',
    'FSSAI Registration',
    'Digital Signature Certificate (DSC)',
    'Import Export Code (IEC)',
    'LEI Registration',
    'BIS Certification',
    'RoHS Certification',
    'CE Certification',
  ];

  bool _isLoading = false;
  bool _agreedToTerms = false;

  void _showAuthDialog({
    required String title,
    required String message,
    bool isError = true,
  }) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        backgroundColor: Colors.white,
        title: Row(
          children: [
            Icon(
              isError ? LucideIcons.alertTriangle : LucideIcons.checkCircle2,
              color: isError ? Colors.redAccent : AppTheme.deepTeal,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        content: Text(message, style: TextStyle(color: Colors.grey[700])),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK',
                style: TextStyle(
                    fontWeight: FontWeight.bold, color: Colors.black)),
          ),
        ],
      ),
    );
  }

  Future<void> _handleOnboardingSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_serviceController.text.isEmpty) {
      _showAuthDialog(title: 'Service Required', message: 'Please select a service.');
      return;
    }
    if (!_agreedToTerms) {
      _showAuthDialog(title: 'Terms & Conditions', message: 'Please agree to the Terms of Services & Privacy Policy.');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final payload = {
        'name': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'phone': _phoneController.text.trim(),
        'company_name': _companyNameController.text.trim(),
        'company_type': _serviceController.text.trim(),
      };

      await ref.read(authRepositoryProvider).submitClientOnboarding(payload);

      _showAuthDialog(
        title: 'Request Submitted',
        message: 'Our team will reach out to you soon.',
        isError: false,
      );

      // Reset form
      _nameController.clear();
      _emailController.clear();
      _phoneController.clear();
      _companyNameController.clear();
      _serviceController.clear();
      _serviceNotifier.value = null;
      
      TextInput.finishAutofillContext();
    } catch (e) {
      showGlobalError(e);
      _showAuthDialog(
        title: 'Onboarding Failed',
        message: e.toString().replaceAll('Exception: ', ''),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _navigateToLogin() {
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) =>
            const LoginScreen(),
        transitionDuration: Duration.zero,
        reverseTransitionDuration: Duration.zero,
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hintText,
    TextInputType keyboardType = TextInputType.text,
    String? Function(String?)? validator,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        style: GoogleFonts.inter(fontSize: 14),
        decoration: InputDecoration(
          hintText: hintText,
          hintStyle: GoogleFonts.inter(fontSize: 14, color: Colors.grey.shade500),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade400),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Colors.redAccent),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Colors.redAccent, width: 2),
          ),
          filled: true,
          fillColor: Colors.white,
        ),
        validator: validator,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: const Color(0xFF1E1B4B), // Support banner color
        body: SafeArea(
          bottom: false,
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.only(top: 40, bottom: 40),
              child: Center(
                child: Text(
                  'Startup Doctor',
                  style: GoogleFonts.poppins(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            
            // White Container
            Expanded(
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 24),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(32),
                    topRight: Radius.circular(32),
                  ),
                ),
                child: SingleChildScrollView(
                  physics: const ClampingScrollPhysics(),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const SizedBox(height: 24),
                        Text(
                          'Start With A Service',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.poppins(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: Colors.black,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Staying Legally Sound In One Click',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        const SizedBox(height: 24),
                        
                        _buildTextField(
                          controller: _nameController,
                          hintText: 'Name',
                          validator: (value) => value == null || value.isEmpty ? 'Required' : null,
                        ),
                        
                        _buildTextField(
                          controller: _emailController,
                          hintText: 'Email Address',
                          keyboardType: TextInputType.emailAddress,
                          validator: (value) {
                            if (value == null || value.isEmpty) return 'Required';
                            if (!value.contains('@')) return 'Invalid email';
                            return null;
                          },
                        ),
                        
                        _buildTextField(
                          controller: _phoneController,
                          hintText: 'Mobile Number',
                          keyboardType: TextInputType.phone,
                          validator: (value) => value == null || value.isEmpty ? 'Required' : null,
                        ),
                        
                        _buildTextField(
                          controller: _companyNameController,
                          hintText: 'Company Name',
                          validator: (value) => value == null || value.isEmpty ? 'Required' : null,
                        ),
                        
                        Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: DropdownButtonFormField2<String>(
                                  isExpanded: true,
                                  decoration: InputDecoration(
                                    contentPadding: const EdgeInsets.only(left: 0, right: 16, top: 12, bottom: 12),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade400)),
                                    filled: true,
                                    fillColor: Colors.white,
                                  ),
                                  hint: Text('Select Service', style: GoogleFonts.inter(color: Colors.grey.shade500, fontSize: 14, fontWeight: FontWeight.w400)),
                                  items: _servicesList.map((item) => DropdownItem<String>(
                                    value: item,
                                    child: Text(item, style: GoogleFonts.inter(fontSize: 14, color: Colors.black87, fontWeight: FontWeight.w400)),
                                  )).toList(),
                                  valueListenable: _serviceNotifier,
                                  onChanged: (value) {
                                    setState(() {
                                      _serviceController.text = value ?? '';
                                      _serviceNotifier.value = value;
                                    });
                                  },
                                  buttonStyleData: const FormFieldButtonStyleData(
                                    padding: EdgeInsets.only(right: 14),
                                  ),
                                  iconStyleData: const IconStyleData(icon: Icon(Icons.arrow_drop_down, color: Colors.black45)),
                                  dropdownStyleData: DropdownStyleData(
                                    maxHeight: 250,
                                    decoration: BoxDecoration(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  menuItemStyleData: const MenuItemStyleData(padding: EdgeInsets.symmetric(horizontal: 16)),
                                  dropdownSearchData: DropdownSearchData(
                                    searchController: _serviceSearchController,
                                    searchBarWidgetHeight: 50,
                                    searchBarWidget: Container(
                                      height: 50,
                                      padding: const EdgeInsets.only(top: 8, bottom: 4, right: 8, left: 8),
                                      child: TextFormField(
                                        expands: true,
                                        maxLines: null,
                                        controller: _serviceSearchController,
                                        decoration: InputDecoration(
                                          isDense: true,
                                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                          hintText: 'Search service...',
                                          hintStyle: const TextStyle(fontSize: 12),
                                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                        ),
                                      ),
                                    ),
                                    searchMatchFn: (item, searchValue) {
                                      return (item.value.toString().toLowerCase().contains(searchValue.toLowerCase()));
                                    },
                                  ),
                                  onMenuStateChange: (isOpen) {
                                    if (!isOpen) _serviceSearchController.clear();
                                  },
                                ),
                        ),
                        
                        const SizedBox(height: 16),
                        
                        // Terms & Conditions
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SizedBox(
                              width: 24,
                              height: 24,
                              child: Checkbox(
                                value: _agreedToTerms,
                                onChanged: (value) => setState(() => _agreedToTerms = value ?? false),
                                activeColor: Colors.black,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                                side: BorderSide(color: Colors.grey.shade400),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text.rich(
                                TextSpan(
                                  children: [
                                    TextSpan(text: 'I agree to the ', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade700)),
                                    TextSpan(text: 'Terms of Services', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black)),
                                    TextSpan(text: ' & ', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade700)),
                                    TextSpan(text: 'Privacy Policy', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black)),
                                  ]
                                )
                              )
                            )
                          ]
                        ),
                        
                        const SizedBox(height: 24),
                        
                        // Submit button
                        SizedBox(
                          height: 50,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _handleOnboardingSubmit,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.black, 
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(28),
                              ),
                              elevation: 0,
                            ),
                            child: _isLoading
                                ? const SizedBox(
                                    height: 24,
                                    width: 24,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                  )
                                : Text(
                                    'Submit',
                                    style: GoogleFonts.poppins(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                          ),
                        ),
                        
                        const SizedBox(height: 20),
                        
                        // Login link
                        Center(
                          child: GestureDetector(
                            onTap: _navigateToLogin,
                            child: Text.rich(
                              TextSpan(
                                children: [
                                  TextSpan(text: 'Already have an account? ', style: GoogleFonts.inter(fontSize: 14, color: Colors.grey.shade700)),
                                  TextSpan(text: 'Login', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.corporateBlue)),
                                ]
                              )
                            ),
                          ),
                        ),
                        
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    ));
  }
}
