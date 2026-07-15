import 'dart:async';
import 'dart:ui';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'dart:math' as math;
import '../../providers/compliance_provider.dart';
import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:syncfusion_flutter_core/theme.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/navigation_provider.dart';
import '../../providers/orders_provider.dart';
import '../../models/order_model.dart';
import '../../models/banner_model.dart';
import '../../providers/banner_provider.dart';
import '../../models/user_model.dart';

import '../common/ui_components.dart';
import '../services/service_selection_screen.dart';
import '../../core/constants/port.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../services/service_detail_screen.dart';
import '../services/tool_detail_screen.dart';
import '../search/search_screen.dart';
import '../services/registration_services_screen.dart';
import '../orders/service_order_detail_screen.dart';
import '../../core/utils/responsive.dart';
import '../../core/constants/port.dart';
import '../../core/widgets/we_loader.dart';

class CustomerDashboard extends ConsumerWidget {
  const CustomerDashboard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Responsive.init(context);
    final user = ref.watch(userProfileProvider).value;

    final selectedEntity = ref.watch(selectedEntityProvider);

    final rawName = user?.name ?? 'Explorer'; // Get full name
    final primaryCompanyName = (user?.companyName != null && user!.companyName.isNotEmpty)
        ? user.companyName
        : rawName;

