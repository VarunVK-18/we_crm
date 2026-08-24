import 'package:crm_app/core/utils/error_handler.dart';
import 'package:flutter/material.dart';
import 'dart:async';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/responsive.dart';
import '../../providers/auth_provider.dart';
import 'auth_wrapper.dart';
import '../../providers/navigation_provider.dart';
import 'client_onboarding_screen.dart';
import '../../core/widgets/we_loader.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isPasswordVisible = false;
  bool _isLoading = false;

  void _showAuthDialog({
    required String title,
    required String message,
    bool isError = true,
  }) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              isError ? LucideIcons.alertTriangle : LucideIcons.checkCircle2,
              color: Colors.white,
              size: 24,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    message,
                    style: GoogleFonts.inter(color: Colors.white, fontSize: 13),
                  ),
                ],
              ),
            ),
          ],
        ),
        backgroundColor: isError ? Colors.redAccent.shade700 : AppTheme.deepTeal,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 4),
        elevation: 6,
      ),
    );
  }

  void _showForgotPasswordDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Forgot Password',
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        content: Text(
          'Please call management to reset your password.\n\nManagement: +91 9884521264',
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w400,
            color: Colors.black54,
            height: 1.4,
          ),
        ),
        actionsPadding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: Text(
              'Cancel',
              style: GoogleFonts.inter(
                color: Colors.grey.shade600,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final Uri telUri = Uri.parse('tel:9884521264');
              try {
                if (await canLaunchUrl(telUri)) {
                  await launchUrl(telUri, mode: LaunchMode.externalApplication);
                } else {
                  await launchUrl(telUri);
                }
              } catch (e) {
                debugPrint('Error launching dialer: $e');
              }
            },
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: Text(
              'Call',
              style: GoogleFonts.inter(
                color: AppTheme.corporateBlue,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleSignIn() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      await ref.read(authRepositoryProvider).signIn(
            _emailController.text.trim(),
            _passwordController.text.trim(),
          );
      ref.read(navigationIndexProvider.notifier).state = 0;
      TextInput.finishAutofillContext();
      if (mounted) {
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    } catch (e) {
      showGlobalError(e);
      String title = 'Sign In Failed';
      String message = e.toString().replaceAll('Exception: ', '');

      if (e.toString().contains('wrong-password') ||
          e.toString().contains('user-not-found') ||
          e.toString().contains('invalid-credential') ||
          e.toString().contains('invalid-email')) {
        title = 'Wrong Email/Password';
        message =
            'The email or password you entered is incorrect. Please try again.';
      } else if (e.toString().contains('network-request-failed')) {
        title = 'Network Error';
        message = 'Please check your internet connection and try again.';
      }

      _showAuthDialog(title: title, message: message);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _contactSupport() async {
    final Uri emailLaunchUri = Uri(
      scheme: 'mailto',
      path: 'support@wealthempires.in',
      queryParameters: {'subject': 'Support Request: Requst to create me an new account For We CRM'},
    );

    try {
      if (await canLaunchUrl(emailLaunchUri)) {
        await launchUrl(emailLaunchUri, mode: LaunchMode.externalApplication);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not launch email client.')),
          );
        }
      }
    } catch (e) {
      showGlobalError(e);
      debugPrint('Error launching email: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    Responsive.init(context);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
      ),
      child: PopScope(
        canPop: true,
        child: Scaffold(
          backgroundColor: const Color(0xFF1E1B4B), // Support banner color
          body: SafeArea(
            bottom: false,
            child: Column(
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.only(top: 20, bottom: 20),
                  child: Center(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.asset(
                        'assets/launcher_icon_padded.png',
                        height: 60,
                        fit: BoxFit.contain,
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
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        return SingleChildScrollView(
                          physics: const NeverScrollableScrollPhysics(),
                          child: ConstrainedBox(
                            constraints: BoxConstraints(
                              minHeight: constraints.maxHeight,
                            ),
                            child: IntrinsicHeight(
                              child: Form(
                                key: _formKey,
                                child: AutofillGroup(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.stretch,
                                    children: [
                                      const SizedBox(height: 50),
                                      
                                      Text(
                                        'Welcome Back',
                                        textAlign: TextAlign.center,
                                        style: GoogleFonts.poppins(
                                          fontSize: 18,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.black87,
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        'Your business, your work, all in one place',
                                        textAlign: TextAlign.center,
                                        style: GoogleFonts.inter(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w400,
                                          color: Colors.grey.shade600,
                                        ),
                                      ),
                                      
                                      const SizedBox(height: 28),

                                      // Email Field
                                      TextFormField(
                                        controller: _emailController,
                                        keyboardType: TextInputType.emailAddress,
                                        autofillHints: const [AutofillHints.email],
                                        textInputAction: TextInputAction.next,
                                        style: GoogleFonts.inter(
                                            fontWeight: FontWeight.w500,
                                            fontSize: 14,
                                            color: Colors.black87),
                                        decoration: InputDecoration(
                                          hintText: 'Email',
                                          hintStyle: GoogleFonts.inter(
                                              color: Colors.grey.shade500,
                                              fontWeight: FontWeight.w400,
                                              fontSize: 14),
                                          contentPadding:
                                              const EdgeInsets.symmetric(
                                                  horizontal: 16, vertical: 14),
                                          border: OutlineInputBorder(
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              borderSide: BorderSide(
                                                  color: Colors.grey.shade300)),
                                          enabledBorder: OutlineInputBorder(
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              borderSide: BorderSide(
                                                  color: Colors.grey.shade300)),
                                          focusedBorder: OutlineInputBorder(
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              borderSide: BorderSide(
                                                  color: Colors.grey.shade400)),
                                          filled: true,
                                          fillColor: Colors.white,
                                        ),
                                        validator: (val) {
                                          if (val == null || val.isEmpty) {
                                            return 'Email is required';
                                          }
                                          if (!RegExp(
                                                  r"^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$")
                                              .hasMatch(val)) {
                                            return 'Enter a valid email address';
                                          }
                                          return null;
                                        },
                                      ),

                                      const SizedBox(height: 20),

                                      // Password Field
                                      TextFormField(
                                        controller: _passwordController,
                                        obscureText: !_isPasswordVisible,
                                        autofillHints: const [
                                          AutofillHints.password
                                        ],
                                        textInputAction: TextInputAction.done,
                                        onEditingComplete: () =>
                                            TextInput.finishAutofillContext(),
                                        style: GoogleFonts.inter(
                                            fontWeight: FontWeight.w500,
                                            fontSize: 14,
                                            color: Colors.black87),
                                        decoration: InputDecoration(
                                          hintText: 'Password',
                                          hintStyle: GoogleFonts.inter(
                                              color: Colors.grey.shade500,
                                              fontWeight: FontWeight.w400,
                                              fontSize: 14),
                                          contentPadding:
                                              const EdgeInsets.symmetric(
                                                  horizontal: 16, vertical: 14),
                                          border: OutlineInputBorder(
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              borderSide: BorderSide(
                                                  color: Colors.grey.shade300)),
                                          enabledBorder: OutlineInputBorder(
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              borderSide: BorderSide(
                                                  color: Colors.grey.shade300)),
                                          focusedBorder: OutlineInputBorder(
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              borderSide: BorderSide(
                                                  color: Colors.grey.shade400)),
                                          filled: true,
                                          fillColor: Colors.white,
                                          suffixIcon: IconButton(
                                            icon: Icon(
                                                _isPasswordVisible
                                                    ? LucideIcons.eye
                                                    : LucideIcons.eyeOff,
                                                color: Colors.black54,
                                                size: 20),
                                            onPressed: () => setState(() =>
                                                _isPasswordVisible =
                                                    !_isPasswordVisible),
                                          ),
                                        ),
                                        validator: (val) {
                                          if (val == null || val.isEmpty) {
                                            return 'Password is required';
                                          }
                                          if (val.length < 6) {
                                            return 'Password must be at least 6 characters';
                                          }
                                          return null;
                                        },
                                      ),

                                      const SizedBox(height: 4),

                                      Align(
                                        alignment: Alignment.centerRight,
                                        child: TextButton(
                                          style: TextButton.styleFrom(
                                            padding: const EdgeInsets.symmetric(vertical: 0, horizontal: 8),
                                          ),
                                          onPressed: _showForgotPasswordDialog,
                                          child: Text(
                                            'Forgot password?',
                                            style: GoogleFonts.inter(
                                                color: Colors.grey.shade600,
                                                fontSize: 14,
                                                fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ),
                                      ),

                                      const SizedBox(height: 24),

                                      ElevatedButton(
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: Colors.black,
                                          foregroundColor: Colors.white,
                                          padding: const EdgeInsets.symmetric(
                                              vertical: 14),
                                          shape: RoundedRectangleBorder(
                                              borderRadius:
                                                  BorderRadius.circular(30)),
                                          elevation: 0,
                                        ),
                                        onPressed:
                                            _isLoading ? null : _handleSignIn,
                                        child: _isLoading
                                            ? const Center(
                                                child: WeLoader(
                                                    size: 16,
                                                    color: Colors.white,
                                                ),
                                              )
                                            : Text('Login',
                                                style: GoogleFonts.inter(
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.w600,
                                                    letterSpacing: 0.5)),
                                      ),

                                      const Spacer(),

                                      // Certificate Image - Made perfect
                                      Center(
                                        child: ClipRRect(
                                          borderRadius: BorderRadius.circular(16),
                                          child: Image.asset(
                                            'assets/banner images/certification01.jpg',
                                            height: 180,
                                            fit: BoxFit.contain,
                                          ),
                                        ),
                                      ),
                                      
                                      const SizedBox(height: 16),

                                      // Footer Sign Up Link
                                      Padding(
                                        padding: const EdgeInsets.only(bottom: 32),
                                        child: Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            Text(
                                              'New to Wealth Empires? ',
                                              style: GoogleFonts.inter(
                                                  color: Colors.grey.shade600,
                                                  fontSize: 14),
                                            ),
                                            GestureDetector(
                                              onTap: () {
                                                Navigator.of(context).pushReplacement(
                                                  PageRouteBuilder(
                                                    pageBuilder: (context, animation, secondaryAnimation) =>
                                                        const ClientOnboardingScreen(),
                                                    transitionDuration: Duration.zero,
                                                    reverseTransitionDuration: Duration.zero,
                                                  ),
                                                );
                                              },
                                              child: Text(
                                                'Join Now',
                                                style: GoogleFonts.inter(
                                                  color: AppTheme.corporateBlue,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 14,
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
                            ),
                          ),
                        );
                      }
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }


  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
