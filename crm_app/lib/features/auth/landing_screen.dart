import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'dart:math' as math;
import 'login_screen.dart';
import 'client_onboarding_screen.dart';
import '../../core/theme/app_theme.dart';

const String _documentSvg = '''<svg stroke="#ffffff" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path opacity="0.4" d="M6.70001 18H4.15002C2.72002 18 2 17.28 2 15.85V4.15002C2 2.72002 2.72002 2 4.15002 2H8.45001C9.88001 2 10.6 2.72002 10.6 4.15002V6" stroke="#ffffff" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M17.3702 8.41998V19.58C17.3702 21.19 16.5702 22 14.9602 22H9.12018C7.51018 22 6.7002 21.19 6.7002 19.58V8.41998C6.7002 6.80998 7.51018 6 9.12018 6H14.9602C16.5702 6 17.3702 6.80998 17.3702 8.41998Z" stroke="#ffffff" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path opacity="0.4" d="M13.4004 6V4.15002C13.4004 2.72002 14.1204 2 15.5504 2H19.8503C21.2803 2 22.0004 2.72002 22.0004 4.15002V15.85C22.0004 17.28 21.2803 18 19.8503 18H17.3704" stroke="#ffffff" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path opacity="0.4" d="M10 11H14" stroke="#ffffff" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path opacity="0.4" d="M10 14H14" stroke="#ffffff" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12 22V19" stroke="#ffffff" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
</svg>''';

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  final int _totalPages = 3;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onNext() {
    if (_currentPage < _totalPages - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _finishOnboarding();
    }
  }

  void _finishOnboarding() {
    // Navigate to LoginScreen
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 24),
            // Logo
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.asset(
                    'assets/images/logo_without background.jpg',
                    height: 50,
                    fit: BoxFit.contain,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // PageView
            Expanded(
              child: PageView(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() {
                    _currentPage = index;
                  });
                },
                children: [
                  _buildPage1(),
                  // Placeholders for future pages
                  _buildPage2(),
                  _buildPage3(),
                ],
              ),
            ),
            
            // Pagination Dots
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                _totalPages,
                (index) => AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  height: 8,
                  width: _currentPage == index ? 24 : 8,
                  decoration: BoxDecoration(
                    color: _currentPage == index ? Colors.black : Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
            
            // Next Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _onNext,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
                    _currentPage == 2 ? 'Get Started' : 'Next',
                    style: GoogleFonts.poppins(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 4),
            
            // Skip Button
            TextButton(
              onPressed: _finishOnboarding,
              child: Text(
                'Skip',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: Colors.grey.shade600,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _buildPage1() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Creative Redesign: "Business Launchpad"
          SizedBox(
            height: 260,
            width: double.infinity,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Background Glow
                Container(
                  width: 160,
                  height: 160,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppTheme.corporateBlue.withValues(alpha: 0.1),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.corporateBlue.withValues(alpha: 0.2),
                        blurRadius: 40,
                        spreadRadius: 20,
                      )
                    ]
                  ),
                ),
                
                // Back Card (Rotated left)
                Transform.rotate(
                  angle: -math.pi / 12,
                  child: Container(
                    width: 150,
                    height: 190,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.grey.shade200, width: 2),
                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 15)],
                    ),
                  ),
                ),
                
                // Middle Card (Rotated right)
                Transform.rotate(
                  angle: math.pi / 15,
                  child: Container(
                    width: 150,
                    height: 190,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.grey.shade300, width: 2),
                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 15)],
                    ),
                  ),
                ),
                
                // Front Main Card
                Container(
                  width: 160,
                  height: 200,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppTheme.corporateBlue, Color(0xFF1E1B4B)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.corporateBlue.withValues(alpha: 0.3),
                        blurRadius: 24,
                        offset: const Offset(0, 12),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          shape: BoxShape.circle,
                        ),
                        child: SvgPicture.string(_documentSvg, width: 40, height: 40),
                      ),
                      const SizedBox(height: 20),
                      Text('Incorporation\nComplete', textAlign: TextAlign.center, style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.w500, fontSize: 12)),
                    ],
                  ),
                ),

                // Floating feature badges
                Positioned(
                  top: 30,
                  left: 10,
                  child: _buildGlassBadge(LucideIcons.checkCircle2, 'GST Ready'),
                ),
                Positioned(
                  bottom: 30,
                  right: 5,
                  child: _buildGlassBadge(LucideIcons.building2, 'Pvt Ltd / LLP'),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 32),
          
          // Title
          Text(
            'Start Your Business\nwith Confidence',
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
              height: 1.3,
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Subtitle
          Text(
            'Get your business set up with the right structure, registrations, and essential requirements from the very beginning.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 14,
              color: Colors.blueGrey.shade400,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGlassBadge(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: Colors.grey.shade200, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: AppTheme.corporateBlue, size: 16),
          const SizedBox(width: 8),
          Text(
            text,
            style: GoogleFonts.poppins(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
        ],
      ),
    );
  }


  Widget _buildPage2() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Creative Redesign: "360 Degree Protection"
          SizedBox(
            height: 260,
            width: double.infinity,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Outer ring
                Container(
                  width: 220,
                  height: 220,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.grey.shade300, width: 1.5),
                  ),
                ),
                // Inner solid ring
                Container(
                  width: 150,
                  height: 150,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                    border: Border.all(color: AppTheme.corporateBlue.withValues(alpha: 0.2), width: 1),
                    boxShadow: [
                      BoxShadow(color: AppTheme.corporateBlue.withValues(alpha: 0.1), blurRadius: 20, spreadRadius: 5)
                    ]
                  ),
                ),
                
                // Core Shield
                Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [AppTheme.corporateBlue, Color(0xFF1E1B4B)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    boxShadow: [
                      BoxShadow(color: AppTheme.corporateBlue.withValues(alpha: 0.4), blurRadius: 15, offset: const Offset(0, 8))
                    ]
                  ),
                  child: const Center(
                    child: Icon(LucideIcons.shieldCheck, color: Colors.white, size: 40),
                  ),
                ),

                // Orbiting Elements
                Positioned(
                  top: 10,
                  child: _buildOrbitNode(LucideIcons.scale, 'Legal & IP', Colors.indigo),
                ),
                Positioned(
                  bottom: 10,
                  child: _buildOrbitNode(LucideIcons.calculator, 'Tax & Audit', Colors.teal),
                ),
                Positioned(
                  left: 0,
                  child: _buildOrbitNode(LucideIcons.fileSignature, 'Compliance', Colors.orange),
                ),
                Positioned(
                  right: 0,
                  child: _buildOrbitNode(LucideIcons.users, 'Secretarial', Colors.blue),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 32),
          
          // Title
          Text(
            'Support for Every Stage\nof Your Business',
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
              height: 1.3,
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Subtitle
          Text(
            'From tax and compliance to legal and intellectual property needs, get reliable professional support whenever you need it.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 14,
              color: Colors.blueGrey.shade400,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrbitNode(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade100, width: 1.5),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4))
        ]
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 16),
          const SizedBox(width: 6),
          Text(
            label,
            style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w500, color: Colors.black87),
          )
        ],
      ),
    );
  }

  Widget _buildPage3() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Illustration Area
          SizedBox(
            height: 240,
            width: double.infinity,
            child: Stack(
              alignment: Alignment.center,
              children: [
                 // Main Tracker Card
                 Container(
                   width: 260,
                   height: 140,
                   padding: const EdgeInsets.all(20),
                   decoration: BoxDecoration(
                     color: Colors.white,
                     borderRadius: BorderRadius.circular(20),
                     boxShadow: [
                       BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 24, offset: const Offset(0, 12)),
                     ],
                   ),
                   child: Column(
                     crossAxisAlignment: CrossAxisAlignment.start,
                     children: [
                       Row(
                         children: [
                           Container(width: 8, height: 8, decoration: const BoxDecoration(shape: BoxShape.circle, color: Colors.green)),
                           const SizedBox(width: 8),
                           Text('LIVE TRACKER', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.2)),
                         ]
                       ),
                       const SizedBox(height: 28),
                       // Horizontal Timeline
                       Row(
                         children: [
                            _buildTimelineNode(isCompleted: true),
                            _buildTimelineLine(isCompleted: true),
                            _buildTimelineNode(isCompleted: true, isActive: true),
                            _buildTimelineLine(isCompleted: false),
                            _buildTimelineNode(isCompleted: false),
                         ]
                       ),
                       const SizedBox(height: 16),
                       Row(
                         mainAxisAlignment: MainAxisAlignment.spaceBetween,
                         children: [
                            Text('Verified', style: GoogleFonts.inter(fontSize: 10, color: Colors.black, fontWeight: FontWeight.bold)),
                            Text('In Progress', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.corporateBlue, fontWeight: FontWeight.bold)),
                            Text('Pending', style: GoogleFonts.inter(fontSize: 10, color: Colors.grey)),
                         ]
                       )
                     ]
                   )
                 ),
                 
                 // Floating Notification (Bottom Left)
                 Positioned(
                   bottom: 20,
                   left: 5,
                   child: Container(
                     width: 170,
                     padding: const EdgeInsets.all(12),
                     decoration: BoxDecoration(
                       color: AppTheme.corporateBlue,
                       borderRadius: BorderRadius.circular(16),
                       boxShadow: [
                         BoxShadow(color: AppTheme.corporateBlue.withValues(alpha: 0.3), blurRadius: 16, offset: const Offset(0, 8)),
                       ],
                     ),
                     child: Row(
                       children: [
                         Container(
                           padding: const EdgeInsets.all(4),
                           decoration: const BoxDecoration(shape: BoxShape.circle, color: Colors.green),
                           child: const Icon(Icons.check, color: Colors.white, size: 12),
                         ),
                         const SizedBox(width: 8),
                         Expanded(
                           child: Column(
                             crossAxisAlignment: CrossAxisAlignment.start,
                             children: [
                               Text('Update Received', style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
                               Text('Document approved', style: GoogleFonts.inter(fontSize: 9, color: Colors.white70)),
                             ]
                           )
                         )
                       ]
                     )
                   )
                 ),

                 // Floating Chat (Top Right)
                 Positioned(
                   top: 15,
                   right: 5,
                   child: Container(
                     padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                     decoration: BoxDecoration(
                       color: Colors.black,
                       borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(16),
                          topRight: Radius.circular(16),
                          bottomLeft: Radius.circular(16),
                          bottomRight: Radius.circular(4),
                       ),
                       boxShadow: [
                         BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 12, offset: const Offset(0, 6)),
                       ],
                     ),
                     child: Row(
                       mainAxisSize: MainAxisSize.min,
                       children: [
                          const Icon(Icons.support_agent, color: Colors.white, size: 16),
                          const SizedBox(width: 8),
                          Text('Quick Chat Support', style: GoogleFonts.inter(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w500)),
                       ]
                     )
                   )
                 )
              ],
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Title
          Text(
            'Stay Informed,\nEvery Step of the Way',
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
              height: 1.3,
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Subtitle
          Text(
            'Track your requests, receive timely updates, and connect with our experts whenever you need assistance.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 14,
              color: Colors.blueGrey.shade400,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineNode({required bool isCompleted, bool isActive = false}) {
    return Container(
      width: 20,
      height: 20,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: isActive ? Colors.white : (isCompleted ? Colors.black : Colors.white),
        border: Border.all(color: isActive ? AppTheme.corporateBlue : (isCompleted ? Colors.black : Colors.grey.shade300), width: isActive ? 4 : 2),
      ),
      child: isCompleted && !isActive 
          ? const Icon(Icons.check, color: Colors.white, size: 12) 
          : null,
    );
  }

  Widget _buildTimelineLine({required bool isCompleted}) {
    return Expanded(
      child: Container(
        height: 2,
        color: isCompleted ? Colors.black : Colors.grey.shade200,
      )
    );
  }

  Widget _buildPlaceholderPage(String text) {
    return Center(
      child: Text(
        text,
        style: GoogleFonts.poppins(
          fontSize: 18,
          color: Colors.grey,
        ),
      ),
    );
  }
}


class TrendLinePainter extends CustomPainter {
  final Color color;
  TrendLinePainter({required this.color});
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
      
    final path = Path();
    path.moveTo(0, size.height * 0.8);
    path.lineTo(size.width * 0.2, size.height * 0.9);
    path.lineTo(size.width * 0.4, size.height * 0.5);
    path.lineTo(size.width * 0.6, size.height * 0.6);
    path.lineTo(size.width * 0.8, size.height * 0.1);
    path.lineTo(size.width, 0);
    
    // Add gradient under the line
    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [color.withValues(alpha: 0.2), color.withValues(alpha: 0.0)],
      ).createShader(Rect.fromLTRB(0, 0, size.width, size.height))
      ..style = PaintingStyle.fill;
      
    final fillPath = Path.from(path);
    fillPath.lineTo(size.width, size.height);
    fillPath.lineTo(0, size.height);
    fillPath.close();
    
    canvas.drawPath(fillPath, fillPaint);
    canvas.drawPath(path, paint);
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