    final displayName = (selectedEntity != 'All Entities' && selectedEntity.isNotEmpty)
        ? selectedEntity
        : primaryCompanyName;
        
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
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(serviceOrdersProvider);
          await Future.delayed(const Duration(milliseconds: 800));
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(
            parent: BouncingScrollPhysics(),
          ),
          slivers: [
          // 1. Premium Immersive AppBar
          SliverAppBar(
            pinned: true,
            elevation: 0,
            scrolledUnderElevation: 0,
            stretch: false,
            toolbarHeight: 70.r,
            backgroundColor: AppTheme.backgroundLight,
            centerTitle: true,
            title: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '$displayName',
                  style: GoogleFonts.poppins(
                    color: Colors.black87,
                    fontWeight: FontWeight.w600,
                    fontSize: 16.sp, // slightly smaller to fit better
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
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
                      image: (user?.profileImage != null && user!.profileImage.isNotEmpty)
                          ? DecorationImage(
                              image: NetworkImage('$kBaseUrl/${user.profileImage}'),
                              fit: BoxFit.cover,
                            )
                          : null,
                    ),
                    child: (user?.profileImage == null || user!.profileImage.isEmpty)
                        ? Center(
                            child: Text(
                              displayName.isNotEmpty ? displayName[0].toUpperCase() : 'U',
                              style: GoogleFonts.inter(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 18.sp,
                              ),
                            ),
                          )
                        : null,
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
              _buildSectionHeader(context, 'Start with a Service', subtitle: 'Swipe'),
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
                    'subItems': ['360° Compliance', 'MCA Compliance', 'TDS', 'PF'],
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
                      'GST Cancelation',
                      'GST filing',
                      'ITR',
                    ],
                  },
                  {
                    'label': 'Licensing',
                    'icon': HugeIcons.strokeRoundedProfile02,
                    'subItems': [
                      'DUNS',
                      'ISO',
                      'DPIIT',
                      'FSSAI',
                      'IE code',
                      'LEI',
                      'BIS',
                      'RoHS',
                      'CE',
                      'Individual DSC',
                      'Organization DSC'
                    ],
                  },
                ],
              ),

              SizedBox(height: 32.r),
              _buildAssistanceCard(context, user),

              SizedBox(height: 40.r),

              // Section 2: Tools
              _buildSectionHeader(context, 'Tools & Calculators', subtitle: 'Swipe'),
              SizedBox(height: 18.r),
              const _HorizontalServiceList(
                items: [
                  {'label': 'NIC Finder', 'icon': LucideIcons.binary},
                  {'label': 'Trade Mark Class', 'icon': HugeIcons.strokeRoundedLicense},
                  {'label': 'GST Calculator', 'icon': LucideIcons.calculator},
                  {'label': 'Compliance Calendar', 'icon': LucideIcons.calendar},
                ],
              ),

              SizedBox(
                  height: 130
                      .r), // Increased bottom padding to clear the floating bottom navigation bar (extendBody: true)
            ]),
          ),
        ],
      ),
      ),
    );
  }

  Widget _buildAssistanceCard(BuildContext context, UserModel? user) {
    final managerName = user?.manager?['name']?.toString() ?? 'Support Team';
    final managerEmail = user?.manager?['email']?.toString() ?? 'support@example.com';
    final managerPhone = user?.manager?['phone']?.toString() ?? '+918000000000';
    final hasManager = user?.manager != null;

    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 24.r),
      child: Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF1E1B4B), Color(0xFF312E81)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16.r),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF1B1D43).withOpacity(0.3),
              blurRadius: 16,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16.r),
          child: Stack(
            children: [
              Positioned.fill(
                child: CustomPaint(
                  painter: _LinePatternPainter(),
                ),
              ),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 20.r, vertical: 16.r),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: EdgeInsets.all(10.r),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10.r),
                  ),
                  child: HugeIcon(
                    icon: HugeIcons.strokeRoundedCustomerService01,
                    color: Colors.white,
                    size: 22.ip,
                  ),
                ),
                SizedBox(width: 14.r),
                Expanded(
                  child: Text(
                    'Need Expert Assistance?',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 16.sp,
                        ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 12.r),
            RichText(
              text: TextSpan(
                style: GoogleFonts.inter(
                  color: Colors.white.withOpacity(0.85),
                  fontSize: 12.sp,
                  height: 1.5,
                ),
                children: [
                  TextSpan(text: hasManager ? 'Your client manager ' : 'Our dedicated '),
                  TextSpan(
                    text: managerName,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                  const TextSpan(text: ' is available to assist you with any queries.'),
                ],
              ),
            ),
            SizedBox(height: 16.r),
            Container(height: 1.r, color: Colors.white.withOpacity(0.1)),
            SizedBox(height: 10.r),
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () async {
                      final Uri telUrl = Uri.parse('tel:$managerPhone');
                      if (await canLaunchUrl(telUrl)) {
                        await launchUrl(telUrl);
                      }
                    },
                    borderRadius: BorderRadius.circular(8.r),
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 6.r),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Icon(LucideIcons.phone, color: Colors.white, size: 16.sp),
                          SizedBox(width: 8.r),
                          Flexible(
                            child: Text(
                              managerPhone,
                              style: GoogleFonts.inter(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                fontSize: 12.sp,
                                height: 1.2,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                Container(
                  width: 1.r,
                  height: 24.r,
                  color: Colors.white.withOpacity(0.2),
                ),
                Expanded(
                  child: InkWell(
                    onTap: () async {
                      final Uri emailUrl = Uri.parse('mailto:$managerEmail');
                      if (await canLaunchUrl(emailUrl)) {
                        await launchUrl(emailUrl);
                      }
                    },
                    borderRadius: BorderRadius.circular(8.r),
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 8.r),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Icon(LucideIcons.mail, color: Colors.white, size: 16.sp),
                          SizedBox(width: 8.r),
                          Flexible(
                            child: Text(
                              managerEmail,
                              style: GoogleFonts.inter(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                fontSize: 12.sp,
                                height: 1.2,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
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

  Widget _buildSectionHeader(BuildContext context, String title, {String? subtitle}) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 24.r),
      child: Row(
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
              color: AppTheme.deepTeal,
              fontSize: 15.sp,
              letterSpacing: -0.2,
            ),
          ),
          SizedBox(width: 16.r),
          Expanded(
            child: Container(height: 1.r, color: Colors.grey.withOpacity(0.1)),
          ),
          if (subtitle != null) ...[
            SizedBox(width: 12.r),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  subtitle,
                  style: GoogleFonts.inter(
                    fontSize: 11.sp,
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                SizedBox(width: 4.r),
                Icon(LucideIcons.arrowRightLeft, size: 12.sp, color: Colors.grey.shade600),
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
      final activeOrdersRaw = ref.read(activeOrdersProvider);
      final notInitRaw = ref.read(notInitializedOrdersProvider);
      final combinedOrders = [...activeOrdersRaw, ...notInitRaw];
      final totalCards = 2 + (combinedOrders.isEmpty ? 1 : combinedOrders.length);

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

  Widget build(BuildContext context) {
    final activeOrdersRaw = ref.watch(activeOrdersProvider);
    final notInitRaw = ref.watch(notInitializedOrdersProvider);
    final selectedEntity = ref.watch(selectedEntityProvider);

    final combinedOrders = [...activeOrdersRaw, ...notInitRaw]
      .where((o) {
        if (selectedEntity == 'All Entities') return true;
        final en = (o.entityName ?? '').trim();
        final cn = (o.companyName ?? '').trim();
        return en.toLowerCase() == selectedEntity.toLowerCase() ||
               cn.toLowerCase() == selectedEntity.toLowerCase();
      })
      .toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));


    final banners = ref.watch(bannerProvider).maybeWhen(
      data: (data) => data,
      orElse: () => <BannerModel>[],
    );

    final List<Widget> cards = [
      _buildGetStartedCard(context),
      ...banners.map((banner) => _buildBannerCard(context, banner)),
      if (combinedOrders.isNotEmpty)
        ...combinedOrders.map((order) => _buildActiveOrderCard(context, order))
      else
        _buildNoActiveTasksCard(context),
    ];

    final totalCards = cards.length;

    return Column(
      children: [
        SizedBox(
          height: 190.r,
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

  Widget _buildBannerCard(BuildContext context, BannerModel banner) {
    String imageUrl = banner.imageUrl;
    if (imageUrl.startsWith('/')) {
      imageUrl = '$kBaseUrl$imageUrl';
    }

    Color bgColor = Colors.white;
    Color textColor = const Color(0xFF1F2937);

    switch (banner.theme) {
      case 'dark':
        bgColor = const Color(0xFF0F172A);
        textColor = Colors.white;
        break;
      case 'purple':
        bgColor = const Color(0xFF8B5CF6);
        textColor = Colors.white;
        break;
      case 'emerald':
        bgColor = const Color(0xFF10B981);
        textColor = Colors.white;
        break;
      case 'amber':
        bgColor = const Color(0xFFF59E0B);
        textColor = const Color(0xFF1F2937);
        break;
      case 'rose':
        bgColor = const Color(0xFFF43F5E);
        textColor = Colors.white;
        break;
      case 'light':
      default:
        bgColor = Colors.white;
        textColor = const Color(0xFF1F2937);
        break;
    }

    return Card(
      margin: EdgeInsets.zero,
      elevation: 0,
      color: bgColor,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20.r),
        side: BorderSide(
          color: AppTheme.deepTeal.withOpacity(0.08),
          width: 1.r,
        ),
      ),
      child: Padding(
        padding: EdgeInsets.all(16.r),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  width: 52.r,
                  height: 52.r,
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.06),
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  clipBehavior: Clip.hardEdge,
                  child: Image.network(
                    imageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(),
                  ),
                ),
                SizedBox(width: 16.r),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'LATEST UPDATE',
                        style: TextStyle(
                          color: textColor,
                          fontSize: 10.sp,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.0,
                        ),
                      ),
                      SizedBox(height: 2.r),
                      Text(
                        banner.title,
                        style: TextStyle(
                          color: textColor,
                          fontSize: 18.sp,
                          fontWeight: FontWeight.bold,
                          height: 1.2,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            SizedBox(height: 12.r),
            Text(
              banner.subtitle.isNotEmpty ? banner.subtitle : 'Check out the latest updates and offers from Wealth Empires.',
              style: TextStyle(
                color: textColor.withOpacity(0.8),
                fontSize: 13.sp,
                height: 1.4,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            if (banner.targetUrl.isNotEmpty || banner.buttonText.isNotEmpty) ...[
              SizedBox(height: 12.r),
              GestureDetector(
                onTap: () async {
                  try {
                    http.post(Uri.parse('$kBaseUrl/api/banners/${banner.id}/click')).catchError((_) => http.Response('', 200));
                  } catch (e) {
                    // Ignore tracking errors
                  }
                  
                  if (banner.targetUrl.isNotEmpty) {
                    String url = banner.targetUrl;
                    if (url.startsWith('/')) {
                      url = '$kBaseUrl$url';
                    } else if (!url.startsWith('http')) {
                      url = 'https://$url';
                    }
                    final uri = Uri.parse(url);
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri, mode: LaunchMode.externalApplication);
                    } else {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Could not launch $url')),
                        );
                      }
                    }
                  }
                },
                child: Container(
                  width: double.infinity,
                  padding: EdgeInsets.symmetric(vertical: 10.r),
                  decoration: BoxDecoration(
                    color: banner.theme == 'light' || banner.theme == 'amber' ? const Color(0xFF1F2937) : Colors.white,
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  alignment: Alignment.center,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        banner.buttonText.isNotEmpty ? banner.buttonText : 'Learn More',
                        style: TextStyle(
                          color: banner.theme == 'light' || banner.theme == 'amber' ? Colors.white : const Color(0xFF1F2937),
                          fontSize: 14.sp,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(width: 8.r),
                      Icon(
                        Icons.arrow_forward,
                        color: banner.theme == 'light' || banner.theme == 'amber' ? Colors.white : const Color(0xFF1F2937),
                        size: 18.sp,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
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
          gradient: const LinearGradient(
            colors: [Color(0xFF1E1B4B), Color(0xFF312E81)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20.r),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 16,
              spreadRadius: 0,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20.r),
          child: Stack(
            children: [
              // Background organic floating blobs
              Positioned(
                top: -40.r,
                right: -30.r,
                child: FloatingWidget(
                  duration: const Duration(seconds: 8),
                  offset: 5,
                  child: Container(
                    width: 80.r,
                    height: 80.r,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withValues(alpha: 0.08),
                    ),
                  ),
                ),
              ),
              Positioned(
                bottom: -50.r,
                left: 10.r,
                child: FloatingWidget(
                  duration: const Duration(seconds: 10),
                  offset: 4,
                  child: Container(
                    width: 100.r,
                    height: 100.r,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withValues(alpha: 0.05),
                    ),
                  ),
                ),
              ),

              Padding(
                padding: EdgeInsets.all(16.r),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        FloatingWidget(
                          duration: const Duration(seconds: 2),
                          offset: 4,
                          child: Container(
                            padding: EdgeInsets.all(10.r),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(10.r),
                            ),
                            child: HugeIcon(
                              icon: HugeIcons.strokeRoundedStartUp02,
                              size: 24.ip,
                              color: Colors.white,
                            ),
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
                                      color: Colors.white60, // Better contrast
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
                                      color: Colors.white,
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
                            color: Colors.white70, // Better readability
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
                        backgroundColor: Colors.white, // White button for contrast against dark background
                        foregroundColor: AppTheme.deepTeal,
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
          color: Colors.white.withOpacity(0.1),
          width: 1.r,
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [AppTheme.deepTeal, AppTheme.deepTeal.withOpacity(0.8)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20.r),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.15),
              blurRadius: 16,
              spreadRadius: 0,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20.r),
          child: Stack(
            children: [
              // Background organic floating blobs
              Positioned(
                top: -40.r,
                right: -30.r,
                child: FloatingWidget(
                  duration: const Duration(seconds: 8),
                  offset: 5,
                  child: Container(
                    width: 80.r,
                    height: 80.r,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withValues(alpha: 0.08),
                    ),
                  ),
                ),
              ),
              Positioned(
                bottom: -50.r,
                left: 10.r,
                child: FloatingWidget(
                  duration: const Duration(seconds: 10),
                  offset: 4,
                  child: Container(
                    width: 100.r,
                    height: 100.r,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withValues(alpha: 0.05),
                    ),
                  ),
                ),
              ),
              Padding(
              padding: EdgeInsets.all(16.r),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      FloatingWidget(
                        duration: const Duration(seconds: 2),
                        offset: 4,
                        child: Container(
                          padding: EdgeInsets.all(10.r),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(10.r),
                          ),
                          child: HugeIcon(
                            icon: HugeIcons.strokeRoundedTask01,
                            size: 24.ip,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      SizedBox(width: 12.r),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              order.isReallyActionRequired ? 'ACTION REQUIRED' : (order.stage == OrderStage.reqReceived ? 'TO BE ASSIGNED' : 'ACTIVE SERVICE TRACKER'),
                              style: Theme.of(context)
                                  .textTheme
                                  .labelLarge
                                  ?.copyWith(
                                    color: Colors.white,
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
                                    color: Colors.white,
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
                            'Stage: ${order.stage == OrderStage.workInProgress ? 'Work in Progress' : order.stage == OrderStage.reqReceived ? 'To be assigned' : 'Active'}',
                            style: TextStyle(
                              fontSize: 11.sp,
                              fontWeight: FontWeight.w600,
                              color: Colors.white70,
                            ),
                          ),
                          Text(
                            '$progressPct%',
                            style: TextStyle(
                              fontSize: 11.sp,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 6.r),
                      Container(
                        height: 6.r,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade800,
                          borderRadius: BorderRadius.circular(4.r),
                        ),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: FractionallySizedBox(
                            widthFactor: progress,
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(4.r),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.white.withOpacity(0.3),
                                    blurRadius: 4,
                                    spreadRadius: 0,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => ServiceOrderDetailScreen(order: order),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFF121212),
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
          color: const Color(0xFFBBEBBE),
          borderRadius: BorderRadius.circular(20.r),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.15),
              blurRadius: 16,
              spreadRadius: 0,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Stack(
          children: [
            Padding(
              padding: EdgeInsets.all(16.r),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: EdgeInsets.all(10.r),
                        decoration: BoxDecoration(
                          color: AppTheme.deepTeal.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10.r),
                        ),
                        child: SvgPicture.asset(
                          'assets/icons/party_popper.svg',
                          width: 24.ip,
                          height: 24.ip,
                          colorFilter: const ColorFilter.mode(
                            AppTheme.deepTeal,
                            BlendMode.srcIn,
                          ),
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
                                    color: AppTheme.deepTeal.withOpacity(0.8),
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
                                    color: AppTheme.deepTeal,
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
                          color: AppTheme.deepTeal.withOpacity(0.9),
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
          color: const Color(0xFF1E1E1E), // Dark charcoal from reference image
          borderRadius: BorderRadius.circular(20.r),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.15),
              blurRadius: 16,
              spreadRadius: 0,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Stack(
          children: [
            Padding(
              padding: EdgeInsets.all(16.r),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: EdgeInsets.all(10.r),
                        decoration: BoxDecoration(
                          color: const Color(0xFFD2AB55).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10.r),
                        ),
                        child: Icon(
                          LucideIcons.gift,
                          color: const Color(0xFFD2AB55),
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
                                    color: const Color(0xFFD2AB55),
                                    fontSize: 9.sp,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 1.5,
                                  ),
                            ),
                            Text(
                              'Earn up to ₹10,000',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleLarge
                                  ?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 20.sp,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  Text(
                    'Share your unique referral link with friends and colleagues to earn substantial rewards on their first investment.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withOpacity(0.6),
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
                      backgroundColor: const Color(0xFFD2AB55),
                      foregroundColor: const Color(0xFF121212),
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
                          'INVITE FRIENDS NOW',
                          style: TextStyle(
                            color: const Color(0xFF121212),
                            fontWeight: FontWeight.w800,
                            fontSize: 12.sp,
                            letterSpacing: 1.0,
                          ),
                        ),
                        SizedBox(width: 8.r),
                        Icon(LucideIcons.arrowRight,
                            size: 16.ip, color: const Color(0xFF121212)),
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

class _HorizontalServiceList extends ConsumerWidget {
  final List<Map<String, dynamic>> items;
  const _HorizontalServiceList({required this.items});

  void _openComplianceCalendar(BuildContext context, WidgetRef ref) {
    final authState = ref.read(authStateProvider).value;
    final uid = authState?.uid ?? '';
    
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PdfViewerScreen(uid: uid),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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

              if (label == 'Compliance Calendar') {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => ToolDetailScreen(
                      toolName: label, icon: null,
                    ),
                  ),
                );
                return;
              }

              final isTool = label.contains('Calc') ||
                  label.contains('Finder') ||
                  label.contains('Interest') ||
                  label.contains('Class');

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

class FloatingWidget extends StatefulWidget {
  final Widget child;
  final Duration duration;
  final double offset;

  const FloatingWidget({
    super.key,
    required this.child,
    this.duration = const Duration(seconds: 3),
    this.offset = 10.0,
  });

  @override
  State<FloatingWidget> createState() => _FloatingWidgetState();
}

class _FloatingWidgetState extends State<FloatingWidget> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration)
      ..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, math.sin(_controller.value * math.pi) * widget.offset),
          child: widget.child,
        );
      },
    );
  }
}

class _LinePatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.03)
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;

    final step = 20.0;
    // Draw diagonal lines
    for (double i = -size.height; i < size.width; i += step) {
      canvas.drawLine(
        Offset(i, 0),
        Offset(i + size.height, size.height),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class PdfViewerScreen extends StatefulWidget {
  final String? url;
  final String uid;

  const PdfViewerScreen({super.key, this.url, required this.uid});

  @override
  State<PdfViewerScreen> createState() => _PdfViewerScreenState();
}

class _PdfViewerScreenState extends State<PdfViewerScreen> {
  final PdfViewerController _pdfViewerController = PdfViewerController();
  String? _loadedUrl;
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.url != null) {
      _loadedUrl = widget.url;
    } else {
      _fetchUrl();
    }
  }

  Future<void> _fetchUrl() async {
    setState(() => _isLoading = true);
    try {
      final response = await http.get(
        Uri.parse('$kBaseUrl/api/calendar/latest'),
        headers: {'x-user-id': widget.uid},
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final docId = data['calendar']?['documentId']?['_id'];
        if (docId != null) {
          setState(() {
            _loadedUrl = '$kBaseUrl/api/documents/$docId';
            _isLoading = false;
          });
        } else {
          setState(() {
            _error = 'Calendar PDF not found';
            _isLoading = false;
          });
        }
      } else {
        setState(() {
          _error = 'Compliance Calendar for this year is not uploaded yet.';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        scrolledUnderElevation: 0,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: AppTheme.deepTeal),
          onPressed: () => Navigator.pop(context),
        ),
        title: Padding(
          padding: EdgeInsets.only(left: 12.r, top: 12.r),
          child: Text(
            'Compliance Calendar',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontSize: 18.sp,
                  fontWeight: FontWeight.w800,
                  height: 1.0,
                ),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.zoomIn, color: AppTheme.deepTeal),
            onPressed: () {
              _pdfViewerController.zoomLevel = _pdfViewerController.zoomLevel + 0.5;
            },
          ),
          IconButton(
            icon: const Icon(LucideIcons.zoomOut, color: AppTheme.deepTeal),
            onPressed: () {
              if (_pdfViewerController.zoomLevel > 1) {
                _pdfViewerController.zoomLevel = _pdfViewerController.zoomLevel - 0.5;
              }
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _isLoading
          ? const Center(child: WeLoader(size: 24))
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Text(_error!, textAlign: TextAlign.center, style: const TextStyle(fontSize: 16)),
                  ),
                )
              : SfPdfViewerTheme(
                  data: SfPdfViewerThemeData(
                    backgroundColor: Colors.white,
                  ),
                  child: SfPdfViewer.network(
                    _loadedUrl!,
                    headers: {'x-user-id': widget.uid},
                    controller: _pdfViewerController,
                    canShowScrollHead: false,
                    canShowScrollStatus: false,
                  ),
                ),
    );
  }
}
