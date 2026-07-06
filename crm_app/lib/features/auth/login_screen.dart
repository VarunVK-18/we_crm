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
import '../../providers/navigation_provider.dart';

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
        backgroundColor: const Color(0xFFFDFBF7),
        body: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 500),
            child: SafeArea(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  return CustomScrollView(
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
                                  SizedBox(height: constraints.maxHeight * 0.04),
                                  Center(
                                    child: Image.asset(
                                      'assets/WE CRM logo .png',
                                      height: constraints.maxHeight < 700 ? 100 : 130,
                                      width: constraints.maxHeight < 700 ? 100 : 130,
                                      fit: BoxFit.contain,
                                    ),
                                  ),

                                  SizedBox(height: constraints.maxHeight * 0.04),

                                  // Email Field
                                  Text(
                                    'Enter Your Email',
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
                                              BorderRadius.circular(12),
                                          borderSide: BorderSide(
                                              color: Colors.grey[300]!)),
                                      enabledBorder: OutlineInputBorder(
                                          borderRadius:
                                              BorderRadius.circular(12),
                                          borderSide: BorderSide(
                                              color: Colors.grey[300]!)),
                                      focusedBorder: OutlineInputBorder(
                                          borderRadius:
                                              BorderRadius.circular(12),
                                          borderSide: const BorderSide(
                                              color: Colors.black)),
                                    ),
                                    validator: (val) {
                                      if (val == null || val.isEmpty)
                                        return 'Email is required';
                                      if (!RegExp(
                                              r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')
                                          .hasMatch(val))
                                        return 'Enter a valid email address';
                                      return null;
                                    },
                                  ),

                                  SizedBox(height: constraints.maxHeight * 0.025),

                                  // Password Field
                                  Text(
                                    'Enter Your Password',
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
                                              BorderRadius.circular(12),
                                          borderSide: BorderSide(
                                              color: Colors.grey[300]!)),
                                      enabledBorder: OutlineInputBorder(
                                          borderRadius:
                                              BorderRadius.circular(12),
                                          borderSide: BorderSide(
                                              color: Colors.grey[300]!)),
                                      focusedBorder: OutlineInputBorder(
                                          borderRadius:
                                              BorderRadius.circular(12),
                                          borderSide: const BorderSide(
                                              color: Colors.black)),
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
                                      if (val == null || val.isEmpty)
                                        return 'Password is required';
                                      if (val.length < 6)
                                        return 'Password must be at least 6 characters';
                                      return null;
                                    },
                                  ),

                                  SizedBox(height: constraints.maxHeight * 0.02),

                                  Align(
                                    alignment: Alignment.centerRight,
                                    child: TextButton(
                                      style: TextButton.styleFrom(
                                        padding: EdgeInsets.zero,
                                        minimumSize: Size.zero,
                                        tapTargetSize:
                                            MaterialTapTargetSize.shrinkWrap,
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

                                  SizedBox(height: constraints.maxHeight * 0.03),

                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.black,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(
                                          vertical: 18),
                                      shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(12)),
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
                                        : Text('Log in',
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
                              SizedBox(height: constraints.maxHeight * 0.02),
                              Container(
                                constraints: const BoxConstraints(maxHeight: 180),
                                padding: EdgeInsets.symmetric(vertical: constraints.maxHeight * 0.02),
                                child: Image.asset(
                                  'assets/Client/whatsapp_image.jpeg',
                                  fit: BoxFit.contain,
                                  color: const Color(0xFFFDFBF7),
                                  colorBlendMode: BlendMode.darken,
                                ),
                              ),
                              const SizedBox(height: 4),

                              _AutoScrollingLogos(logos: _clientLogos),

                              SizedBox(height: constraints.maxHeight * 0.04),

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
                                      onTap: _contactSupport,
                                      child: Text(
                                        'Sign up',
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
    );
  }

  final List<String> _clientLogos = [
    'assets/Client/idfc_bank.png',
    'assets/Client/softrate.png',
    'assets/Client/dbs.png',
    'assets/Client/logo6.png',
    'assets/Client/pvr.png',
    'assets/Client/hcl_tech.png',
  ];

  Widget _buildClientImage(int index) {
    return SizedBox(
      height: 28,
      child: Image.asset(
        _clientLogos[index - 1],
        fit: BoxFit.contain,
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

class _AutoScrollingLogos extends StatefulWidget {
  final List<String> logos;
  const _AutoScrollingLogos({Key? key, required this.logos}) : super(key: key);

  @override
  _AutoScrollingLogosState createState() => _AutoScrollingLogosState();
}

class _AutoScrollingLogosState extends State<_AutoScrollingLogos> {
  late ScrollController _scrollController;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startAutoScroll();
    });
  }

  void _startAutoScroll() async {
    await Future.delayed(const Duration(milliseconds: 500));
    while (mounted) {
      if (_scrollController.hasClients) {
        await _scrollController.animateTo(
          _scrollController.offset +
              90.0, // Increased for slightly faster scroll
          duration: const Duration(milliseconds: 2000),
          curve: Curves.linear,
        );
      } else {
        await Future.delayed(const Duration(milliseconds: 500));
      }
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ShaderMask(
      shaderCallback: (Rect bounds) {
        return const LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: [
            Colors.transparent,
            Colors.white,
            Colors.white,
            Colors.transparent,
          ],
          stops: [0.0, 0.1, 0.9, 1.0],
        ).createShader(bounds);
      },
      blendMode: BlendMode.dstIn,
      child: SizedBox(
        height: 40,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final listWidth = constraints.maxWidth;
            return ListView.builder(
              controller: _scrollController,
              scrollDirection: Axis.horizontal,
              physics: const NeverScrollableScrollPhysics(), // pure auto-scroll
              itemBuilder: (context, index) {
                final logo = widget.logos[index % widget.logos.length];
                return AnimatedBuilder(
                  animation: _scrollController,
                  builder: (context, child) {
                    double offset = 0;
                    if (_scrollController.hasClients) {
                      offset = _scrollController.offset;
                    }

                    // padding horizontal 12 + width 80 = 104 total width per item
                    final visibleCenter = offset + (listWidth / 2);

                    // Find the index of the item whose center is closest to visibleCenter
                    final closestIndex =
                        ((visibleCenter - 52.0) / 104.0).round();

                    final isCenter = index == closestIndex;

                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: SizedBox(
                        height: 40,
                        width: 80,
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 600),
                          child: isCenter
                              ? Image.asset(logo,
                                  fit: BoxFit.contain,
                                  key: ValueKey('color_$index'))
                              : ColorFiltered(
                                  key: ValueKey('grey_$index'),
                                  colorFilter:
                                      const ColorFilter.matrix(<double>[
                                    0.2126,
                                    0.7152,
                                    0.0722,
                                    0,
                                    0,
                                    0.2126,
                                    0.7152,
                                    0.0722,
                                    0,
                                    0,
                                    0.2126,
                                    0.7152,
                                    0.0722,
                                    0,
                                    0,
                                    0,
                                    0,
                                    0,
                                    1,
                                    0,
                                  ]),
                                  child: Opacity(
                                    opacity: 0.5,
                                    child:
                                        Image.asset(logo, fit: BoxFit.contain),
                                  ),
                                ),
                        ),
                      ),
                    );
                  },
                );
              },
            );
          },
        ),
      ),
    );
  }
}
