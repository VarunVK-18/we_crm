import 'dart:async';
import 'package:intl/intl.dart';
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

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Responsive.init(context);
    final user = ref.watch(userProfileProvider).value;

    // Capitalize first letter of name
    final rawName = user?.name.split(' ')[0] ?? 'Explorer';
    final name = rawName.isNotEmpty
        ? rawName[0].toUpperCase() + rawName.substring(1)
        : rawName;
        
    final hour = DateTime.now().hour;
    String greeting;
    if (hour < 12) {
      greeting = 'Good Morning';
    } else if (hour < 17) {
      greeting = 'Good Afternoon';
    } else {
      greeting = 'Good Evening';
    }

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // 1. Premium Immersive AppBar
          SliverAppBar(
            pinned: true,
            elevation: 0,
            scrolledUnderElevation: 0,
            stretch: false,
            toolbarHeight: 70.r,
            backgroundColor: Colors.white,
            centerTitle: true,
            title: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Hello, $name',
                  style: GoogleFonts.poppins(
                    color: Colors.black87,
                    fontWeight: FontWeight.w600,
                    fontSize: 18.sp,
                  ),
                ),
                Text(
                  greeting,
                  style: GoogleFonts.poppins(
                    color: Colors.black54,
                    fontWeight: FontWeight.w400,
                    fontSize: 12.sp,
                  ),
                ),
              ],
            ),
            systemOverlayStyle: const SystemUiOverlayStyle(
              statusBarColor: Colors.transparent,
              statusBarIconBrightness: Brightness.dark,
              statusBarBrightness: Brightness.light,
            ),
            leadingWidth: 70.r,
            leading: Center(
              child: Padding(
                padding: EdgeInsets.only(left: 20.r),
                child: GestureDetector(
                  onTap: () {
                    ref.read(navigationIndexProvider.notifier).state = 3;
                  },
                  child: Container(
                    width: 44.r,
                    height: 44.r,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppTheme.corporateBlue,
                      border: Border.all(
                        color: Colors.transparent,
                        width: 0,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        name.isNotEmpty ? name[0] : 'U',
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 18.sp,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            actions: [
              Padding(
                padding: EdgeInsets.only(right: 20.r),
                child: Center(
                  child: Container(
                    width: 44.r,
                    height: 44.r,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: Colors.grey.shade300,
                        width: 1.0.r,
                      ),
                    ),
                    child: IconButton(
                      padding: EdgeInsets.zero,
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const SearchScreen()),
                      ),
                      icon: HugeIcon(
                        icon: HugeIcons.strokeRoundedSearch01,
                        color: Colors.black87,
                        size: 22.ip,
                      ),
                    ),
                  ),
                ),
              ),
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
              _buildSectionHeader('Start with a Service', subtitle: 'Swipe to explore services'),
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
                    'icon': HugeIcons.strokeRoundedProfile02,
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
              _buildSectionHeader('Tools & Calculators', subtitle: 'Swipe to explore tools'),
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

  Widget _buildSectionHeader(String title, {String? subtitle}) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 24.r),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionHeader(title: title),
          if (subtitle != null) ...[
            SizedBox(height: 4.r),
            Row(
              children: [
                Icon(LucideIcons.arrowRightLeft, size: 12.sp, color: Colors.grey.shade600),
                SizedBox(width: 6.r),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(
                    fontSize: 11.sp,
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ]
        ],
      ),
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
          color: const Color(0xFFDCD2FF), // Very light pastel violet
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
                  color: Colors.black.withValues(
                      alpha: 0.05), // Darker icon for contrast on violet
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
                            color: Colors.black.withValues(
                                alpha: 0.1), // Slightly dark for contrast
                            borderRadius: BorderRadius.circular(10.r),
                          ),
                          child: HugeIcon(
                            icon: HugeIcons.strokeRoundedStartUp02,
                            size: 24.ip,
                            color: Colors.black87, // Dark icon
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
                                      fontWeight: FontWeight.w900,
                                      color: Colors.black54, // Better contrast
                                      letterSpacing: 1.0,
                                    ),
                              ),
                              Text(
                                'Register Your Business',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(
                                      fontWeight: FontWeight.w900,
                                      fontSize: 16.sp, // Slightly larger
                                      color: Colors.black87,
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
                            color:
                                Colors.black87, // Better readability on violet
                            fontWeight: FontWeight.w500,
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
                                const RegistrationServicesScreen(initialCategory: 'All'),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor:
                            Colors.black87, // Dark button for premium contrast
                        foregroundColor: Colors.white,
                        minimumSize: Size(double.infinity, 44.r),
                        shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(12.r), // Softer corners
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
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => RegistrationServicesScreen(
                      initialCategory: label,
                    ),
                  ),
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
