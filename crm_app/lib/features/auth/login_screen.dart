import 'dart:async';
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

  late PageController _pageController;
  int _currentIndex = 10000;
  Timer? _autoScrollTimer;

  final List<Map<String, String>> _clients = [
    {
      'image': 'assets/client/client 6.jpeg',
      'testimony': '"The CRM is incredibly easy to use. It saves us hours every week!"'
    },
    {
      'image': 'assets/client/client 1.jpeg',
      'testimony': '"It streamlined our audit process perfectly. Highly recommended."'
    },
    {
      'image': 'assets/client/client 3.jpeg',
      'testimony': '"A game-changer for our daily operations. Our team loves it."'
    },
    {
      'image': 'assets/client/client 2.jpeg',
      'testimony': '"I highly recommend Wealth Empires to any growing firm."'
    },
    {
      'image': 'assets/client/client 4.jpeg',
      'testimony': '"Reliable, fast, and feature-rich! It scales with our business."'
    },
    {
      'image': 'assets/client/client 5.jpeg',
      'testimony': '"Excellent support and great features. 10/10."'
    },
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController(viewportFraction: 0.35, initialPage: _currentIndex);
    _pageController.addListener(() {
      if (_pageController.position.haveDimensions) {
        int next = _pageController.page!.round();
        if (_currentIndex != next) {
          setState(() {
            _currentIndex = next;
          });
        }
      }
    });

    _autoScrollTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      if (_pageController.hasClients) {
        _pageController.nextPage(
          duration: const Duration(milliseconds: 800),
          curve: Curves.easeInOut,
        );
      }
    });
  }

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
            child: const Text('OK', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black)),
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
      TextInput.finishAutofillContext();
    } catch (e) {
      String title = 'Sign In Failed';
      String message = e.toString().replaceAll('Exception: ', '');

      if (e.toString().contains('wrong-password') ||
          e.toString().contains('user-not-found') ||
          e.toString().contains('invalid-credential') ||
          e.toString().contains('invalid-email')) {
        title = 'Wrong Email/Password';
        message = 'The email or password you entered is incorrect. Please try again.';
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
    
    // We constrain the width to make it look good on desktop too, acting as a mobile-sized card on large screens.
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,
      ),
      child: Scaffold(
        resizeToAvoidBottomInset: false,
        backgroundColor: const Color(0xFFFDFBF7), // Soft off-white to match the design
        body: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 500), // Ensures desktop doesn't stretch
            child: SafeArea(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  return SingleChildScrollView(
                    child: ConstrainedBox(
                      constraints: BoxConstraints(minHeight: constraints.maxHeight),
                      child: IntrinsicHeight(
                        child: Column(
                          children: [
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 32),
                              child: Form(
                                key: _formKey,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    const SizedBox(height: 10),
                                    Center(
                                      child: Image.asset(
                                        'assets/logo.png',
                                        height: 160,
                                        width: 160,
                                        fit: BoxFit.contain,
                                      ),
                                    ),
                                    
                                    // Email Field
                                    Text(
                                      'E-mail',
                                      style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.grey[600]),
                                    ),
                                    const SizedBox(height: 8),
                                    TextFormField(
                                      controller: _emailController,
                                      keyboardType: TextInputType.emailAddress,
                                      autofillHints: const [AutofillHints.email],
                                      textInputAction: TextInputAction.next,
                                      decoration: InputDecoration(
                                        hintText: 'hello@company.com',
                                        hintStyle: TextStyle(color: Colors.grey[400]),
                                        contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey[300]!)),
                                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey[300]!)),
                                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Colors.black)),
                                      ),
                                      validator: (val) {
                                        if (val == null || val.isEmpty) return 'Email is required';
                                        if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(val)) return 'Enter a valid email address';
                                        return null;
                                      },
                                    ),
                                    
                                    const SizedBox(height: 24),
                                    
                                    // Password Field
                                    Text(
                                      'Password',
                                      style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.grey[600]),
                                    ),
                                    const SizedBox(height: 8),
                                    TextFormField(
                                      controller: _passwordController,
                                      obscureText: !_isPasswordVisible,
                                      autofillHints: const [AutofillHints.password],
                                      textInputAction: TextInputAction.done,
                                      onEditingComplete: () => TextInput.finishAutofillContext(),
                                      decoration: InputDecoration(
                                        hintText: '••••••••',
                                        hintStyle: TextStyle(color: Colors.grey[400]),
                                        contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey[300]!)),
                                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey[300]!)),
                                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Colors.black)),
                                        suffixIcon: Padding(
                                          padding: const EdgeInsets.only(right: 8),
                                          child: IconButton(
                                            icon: Icon(_isPasswordVisible ? LucideIcons.eye : LucideIcons.eyeOff, color: Colors.black),
                                            onPressed: () => setState(() => _isPasswordVisible = !_isPasswordVisible),
                                          ),
                                        ),
                                      ),
                                      validator: (val) {
                                        if (val == null || val.isEmpty) return 'Password is required';
                                        if (val.length < 6) return 'Password must be at least 6 characters';
                                        return null;
                                      },
                                    ),
                                    
                                    const SizedBox(height: 8),
                                    
                                    Align(
                                      alignment: Alignment.centerRight,
                                      child: TextButton(
                                        onPressed: () {
                                          _showAuthDialog(
                                            title: 'Notice',
                                            message: 'Contact Support To Reset Your Password.',
                                            isError: false,
                                          );
                                        },
                                        child: Text(
                                          'Forgot password?',
                                          style: GoogleFonts.inter(color: Colors.grey[600], fontSize: 14, fontWeight: FontWeight.w500),
                                        ),
                                      ),
                                    ),
                                    
                                    const SizedBox(height: 16),
                                    
                                    SizedBox(
                                      height: 64,
                                      child: ElevatedButton(
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: Colors.black,
                                          foregroundColor: Colors.white,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
                                          elevation: 0,
                                        ),
                                        onPressed: _isLoading ? null : _handleSignIn,
                                        child: _isLoading
                                            ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                            : Text('Log in', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
                                      ),
                                    ),
                                    const SizedBox(height: 40),
                                  ],
                                ),
                              ),
                            ),
                            
                            const Spacer(), // Pushes the rest to the bottom
                            
                            // Curved Carousel Section
                            SizedBox(
                              height: 220,
                              child: AnimatedBuilder(
                                animation: _pageController,
                                builder: (context, child) {
                                  return PageView.builder(
                                    clipBehavior: Clip.none,
                                    controller: _pageController,
                                    itemBuilder: (context, index) {
                                      int actualIndex = index % _clients.length;
                                      double page = _currentIndex.toDouble();
                                      if (_pageController.position.haveDimensions) {
                                        page = _pageController.page ?? page;
                                      }
                                      
                                      // Calculate position relative to center (negative is left, positive is right)
                                      double position = index - page;
                                      double delta = position.abs();
                                      
                                      // Scale factor (center is 1.0, adjacent is smaller)
                                      double scale = (1 - (delta * 0.2)).clamp(0.4, 1.0);
                                      
                                      // Translation (center is lower (20), adjacent goes UP)
                                      double dy = 20 - (delta * 40); 
                                      
                                      // Rotation (left is clockwise (+), right is counter-clockwise (-))
                                      double angle = -position * 0.2;
                                      
                                      // Color saturation (center = 1.0 color, adjacent = 0.0 black & white)
                                      double saturation = (1 - delta).clamp(0.0, 1.0);
                                      double invSat = 1 - saturation;
                                      double r = 0.2126 * invSat;
                                      double g = 0.7152 * invSat;
                                      double b = 0.0722 * invSat;
                                      
                                      ColorFilter filter = ColorFilter.matrix(<double>[
                                        saturation + r, g, b, 0, 0,
                                        r, saturation + g, b, 0, 0,
                                        r, g, saturation + b, 0, 0,
                                        0, 0, 0, 1, 0,
                                      ]);

                                      return Center(
                                        child: Transform.translate(
                                          offset: Offset(0, dy),
                                          child: Transform.rotate(
                                            angle: angle,
                                            child: Transform.scale(
                                              scale: scale,
                                              child: SizedBox(
                                                height: 140,
                                                child: ColorFiltered(
                                                  colorFilter: filter,
                                                  child: Container(
                                                    decoration: BoxDecoration(
                                                      borderRadius: BorderRadius.circular(24),
                                                      boxShadow: const [
                                                        BoxShadow(
                                                          color: Colors.black12,
                                                          blurRadius: 15,
                                                          offset: Offset(0, 10),
                                                        )
                                                      ],
                                                      image: DecorationImage(
                                                        image: AssetImage(_clients[actualIndex]['image']!),
                                                        fit: BoxFit.cover,
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ),
                                        ),
                                      );
                                    },
                                  );
                                },
                              ),
                            ),
                            
                            const SizedBox(height: 16),
                            
                            // Testimonial
                            SizedBox(
                              height: 50,
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 32),
                                child: AnimatedSwitcher(
                                  duration: const Duration(milliseconds: 300),
                                  child: Text(
                                    _clients[_currentIndex % _clients.length]['testimony']!,
                                    key: ValueKey<int>(_currentIndex),
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontStyle: FontStyle.italic,
                                      color: Colors.grey[800],
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            
                            const SizedBox(height: 16),
                            
                            // Footer Sign Up Link
                            Padding(
                              padding: const EdgeInsets.only(bottom: 24),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    'New to Wealth Empires? ',
                                    style: GoogleFonts.inter(color: Colors.grey[600], fontSize: 14),
                                  ),
                                  GestureDetector(
                                    onTap: _contactSupport,
                                    child: Text(
                                      'Sign up',
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
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _autoScrollTimer?.cancel();
    _emailController.dispose();
    _passwordController.dispose();
    _pageController.dispose();
    super.dispose();
  }
}
