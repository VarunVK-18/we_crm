import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/navigation_provider.dart';
import '../../providers/orders_provider.dart';
import '../../models/order_model.dart';

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
                          style:
                              Theme.of(context).textTheme.titleLarge?.copyWith(
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

              // Dynamic Dashboard Cards Carousel
              const _DashboardCarousel(),

              SizedBox(height: 32.r),

              // Section 1: Services
              _buildSectionHeader('Start with a Service'),
              SizedBox(height: 20.r),
              const _HorizontalServiceList(
                items: [
                  {
                    'label': 'Incorporation',
                    'icon': HugeIcons.strokeRoundedOffice,
                    'subItems': [
                      'Private Limited Incorporation',
                      'LLP Incorporation',
                      'OPC',
                      'Proprietorship',
                      'MSME'
                    ],
                  },
                  {
                    'label': 'Compliance',
                    'icon': HugeIcons.strokeRoundedBriefcase01,
                    'subItems': ['MCA Compliance', 'TDS', 'PF'],
                  },
                  {
                    'label': 'IP',
                    'icon': HugeIcons.strokeRoundedLicense,
                    'subItems': ['Trade Mark', 'Copyright', 'Patent'],
                  },
                  {
                    'label': 'Tax',
                    'icon': HugeIcons.strokeRoundedCalculator,
                    'subItems': [
                      'GST Registration',
                      'GST Compliance',
                      'GST Cancelation',
                      'GST filing',
                      'ITR'
                    ],
                  },
                  {
                    'label': 'Licensing',
                    'icon': HugeIcons
                        .strokeRoundedStamp01, // using stamp or file icon
                    'subItems': [
                      'ISO',
                      'DPIIT',
                      'FSSAI',
                      'IE code',
                      'LEI',
                      'BIS',
                      'ROSH & CE'
                    ],
                  },
                  {
                    'label': 'Others',
                    'icon': HugeIcons.strokeRoundedMoreHorizontal,
                    'subItems': ['Individual DSC', 'Organization DSC'],
                  },
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

              SizedBox(
                  height: 130
                      .r), // Increased bottom padding to clear the floating bottom navigation bar (extendBody: true)
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

class _DashboardCarousel extends ConsumerStatefulWidget {
  const _DashboardCarousel();

  @override
  ConsumerState<_DashboardCarousel> createState() => _DashboardCarouselState();
}

class _DashboardCarouselState extends ConsumerState<_DashboardCarousel> {
  late final PageController _pageController;
  int _currentPage = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(viewportFraction: 0.9, initialPage: 0);
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(milliseconds: 3500), (timer) {
      if (!mounted) return;
      final activeOrders = ref.read(activeOrdersProvider);
      final totalCards = 2 + (activeOrders.isEmpty ? 1 : activeOrders.length);

      int nextPage = _currentPage + 1;
      if (nextPage >= totalCards) {
        nextPage = 0;
      }

      if (_pageController.hasClients) {
        _pageController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 800),
          curve: Curves.easeInOutCubic,
        );
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final activeOrders = ref.watch(activeOrdersProvider);

    final List<Widget> cards = [
      _buildGetStartedCard(context),
      if (activeOrders.isNotEmpty)
        ...activeOrders.map((order) => _buildActiveOrderCard(context, order))
      else
        _buildNoActiveTasksCard(context),
      _buildReferAndEarnCard(context),
    ];

    final totalCards = cards.length;

    return Column(
      children: [
        SizedBox(
          height: 220.r,
          child: PageView.builder(
            controller: _pageController,
            onPageChanged: (index) {
              setState(() {
                _currentPage = index;
              });
              _startTimer();
            },
            itemCount: totalCards,
            itemBuilder: (context, index) {
              final childCard = cards[index];
              return AnimatedBuilder(
                animation: _pageController,
                builder: (context, child) {
                  double scale = 1.0;
                  if (_pageController.position.haveDimensions) {
                    final pageVal = _pageController.page ?? 0.0;
                    final diff = (pageVal - index).abs();
                    scale = (1 - (diff * 0.04)).clamp(0.95, 1.0);
                  } else {
                    scale = index == _currentPage ? 1.0 : 0.95;
                  }
                  return Transform.scale(
                    scale: scale,
                    child: Padding(
                      padding: EdgeInsets.symmetric(horizontal: 6.r),
                      child: childCard,
                    ),
                  );
                },
              );
            },
          ),
        ),
        SizedBox(height: 12.r),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(totalCards, (index) {
            final isActive = index == _currentPage;
            return AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: EdgeInsets.symmetric(horizontal: 4.r),
              height: 6.r,
              width: isActive ? 18.r : 6.r,
              decoration: BoxDecoration(
                color: isActive ? AppTheme.deepTeal : Colors.grey.shade300,
                borderRadius: BorderRadius.circular(3.r),
              ),
            );
          }),
        ),
      ],
    );
  }

  Widget _buildGetStartedCard(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20.r),
        side: BorderSide(
          color: AppTheme.deepTeal.withOpacity(0.08),
          width: 1.r,
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20.r),
          boxShadow: AppTheme.softShadow,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20.r),
          child: Stack(
            children: [
              Positioned(
                right: -10.r,
                top: -10.r,
                child: HugeIcon(
                  icon: HugeIcons.strokeRoundedStartUp02,
                  size: 110.ip,
                  color: AppTheme.deepTeal.withValues(alpha: 0.03),
                ),
              ),
              Padding(
                padding: EdgeInsets.all(20.r),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: EdgeInsets.all(10.r),
                          decoration: BoxDecoration(
                            color: AppTheme.deepTeal.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(10.r),
                          ),
                          child: HugeIcon(
                            icon: HugeIcons.strokeRoundedStartUp02,
                            size: 24.ip,
                            color: AppTheme.deepTeal,
                          ),
                        ),
                        SizedBox(width: 12.r),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'READY TO SCALE?',
                                style: Theme.of(context)
                                    .textTheme
                                    .labelLarge
                                    ?.copyWith(
                                      fontSize: 9.sp,
                                      fontWeight: FontWeight.w800,
                                    ),
                              ),
                              Text(
                                'Register Your Business',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 14.sp,
                                    ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    Text(
                      'Get expert assistance for company registration and ongoing professional compliance services.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            height: 1.4,
                            fontSize: 12.sp,
                          ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
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
                        minimumSize: Size(double.infinity, 44.r),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10.r),
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
                              fontSize: 13.sp,
                            ),
                          ),
                          SizedBox(width: 6.r),
                          Icon(LucideIcons.arrowRight, size: 14.ip),
                        ],
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
  }

  Widget _buildActiveOrderCard(BuildContext context, ServiceOrder order) {
    final progress = order.progressValue;
    final progressPct = (progress * 100).toInt();

    return Card(
      margin: EdgeInsets.zero,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20.r),
        side: BorderSide(
          color: AppTheme.deepTeal.withOpacity(0.08),
          width: 1.r,
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20.r),
          boxShadow: AppTheme.softShadow,
        ),
        child: Stack(
          children: [
            Positioned(
              right: -10.r,
              top: -10.r,
              child: HugeIcon(
                icon: HugeIcons.strokeRoundedTask01,
                size: 110.ip,
                color: AppTheme.deepTeal.withValues(alpha: 0.03),
              ),
            ),
            Padding(
              padding: EdgeInsets.all(20.r),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: EdgeInsets.all(10.r),
                        decoration: BoxDecoration(
                          color: Colors.blue.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(10.r),
                        ),
                        child: HugeIcon(
                          icon: HugeIcons.strokeRoundedTask01,
                          size: 24.ip,
                          color: Colors.blue,
                        ),
                      ),
                      SizedBox(width: 12.r),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'ACTIVE SERVICE TRACKER',
                              style: Theme.of(context)
                                  .textTheme
                                  .labelLarge
                                  ?.copyWith(
                                    color: Colors.blue,
                                    fontSize: 9.sp,
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                            Text(
                              order.serviceType,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 14.sp,
                                  ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Stage: ${order.stage == OrderStage.workInProgress ? 'Work in Progress' : order.stage == OrderStage.reqReceived ? 'Request Received' : 'Active'}',
                            style: TextStyle(
                              fontSize: 11.sp,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey.shade700,
                            ),
                          ),
                          Text(
                            '$progressPct%',
                            style: TextStyle(
                              fontSize: 11.sp,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.deepTeal,
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 6.r),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4.r),
                        child: LinearProgressIndicator(
                          value: progress,
                          minHeight: 6.r,
                          backgroundColor: Colors.grey.shade100,
                          valueColor: const AlwaysStoppedAnimation<Color>(
                              AppTheme.accentCyan),
                        ),
                      ),
                    ],
                  ),
                  ElevatedButton(
                    onPressed: () {
                      ref.read(navigationIndexProvider.notifier).state = 1;
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.deepTeal,
                      foregroundColor: Colors.white,
                      minimumSize: Size(double.infinity, 44.r),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10.r),
                      ),
                      elevation: 0,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Track Service Detail',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 13.sp,
                          ),
                        ),
                        SizedBox(width: 6.r),
                        Icon(LucideIcons.arrowRight, size: 14.ip),
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

  Widget _buildNoActiveTasksCard(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20.r),
        side: BorderSide(
          color: AppTheme.deepTeal.withOpacity(0.08),
          width: 1.r,
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20.r),
          boxShadow: AppTheme.softShadow,
        ),
        child: Stack(
          children: [
            Positioned(
              right: -10.r,
              top: -10.r,
              child: HugeIcon(
                icon: HugeIcons.strokeRoundedTaskDone01,
                size: 110.ip,
                color: AppTheme.deepTeal.withValues(alpha: 0.03),
              ),
            ),
            Padding(
              padding: EdgeInsets.all(20.r),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: EdgeInsets.all(10.r),
                        decoration: BoxDecoration(
                          color: Colors.grey.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(10.r),
                        ),
                        child: HugeIcon(
                          icon: HugeIcons.strokeRoundedTaskDone01,
                          size: 24.ip,
                          color: Colors.grey,
                        ),
                      ),
                      SizedBox(width: 12.r),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'ACTIVE SERVICE TRACKER',
                              style: Theme.of(context)
                                  .textTheme
                                  .labelLarge
                                  ?.copyWith(
                                    color: Colors.grey,
                                    fontSize: 9.sp,
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                            Text(
                              'All Caught Up!',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 14.sp,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  Text(
                    'No active services being tracked currently. Select a service below to begin your professional journey.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          height: 1.4,
                          fontSize: 12.sp,
                        ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  ElevatedButton(
                    onPressed: () {
                      ref.read(navigationIndexProvider.notifier).state = 1;
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.deepTeal,
                      foregroundColor: Colors.white,
                      minimumSize: Size(double.infinity, 44.r),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10.r),
                      ),
                      elevation: 0,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Explore Services',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 13.sp,
                          ),
                        ),
                        SizedBox(width: 6.r),
                        Icon(LucideIcons.arrowRight, size: 14.ip),
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

  Widget _buildReferAndEarnCard(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20.r),
        side: BorderSide(
          color: Colors.white.withOpacity(0.1),
          width: 1.r,
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(20.r),
        ),
        child: Stack(
          children: [
            Positioned(
              right: -10.r,
              top: -10.r,
              child: Icon(
                LucideIcons.gift,
                size: 110.ip,
                color: Colors.amber.withValues(alpha: 0.03),
              ),
            ),
            Padding(
              padding: EdgeInsets.all(20.r),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: EdgeInsets.all(10.r),
                        decoration: BoxDecoration(
                          color: Colors.amber.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10.r),
                        ),
                        child: Icon(
                          LucideIcons.gift,
                          color: Colors.amber,
                          size: 24.ip,
                        ),
                      ),
                      SizedBox(width: 12.r),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'REFER & EARN',
                              style: Theme.of(context)
                                  .textTheme
                                  .labelLarge
                                  ?.copyWith(
                                    color: Colors.amber,
                                    fontSize: 9.sp,
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                            Text(
                              'Earn up to ₹10,000',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 14.sp,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  Text(
                    'Share Wealth Empires with your network and get rewarded for every referral.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withOpacity(0.7),
                          height: 1.4,
                          fontSize: 12.sp,
                        ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  ElevatedButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Referral link copied to clipboard!'),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.amber,
                      foregroundColor: Colors.black,
                      minimumSize: Size(double.infinity, 44.r),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10.r),
                      ),
                      elevation: 0,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Invite Friends Now',
                          style: TextStyle(
                            color: const Color(0xFF1E293B),
                            fontWeight: FontWeight.w900,
                            fontSize: 13.sp,
                          ),
                        ),
                        SizedBox(width: 6.r),
                        Icon(LucideIcons.share2,
                            size: 14.ip, color: const Color(0xFF1E293B)),
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: items.map((item) {
          final label = item['label'] as String;
          final icon = item['icon'];
          return CircleServiceButton(
            label: label,
            icon: icon,
            onTap: () {
              if (item.containsKey('subItems')) {
                final List<String> subItems =
                    List<String>.from(item['subItems']);
                showModalBottomSheet(
                  context: context,
                  backgroundColor: Colors.white,
                  isScrollControlled: true,
                  shape: RoundedRectangleBorder(
                    borderRadius:
                        BorderRadius.vertical(top: Radius.circular(24.r)),
                  ),
                  builder: (context) {
                    return SafeArea(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(height: 16.r),
                          Container(
                            width: 40.r,
                            height: 4.r,
                            decoration: BoxDecoration(
                              color: Colors.grey[300],
                              borderRadius: BorderRadius.circular(2.r),
                            ),
                          ),
                          SizedBox(height: 16.r),
                          Padding(
                            padding: EdgeInsets.symmetric(horizontal: 24.r),
                            child: Row(
                              children: [
                                if (icon is IconData)
                                  Icon(icon, color: AppTheme.deepTeal)
                                else
                                  HugeIcon(
                                      icon: icon,
                                      color: AppTheme.deepTeal,
                                      size: 24.r),
                                SizedBox(width: 12.r),
                                Text(
                                  label,
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleLarge
                                      ?.copyWith(
                                        fontWeight: FontWeight.w800,
                                        color: AppTheme.deepTeal,
                                      ),
                                ),
                              ],
                            ),
                          ),
                          SizedBox(height: 8.r),
                          Flexible(
                            child: ListView.builder(
                              shrinkWrap: true,
                              itemCount: subItems.length,
                              itemBuilder: (context, index) {
                                final subItem = subItems[index];
                                return ListTile(
                                  contentPadding: EdgeInsets.symmetric(
                                      horizontal: 24.r, vertical: 4.r),
                                  title: Text(
                                    subItem,
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyLarge
                                        ?.copyWith(
                                          fontWeight: FontWeight.w600,
                                          color: Colors.grey[800],
                                        ),
                                  ),
                                  trailing: Icon(LucideIcons.chevronRight,
                                      size: 20.r, color: Colors.grey[400]),
                                  onTap: () {
                                    Navigator.pop(
                                        context); // Close bottom sheet
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) =>
                                            ServiceDetailScreen(
                                                serviceName: subItem,
                                                icon: icon),
                                      ),
                                    );
                                  },
                                );
                              },
                            ),
                          ),
                          SizedBox(height: 16.r),
                        ],
                      ),
                    );
                  },
                );
                return;
              }

              if (label == 'Services') {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const ServiceSelectionScreen(),
                  ),
                );
                return;
              }

              final isTool = label.contains('Calc') ||
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
