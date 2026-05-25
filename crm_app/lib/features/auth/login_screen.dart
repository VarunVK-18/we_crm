import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/responsive.dart';
import '../../providers/auth_provider.dart';

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
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        content: Text(message, style: TextStyle(color: Colors.grey[700])),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'OK',
              style: TextStyle(fontWeight: FontWeight.bold),
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
    } catch (e) {
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
      path: 'kumarvarun43255@gmail.com',
      queryParameters: {'subject': 'Support Request: CRM Account Access'},
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
      child: Scaffold(
        backgroundColor: Colors.white,
        body: Row(
          children: [
            // Left Side: Branding (Desktop only)
            if (MediaQuery.of(context).size.width > 900)
              Expanded(
                flex: 1,
                child: Container(
                  decoration: BoxDecoration(gradient: AppTheme.premiumGradient),
                  child: Padding(
                    padding: const EdgeInsets.all(64.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        TweenAnimationBuilder<double>(
                          duration: const Duration(seconds: 1),
                          tween: Tween(begin: 0.0, end: 1.0),
                          builder: (context, value, child) {
                            return Opacity(
                              opacity: value,
                              child: Transform.translate(
                                offset: Offset(0, 20 * (1 - value)),
                                child: child,
                              ),
                            );
                          },
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Official Logo Branding - Merged with background
                              Container(
                                padding: const EdgeInsets.all(24),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(24),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(
                                        alpha: 0.1,
                                      ),
                                      blurRadius: 20,
                                      offset: const Offset(0, 10),
                                    ),
                                  ],
                                ),
                                child: Image.asset(
                                  'assets/logo.jpg',
                                  height: 180,
                                  width: 180,
                                  fit: BoxFit.contain,
                                ),
                              ),
                              const SizedBox(height: 32),
                              Text(
                                'India\'s No.1 Professional Audit & CRM Platform. Manage your future with confidence.',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleLarge
                                    ?.copyWith(
                                      color: Colors.white.withValues(
                                        alpha: 0.8,
                                      ),
                                      fontWeight: FontWeight.w400,
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

            // Right Side: Auth Form with Premium Optimizations
            Expanded(
              flex: 1,
              child: Stack(
                children: [
                  // Atmospheric Background Accents
                  Positioned(
                    top: -100,
                    right: -100,
                    child: Container(
                      width: 300,
                      height: 300,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppTheme.accentCyan.withValues(alpha: 0.03),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: -50,
                    left: -50,
                    child: Container(
                      width: 200,
                      height: 200,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppTheme.neonPurple.withValues(alpha: 0.02),
                      ),
                    ),
                  ),

                  LayoutBuilder(
                    builder: (context, constraints) {
                      return SafeArea(
                        child: SingleChildScrollView(
                          padding: const EdgeInsets.symmetric(horizontal: 32),
                          child: ConstrainedBox(
                            constraints: BoxConstraints(
                              minHeight: constraints.maxHeight,
                            ),
                            child: Container(
                              width: double.infinity,
                              alignment: Alignment.topCenter,
                              padding: const EdgeInsets.only(
                                top: 40,
                                bottom: 40,
                              ),
                              child: TweenAnimationBuilder<double>(
                                duration: const Duration(milliseconds: 1200),
                                tween: Tween(begin: 0.0, end: 1.0),
                                curve: Curves.easeOutCubic,
                                builder: (context, value, child) {
                                  return Opacity(
                                    opacity: value,
                                    child: Transform.translate(
                                      offset: Offset(0, 30 * (1 - value)),
                                      child: child,
                                    ),
                                  );
                                },
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      constraints: const BoxConstraints(
                                        maxWidth: 440,
                                      ),
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 32,
                                      ),
                                      child: Form(
                                        key: _formKey,
                                        child: Column(
                                          mainAxisAlignment:
                                              MainAxisAlignment.start,
                                          crossAxisAlignment:
                                              CrossAxisAlignment.stretch,
                                          children: [
                                            if (MediaQuery.of(
                                                  context,
                                                ).size.width <=
                                                900) ...[
                                              Center(
                                                child: Image.asset(
                                                  'assets/logo.jpg',
                                                  height: 180,
                                                  width: 180,
                                                  fit: BoxFit.contain,
                                                ),
                                              ),
                                              const SizedBox(height: 16),
                                            ],
                                            Text(
                                              'Welcome back',
                                              style: GoogleFonts.inter(
                                                color: AppTheme.deepTeal,
                                                fontSize: 24.sp,
                                                fontWeight: FontWeight.w900,
                                                letterSpacing: -0.5,
                                              ),
                                            ),
                                            const SizedBox(height: 12),
                                            Text(
                                              'Enter your credentials to access your account',
                                              style: GoogleFonts.inter(
                                                color: Colors.grey[600],
                                                fontSize: 12.sp,
                                                fontWeight: FontWeight.w500,
                                                height: 1.5,
                                              ),
                                            ),
                                            const SizedBox(height: 40),
                                            const SizedBox(height: 0),
                                            Text(
                                              'Email Address',
                                              style: GoogleFonts.inter(
                                                fontSize: 12.sp,
                                                fontWeight: FontWeight.w600,
                                                color: AppTheme.deepTeal,
                                              ),
                                            ),
                                            const SizedBox(height: 8),
                                            TextFormField(
                                              controller: _emailController,
                                              keyboardType:
                                                  TextInputType.emailAddress,
                                              style: GoogleFonts.inter(
                                                  fontSize: 13.sp),
                                              decoration: const InputDecoration(
                                                hintText: 'name@company.com',
                                                prefixIcon: Icon(
                                                  LucideIcons.mail,
                                                  size: 20,
                                                ),
                                              ),
                                              validator: (val) {
                                                if (val == null ||
                                                    val.isEmpty) {
                                                  return 'Email is required';
                                                }
                                                if (!RegExp(
                                                  r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$',
                                                ).hasMatch(val)) {
                                                  return 'Enter a valid email address';
                                                }
                                                return null;
                                              },
                                            ),
                                            const SizedBox(height: 20),
                                            Text(
                                              'Password',
                                              style: GoogleFonts.inter(
                                                fontSize: 12.sp,
                                                fontWeight: FontWeight.w600,
                                                color: AppTheme.deepTeal,
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              'First-time logging in? Enter your desired password to set it.',
                                              style: TextStyle(
                                                fontSize: 10.5,
                                                fontWeight: FontWeight.w500,
                                                color: Colors.grey[500],
                                              ),
                                            ),
                                            const SizedBox(height: 8),
                                            TextFormField(
                                              controller: _passwordController,
                                              obscureText: !_isPasswordVisible,
                                              style: GoogleFonts.inter(
                                                  fontSize: 13.sp),
                                              decoration: InputDecoration(
                                                hintText: '••••••••',
                                                prefixIcon: const Icon(
                                                  LucideIcons.lock,
                                                  size: 20,
                                                ),
                                                suffixIcon: IconButton(
                                                  icon: Icon(
                                                    _isPasswordVisible
                                                        ? LucideIcons.eye
                                                        : LucideIcons.eyeOff,
                                                    size: 20,
                                                  ),
                                                  onPressed: () => setState(
                                                    () => _isPasswordVisible =
                                                        !_isPasswordVisible,
                                                  ),
                                                ),
                                              ),
                                              validator: (val) {
                                                if (val == null ||
                                                    val.isEmpty) {
                                                  return 'Password is required';
                                                }
                                                if (val.length < 6) {
                                                  return 'Password must be at least 6 characters';
                                                }
                                                return null;
                                              },
                                            ),
                                            const SizedBox(height: 8),
                                            Align(
                                              alignment: Alignment.centerRight,
                                              child: TextButton(
                                                onPressed: () {
                                                  // TODO: Reset Password
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
                                                    fontSize: 11.sp,
                                                    fontWeight: FontWeight.w600,
                                                    color: AppTheme.deepTeal
                                                        .withValues(alpha: 0.6),
                                                    letterSpacing: 0.3,
                                                  ),
                                                ),
                                              ),
                                            ),
                                            const SizedBox(height: 24),
                                            Padding(
                                              padding: EdgeInsets.symmetric(
                                                  horizontal: 12.r),
                                              child: AnimatedContainer(
                                                duration: const Duration(
                                                  milliseconds: 300,
                                                ),
                                                height: 56.r,
                                                decoration: BoxDecoration(
                                                  gradient:
                                                      AppTheme.premiumGradient,
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          16.r),
                                                  boxShadow:
                                                      AppTheme.softShadow,
                                                ),
                                                child: ElevatedButton(
                                                  style:
                                                      ElevatedButton.styleFrom(
                                                    backgroundColor:
                                                        Colors.transparent,
                                                    shadowColor:
                                                        Colors.transparent,
                                                  ),
                                                  onPressed: _isLoading
                                                      ? null
                                                      : _handleSignIn,
                                                  child: _isLoading
                                                      ? SizedBox(
                                                          height: 24.r,
                                                          width: 24.r,
                                                          child:
                                                              CircularProgressIndicator(
                                                            color: Colors.white,
                                                            strokeWidth: 2.r,
                                                          ),
                                                        )
                                                      : Text(
                                                          'Sign In',
                                                          style:
                                                              GoogleFonts.inter(
                                                            fontSize: 14.sp,
                                                            fontWeight:
                                                                FontWeight.bold,
                                                            color: Colors.white,
                                                          ),
                                                        ),
                                                ),
                                              ),
                                            ),
                                            SizedBox(height: 16.r),
                                            TextButton(
                                              onPressed: _contactSupport,
                                              style: TextButton.styleFrom(
                                                backgroundColor:
                                                    Colors.transparent,
                                                foregroundColor: AppTheme
                                                    .deepTeal
                                                    .withValues(alpha: 0.6),
                                                padding: EdgeInsets.symmetric(
                                                    vertical: 8.r),
                                              ),
                                              child: Text(
                                                'Don\'t have an account? Contact support',
                                                style: GoogleFonts.inter(
                                                  fontWeight: FontWeight.w700,
                                                  fontSize: 12.sp,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ],
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

// Removed _RoleDropdown as only 'customer' role is supported now.
