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
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const AuthWrapper()),
          (route) => false,
        );
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
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,
      ),
      child: PopScope(
        canPop: false,
        onPopInvoked: (didPop) {
          if (didPop) return;
          Navigator.of(context).pushReplacement(
            PageRouteBuilder(
              pageBuilder: (context, animation, secondaryAnimation) =>
                  const ClientOnboardingScreen(),
              transitionDuration: Duration.zero,
              reverseTransitionDuration: Duration.zero,
            ),
          );
        },
        child: Scaffold(
        backgroundColor: const Color(0xFFFDFBF7),
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          toolbarHeight: 80,
          leading: Padding(
            padding: const EdgeInsets.only(top: 24.0, left: 8.0),
            child: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black),
            onPressed: () {
              Navigator.of(context).pushReplacement(
                PageRouteBuilder(
                  pageBuilder: (context, animation, secondaryAnimation) =>
                      const ClientOnboardingScreen(),
                  transitionDuration: Duration.zero,
                  reverseTransitionDuration: Duration.zero,
                ),
              );
            },
          ),
          ),
        ),
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
                            child: AutofillGroup(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  SizedBox(height: constraints.maxHeight * 0.02),
                                  Center(
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(30),
                                      child: Image.asset(
                                        'assets/Startup Doctor logo (1).png',
                                        height: constraints.maxHeight < 700 ? 115 : 145,
                                        width: constraints.maxHeight < 700 ? 115 : 145,
                                        fit: BoxFit.cover,
                                        color: const Color(0xFFFDFBF7),
                                        colorBlendMode: BlendMode.multiply,
                                      ),
                                    ),
                                  ),

                                  SizedBox(height: constraints.maxHeight * 0.02),

                                  // Email Field
                                  Text(
                                  'Email',
                                    style: GoogleFonts.inter(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.grey[700]),
                                  ),
                                  const SizedBox(height: 8),
                                  TextFormField(
                                    controller: _emailController,
                                    keyboardType: TextInputType.emailAddress,
                                    autofillHints: const [AutofillHints.email],
                                    textInputAction: TextInputAction.next,
                                    style: GoogleFonts.inter(
                                        fontWeight: FontWeight.w600,
                                        fontSize: 15,
                                        color: Colors.black87),
                                    decoration: InputDecoration(
                                      hintText: 'mycompany@company.com',
                                      hintStyle: GoogleFonts.inter(
                                          color: Colors.grey[400],
                                          fontWeight: FontWeight.w600,
                                          fontSize: 15),
                                      contentPadding:
                                          const EdgeInsets.symmetric(
                                              horizontal: 16, vertical: 18),
                                      border: OutlineInputBorder(
                                          borderRadius:
                                              BorderRadius.circular(30),
                                          borderSide: BorderSide(
                                              color: Colors.grey[300]!)),
                                      enabledBorder: OutlineInputBorder(
                                          borderRadius:
                                              BorderRadius.circular(30),
                                          borderSide: BorderSide(
                                              color: Colors.grey[300]!)),
                                      focusedBorder: OutlineInputBorder(
                                          borderRadius:
                                              BorderRadius.circular(30),
                                          borderSide: BorderSide(
                                              color: Colors.grey[300]!)),
                                    ),
                                    validator: (val) {
                                      if (val == null || val.isEmpty) {
                                        return 'Email is required';
                                      }
                                      if (!RegExp(
                                              r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')
                                          .hasMatch(val)) {
                                        return 'Enter a valid email address';
                                      }
                                      return null;
                                    },
                                  ),

                                  SizedBox(height: constraints.maxHeight * 0.015),

                                  // Password Field
                                  Text(
                                    'Password',
                                    style: GoogleFonts.inter(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.grey[700]),
                                  ),
                                  const SizedBox(height: 8),
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
                                        fontWeight: FontWeight.w600,
                                        fontSize: 15,
                                        color: Colors.black87),
                                    decoration: InputDecoration(
                                      hintText: '••••••••',
                                      hintStyle: GoogleFonts.inter(
                                          color: Colors.grey[400],
                                          fontWeight: FontWeight.w600,
                                          fontSize: 16,
                                          letterSpacing: 2),
                                      contentPadding:
                                          const EdgeInsets.symmetric(
                                              horizontal: 16, vertical: 18),
                                      border: OutlineInputBorder(
                                          borderRadius:
                                              BorderRadius.circular(30),
                                          borderSide: BorderSide(
                                              color: Colors.grey[300]!)),
                                      enabledBorder: OutlineInputBorder(
                                          borderRadius:
                                              BorderRadius.circular(30),
                                          borderSide: BorderSide(
                                              color: Colors.grey[300]!)),
                                      focusedBorder: OutlineInputBorder(
                                          borderRadius:
                                              BorderRadius.circular(30),
                                          borderSide: BorderSide(
                                              color: Colors.grey[300]!)),
                                      suffixIcon: IconButton(
                                        icon: Icon(
                                            _isPasswordVisible
                                                ? LucideIcons.eye
                                                : LucideIcons.eyeOff,
                                            color: Colors.black87,
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

                                  SizedBox(height: constraints.maxHeight * 0.01),

                                  Align(
                                    alignment: Alignment.centerRight,
                                    child: TextButton(
                                      style: TextButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                                      ),
                                      onPressed: () {
                                        _showAuthDialog(
                                          title: 'Notice',
                                          message:
                                              'Contact Support To Reset Your Password.',
                                          isError: false,
                                        );
                                      },
                                      child: Text(
                                        'Forgot password?',
                                        style: GoogleFonts.inter(
                                            color: Colors.grey[600],
                                            fontSize: 15,
                                            fontWeight: FontWeight.w600,
                                            letterSpacing: 0.3),
                                      ),
                                    ),
                                  ),

                                  SizedBox(height: constraints.maxHeight * 0.01),

                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.black,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(
                                          vertical: 18),
                                      shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(30)),
                                      elevation: 0,
                                    ),
                                    onPressed:
                                        _isLoading ? null : _handleSignIn,
                                    child: _isLoading
                                        ? const SizedBox(
                                            height: 24,
                                            width: 24,
                                            child: CircularProgressIndicator(
                                                color: Colors.white,
                                                strokeWidth: 2))
                                        : Text('Login',
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
                      ),
                      SliverFillRemaining(
                        hasScrollBody: false,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              const SizedBox(height: 4),
              Container(
                padding: EdgeInsets.symmetric(vertical: constraints.maxHeight * 0.015),
                child: Image.asset(
                  'assets/banner images/certification01.jpg',
                  fit: BoxFit.contain,
                  color: const Color(0xFFFDFBF7),
                  colorBlendMode: BlendMode.multiply,
                ),
              ),
                              SizedBox(height: constraints.maxHeight * 0.02),

                              // Footer Sign Up Link
                              Padding(
                                padding: const EdgeInsets.only(bottom: 24),
                                child: Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      'New to Wealth Empires? ',
                                      style: GoogleFonts.inter(
                                          color: Colors.grey[600],
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
                                          color: Colors.black,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                          decoration:
                                              TextDecoration.underline,
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

