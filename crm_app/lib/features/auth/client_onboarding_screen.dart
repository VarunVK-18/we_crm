import 'package:crm_app/core/utils/error_handler.dart';
import 'package:flutter/material.dart';
import 'dart:async';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import 'package:dropdown_button2/dropdown_button2.dart';
import 'login_screen.dart';

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
    'OPC',
    'Proprietorship',
    'MSME',
    'MCA Compliance',
    'TDS',
    'PF',
    'Trade Mark',
    'Copyright',
    'Patent',
    'GST Registration',
    'GST filing',
    'GST Cancelation',
    'ITR',
    'DUNS',
    'DPIIT',
    'ISO',
    'FSSAI',
    'DSC',
    'IE code',
    'LEI',
    'BIS',
    'RoHS',
    'CE',
  ];

  bool _isLoading = false;

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
    required String label,
    required String hintText,
    TextInputType keyboardType = TextInputType.text,
    String? Function(String?)? validator,
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: Colors.grey[700]),
        ),
        const SizedBox(height: 4),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          textInputAction: TextInputAction.next,
          maxLines: maxLines,
          style: GoogleFonts.inter(
              fontWeight: FontWeight.w600, fontSize: 15, color: Colors.black87),
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: GoogleFonts.inter(
                color: Colors.grey[400],
                fontWeight: FontWeight.w600,
                fontSize: 14),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(30),
                borderSide: BorderSide(color: Colors.grey[300]!)),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(30),
                borderSide: BorderSide(color: Colors.grey[300]!)),
            focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(30),
                borderSide: BorderSide(color: Colors.grey[300]!)),
            errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(30),
                borderSide: const BorderSide(color: Colors.redAccent)),
            focusedErrorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(30),
                borderSide: const BorderSide(color: Colors.redAccent, width: 2)),
            filled: true,
            fillColor: Colors.white,
          ),
          validator: validator,
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFDFBF7),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 500),
          child: SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                return CustomScrollView(
                  physics: const ClampingScrollPhysics(),
                  slivers: [
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Center(
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(16),
                                  child: Image.asset(
                                    'assets/Startup Doctor logo (1).png',
                                    height: 110,
                                    width: 110,
                                    fit: BoxFit.cover,
                                    color: const Color(0xFFFDFBF7),
                                    colorBlendMode: BlendMode.multiply,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Start With A Service',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.inter(
                                  fontSize: 26,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.5,
                                  color: Colors.black,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Staying Legally Sound In One Click',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.inter(
                                  fontSize: 14,
                                  color: Colors.grey[600],
                                ),
                              ),
                              const SizedBox(height: 16),
                              
                              _buildTextField(
                                controller: _nameController,
                                label: 'Name',
                                hintText: 'Enter your name',
                                validator: (value) =>
                                    value == null || value.isEmpty ? 'Name is required' : null,
                              ),
                              
                              _buildTextField(
                                controller: _emailController,
                                label: 'Email Address',
                                hintText: 'Enter email address',
                                keyboardType: TextInputType.emailAddress,
                                validator: (value) {
                                  if (value == null || value.isEmpty) {
                                    return 'Email is required';
                                  }
                                  if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                                    return 'Enter a valid email address';
                                  }
                                  return null;
                                },
                              ),

                              _buildTextField(
                                controller: _phoneController,
                                label: 'Phone Number',
                                hintText: 'Enter phone number',
                                keyboardType: TextInputType.phone,
                              ),

                              _buildTextField(
                                controller: _companyNameController,
                                label: 'Company Name',
                                hintText: 'Enter company name',
                                validator: (value) =>
                                    value == null || value.isEmpty ? 'Company Name is required' : null,
                              ),

                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Select a Service', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.grey[700])),
                                  const SizedBox(height: 4),
                                  DropdownButtonFormField2<String>(
                                    isExpanded: true,
                                    valueListenable: _serviceNotifier,
                                    decoration: InputDecoration(
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide(color: Colors.grey[300]!)),
                                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide(color: Colors.grey[300]!)),
                                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide(color: Colors.grey[300]!)),
                                      filled: true,
                                      fillColor: Colors.white,
                                    ),
                                    hint: Text('Select a Service', style: GoogleFonts.inter(color: Colors.grey[400], fontWeight: FontWeight.w600, fontSize: 14)),
                                    items: _servicesList.map((item) => DropdownItem<String>(
                                      value: item,
                                      child: Text(item, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15, color: Colors.black87)),
                                    )).toList(),
                                    onChanged: (value) {
                                      _serviceNotifier.value = value;
                                      _serviceController.text = value ?? '';
                                    },
                                    buttonStyleData: const FormFieldButtonStyleData(padding: EdgeInsets.only(right: 8)),
                                    iconStyleData: const IconStyleData(icon: Icon(Icons.arrow_drop_down, color: Colors.black45)),
                                    dropdownStyleData: DropdownStyleData(
                                      maxHeight: 250,
                                      decoration: BoxDecoration(borderRadius: BorderRadius.circular(30)),
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
                                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(30)),
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
                                  const SizedBox(height: 16),
                                ],
                              ),

                              const SizedBox(height: 24),
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.black,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(30)),
                                  elevation: 0,
                                ),
                                onPressed: _isLoading ? null : _handleOnboardingSubmit,
                                child: _isLoading
                                    ? const SizedBox(
                                        height: 24,
                                        width: 24,
                                        child: CircularProgressIndicator(
                                            color: Colors.white, strokeWidth: 2))
                                    : Text('Lets Begin',
                                        style: GoogleFonts.inter(
                                            fontSize: 16,
                                            fontWeight: FontWeight.w800,
                                            letterSpacing: 0.5)),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            Padding(
                              padding: const EdgeInsets.only(bottom: 24),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    'Already have an account? ',
                                    style: GoogleFonts.inter(
                                        color: Colors.grey[600], fontSize: 14),
                                  ),
                                  GestureDetector(
                                    onTap: _navigateToLogin,
                                    child: Text(
                                      'Log in',
                                      style: GoogleFonts.inter(
                                        color: Colors.black,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                        decoration: TextDecoration.underline,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _companyNameController.dispose();
    _serviceController.dispose();
    _serviceNotifier.dispose();
    _serviceSearchController.dispose();
    super.dispose();
  }
}
