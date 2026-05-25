import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import 'responsive_layout.dart';
import '../dashboard/customer_dashboard.dart';
import '../orders/order_tracker.dart';
import '../../providers/auth_provider.dart';
import '../profile/profile_screen.dart';
import '../compliance/compliance_radar_screen.dart';
import '../../core/theme/app_theme.dart';

class MainNavigationScreen extends ConsumerStatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  ConsumerState<MainNavigationScreen> createState() =>
      _MainNavigationScreenState();
}

class _MainNavigationScreenState extends ConsumerState<MainNavigationScreen> {
  int _currentIndex = 0;
  late final PageController _pageController = PageController(initialPage: _currentIndex);

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  List<NavigationItem> _getNavItems() {
    return [
      NavigationItem(
        label: 'Home',
        icon: HugeIcons.strokeRoundedHome07,
        screen: const CustomerDashboard(),
      ),
      NavigationItem(
        label: 'My Service',
        icon: HugeIcons.strokeRoundedPackage,
        screen: const OrderTrackerScreen(),
      ),
      NavigationItem(
        label: 'Compliance',
        icon: HugeIcons.strokeRoundedShield01,
        screen: const ComplianceRadarScreen(),
      ),
      NavigationItem(
        label: 'Profile',
        icon: HugeIcons.strokeRoundedUser,
        screen: const ProfileScreen(),
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final userAsync = ref.watch(userProfileProvider);

    return userAsync.when(
      data: (user) {
        if (user == null) {
          return Scaffold(
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(32.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                     const CircularProgressIndicator(),
                     const SizedBox(height: 24),
                     const Text(
                      'Setting up your workspace...',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                     const SizedBox(height: 8),
                     const Text(
                      'This usually happens during your first login. Please wait a moment.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey),
                    ),
                     const SizedBox(height: 32),
                    TextButton(
                      onPressed: () =>
                          ref.read(authRepositoryProvider).signOut(),
                      child: const Text('Cancel & Sign Out'),
                    ),
                  ],
                ),
              ),
            ),
          );
        }
        final navItems = _getNavItems();

        if (_currentIndex >= navItems.length) {
          _currentIndex = 0;
        }

        return ResponsiveLayout(
          currentIndex: _currentIndex,
          onIndexChanged: (index) {
            setState(() => _currentIndex = index);
            _pageController.animateToPage(
              index,
              duration: const Duration(milliseconds: 500),
              curve: Curves.easeOutQuart,
            );
          },
          title: navItems[_currentIndex].label,
          navItems: navItems,
          mobileBody: Container(
            color: AppTheme.backgroundLight,
            child: PageView(
              controller: _pageController,
              onPageChanged: (index) => setState(() => _currentIndex = index),
              physics: const ClampingScrollPhysics(),
              children: navItems.asMap().entries.map((entry) {
                final index = entry.key;
                final item = entry.value;

                return AnimatedBuilder(
                  animation: _pageController,
                  builder: (context, child) {
                    double scale = 1.0;
                    double opacity = 1.0;

                    if (_pageController.position.haveDimensions) {
                      final pageVal = _pageController.page ?? _pageController.initialPage.toDouble();
                      final diff = (pageVal - index).abs();
                      scale = (1 - (diff * 0.04)).clamp(0.96, 1.0);
                      opacity = (1 - (diff * 0.6)).clamp(0.0, 1.0);
                    } else {
                      scale = index == _currentIndex ? 1.0 : 0.97;
                      opacity = index == _currentIndex ? 1.0 : 0.0;
                    }

                    return Opacity(
                      opacity: opacity,
                      child: Transform.scale(
                        scale: scale,
                        child: item.screen,
                      ),
                    );
                  },
                );
              }).toList(),
            ),
          ),
          desktopBody: PageView(
            controller: _pageController,
            onPageChanged: (index) => setState(() => _currentIndex = index),
            physics:
                const NeverScrollableScrollPhysics(), // No swipe on desktop
            children: navItems.map((item) => item.screen).toList(),
          ),
        );
      },
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (err, stack) => Scaffold(body: Center(child: Text('Error: $err'))),
    );
  }
}
