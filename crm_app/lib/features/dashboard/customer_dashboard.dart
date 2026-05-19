import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../common/ui_components.dart';
import '../services/service_selection_screen.dart';
import '../services/service_detail_screen.dart';
import '../services/tool_detail_screen.dart';
import '../search/search_screen.dart';
import '../services/registration_services_screen.dart';
import '../../core/utils/responsive.dart';

class CustomerDashboard extends ConsumerWidget {
  const CustomerDashboard({super.key});

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour >= 5 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    } else if (hour >= 17 && hour < 21) {
      return 'Good Evening';
    } else {
      return 'Good Night';
    }
  }

  IconData _getGreetingIcon() {
    final hour = DateTime.now().hour;
    if (hour >= 5 && hour < 12) {
      return LucideIcons.sun;
    } else if (hour >= 12 && hour < 17) {
      return LucideIcons.cloudSun;
    } else if (hour >= 17 && hour < 21) {
      return LucideIcons.cloudMoon;
    } else {
      return LucideIcons.moon;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Responsive.init(context);
    final user = ref.watch(userProfileProvider).value;
    final greeting = _getGreeting();

    // Capitalize first letter of name
    final rawName = user?.name.split(' ')[0] ?? 'Explorer';
    final name = rawName.isNotEmpty
        ? rawName[0].toUpperCase() + rawName.substring(1)
        : rawName;

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // 1. Premium Immersive AppBar
          SliverAppBar(
            expandedHeight: 120.r,
            pinned: true,
            elevation: 0,
            stretch: false,
            backgroundColor: AppTheme.deepTeal,
            systemOverlayStyle: const SystemUiOverlayStyle(
              statusBarColor: Colors.transparent,
              statusBarIconBrightness: Brightness.light,
              statusBarBrightness: Brightness.dark,
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Color(0xFF0F172A), // Premium Deep Slate
                      AppTheme.deepTeal,
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Stack(
                  children: [
                    Positioned(
                      right: -30.r,
                      top: -30.r,
                      child: Container(
                        width: 140.r,
                        height: 140.r,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withValues(alpha: 0.03),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              titlePadding: EdgeInsets.symmetric(
                horizontal: 24.r,
                vertical: 12.r,
              ),
              title: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'WEALTH EMPIRES',
                    style: GoogleFonts.inter(
                      color: Colors.white.withValues(alpha: 0.5),
                      fontSize: 10.sp,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2.0,
                    ),
                  ),
                  SizedBox(height: 4.r),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          '$greeting, $name',
                          style: Theme.of(context).textTheme.titleLarge
                              ?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                                fontSize: 16.sp,
                              ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            actions: [
              IconButton(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const SearchScreen()),
                ),
                icon: HugeIcon(
                  icon: HugeIcons.strokeRoundedSearch01,
                  color: Colors.white,
                  size: 22.ip,
                ),
              ),
              SizedBox(width: 12.r),
            ],
          ),

          // 2. Main Body Content
          SliverList(
            delegate: SliverChildListDelegate([
              SizedBox(height: 24.r),

              // Hero Registration Card (Modernized)
              const _HeroRegistrationCard(),

              SizedBox(height: 32.r),

              // Section 1: Services
              _buildSectionHeader('Start with a Service'),
              SizedBox(height: 20.r),
              const _HorizontalServiceList(
                items: [
                  {'label': 'Services', 'icon': LucideIcons.briefcase},
                  {'label': 'GST Mgmt', 'icon': HugeIcons.strokeRoundedFile02},
                  {
                    'label': 'Documents',
                    'icon': HugeIcons.strokeRoundedFolder02,
                  },
                  {'label': 'DSC', 'icon': LucideIcons.userCheck},
                ],
              ),

              SizedBox(height: 40.r),

              // Section 2: Tools
              _buildSectionHeader('Tools & Calculators'),
              SizedBox(height: 18.r),
              const _HorizontalServiceList(
                items: [
                  {'label': 'NIC Finder', 'icon': LucideIcons.binary},
                  {'label': 'TDS Interest', 'icon': LucideIcons.landmark},
                  {'label': 'GST Calc', 'icon': LucideIcons.calculator},
                  {'label': 'GST Interest', 'icon': LucideIcons.percent},
                ],
              ),

              SizedBox(height: 40.r),

              // Section 3: Refer & Earn
              const _ReferAndEarnBanner(),

              SizedBox(height: 130.r), // Increased bottom padding to clear the floating bottom navigation bar (extendBody: true)
            ]),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 24.r),
      child: SectionHeader(title: title),
    );
  }
}

class _HeroRegistrationCard extends StatelessWidget {
  const _HeroRegistrationCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 24.r),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24.r),
        border: Border.all(
          color: AppTheme.deepTeal.withOpacity(0.08),
          width: 1.0.r,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.12),
            blurRadius: 50,
            offset: const Offset(0, 16),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24.r),
        child: Stack(
          children: [
            // Background Accent
            Positioned(
              right: -20,
              top: -20,
              child: Icon(
                LucideIcons.rocket,
                size: 120.ip,
                color: AppTheme.deepTeal.withValues(alpha: 0.03),
              ),
            ),
            Padding(
              padding: EdgeInsets.all(24.r),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: EdgeInsets.all(12.r),
                        decoration: BoxDecoration(
                          color: AppTheme.deepTeal.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(12.r),
                        ),
                        child: Icon(
                          LucideIcons.rocket,
                          size: 24.ip,
                          color: AppTheme.deepTeal,
                        ),
                      ),
                      SizedBox(width: 16.r),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'READY TO SCALE?',
                              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                                fontSize: 10.sp,
                              ),
                            ),
                            Text(
                              'Register Your Business',
                              style: Theme.of(context).textTheme.titleMedium
                                  ?.copyWith(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 16.sp,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 20.r),
                  Text(
                    'Get expert assistance for company registration and ongoing professional compliance services.',
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(
                      height: 1.5,
                      fontSize: 13.sp,
                    ),
                  ),
                  SizedBox(height: 24.r),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) =>
                              const RegistrationServicesScreen(),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.deepTeal,
                      foregroundColor: Colors.white,
                      minimumSize: Size(double.infinity, 52.r),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12.r),
                      ),
                      elevation: 0,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Get Started Now',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 14.sp,
                          ),
                        ),
                        SizedBox(width: 8.r),
                        Icon(LucideIcons.arrowRight, size: 16.ip),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HorizontalServiceList extends StatelessWidget {
  final List<Map<String, dynamic>> items;
  const _HorizontalServiceList({required this.items});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: EdgeInsets.symmetric(horizontal: 24.r),
      physics: const BouncingScrollPhysics(),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        children: items.map((item) {
          final label = item['label'] as String;
          final icon = item['icon'];
          return CircleServiceButton(
            label: label,
            icon: icon,
            onTap: () {
              if (label == 'Services') {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const ServiceSelectionScreen(),
                  ),
                );
                return;
              }

              final isTool =
                  label.contains('Calc') ||
                  label.contains('Finder') ||
                  label.contains('Interest');

              if (isTool) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) =>
                        ToolDetailScreen(toolName: label, icon: icon),
                  ),
                );
              } else {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) =>
                        ServiceDetailScreen(serviceName: label, icon: icon),
                  ),
                );
              }
            },
          );
        }).toList(),
      ),
    );
  }
}

class _ReferAndEarnBanner extends StatelessWidget {
  const _ReferAndEarnBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 24.r),
      padding: EdgeInsets.all(24.r),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B), // Slate 800
        borderRadius: BorderRadius.circular(20.r),
        border: Border.all(
          color: Colors.white.withOpacity(0.1),
          width: 1.0.r,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'REFER & EARN UP TO ₹10,000',
                  style: Theme.of(
                    context,
                  ).textTheme.labelLarge?.copyWith(
                    color: Colors.amber,
                    fontSize: 11.sp,
                  ),
                ),
                SizedBox(height: 8.r),
                Text(
                  'Share Wealth Empires with your network and get rewarded for every referral.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.7),
                    height: 1.4,
                    fontSize: 11.sp,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(width: 16.r),
          Container(
            padding: EdgeInsets.all(12.r),
            decoration: BoxDecoration(
              color: Colors.amber.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(LucideIcons.gift, color: Colors.amber, size: 24.ip),
          ),
        ],
      ),
    );
  }
}
