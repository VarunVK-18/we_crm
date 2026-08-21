import 'package:flutter/material.dart';
import 'package:confetti/confetti.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../models/order_model.dart';
import '../orders/service_order_detail_screen.dart';
import '../../providers/orders_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hugeicons/hugeicons.dart';
import 'responsive_layout.dart';
import '../dashboard/customer_dashboard.dart';
import '../orders/order_tracker.dart';
import '../../providers/auth_provider.dart';
import '../profile/profile_screen.dart';
import '../compliance/compliance_radar_screen.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/navigation_provider.dart';
import '../../core/widgets/we_loader.dart';
import '../../core/utils/biometric_util.dart';

class MainNavigationScreen extends ConsumerStatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  ConsumerState<MainNavigationScreen> createState() =>
      _MainNavigationScreenState();
}

class _MainNavigationScreenState extends ConsumerState<MainNavigationScreen> {
  late final PageController _pageController;
  static bool _hasShownSecurityPopup = false;
  late ConfettiController _confettiController;

  @override
  void initState() {
    super.initState();
    final initialIndex = ref.read(navigationIndexProvider);
    _pageController = PageController(initialPage: initialIndex);
    _confettiController = ConfettiController(duration: const Duration(seconds: 3));
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkSecuritySetup();
      _checkCompletedServices();
    });
  }

  Future<void> _checkSecuritySetup() async {
    final util = ref.read(biometricProvider);
    final isBiometricEnabled = await util.isBiometricEnabled();
    final isPinEnabled = await util.isPinEnabled();

    if (!isBiometricEnabled && !isPinEnabled && mounted && !_hasShownSecurityPopup) {
      _hasShownSecurityPopup = true;
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (ctx) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(width: 48, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2))),
              const SizedBox(height: 24),
              const HugeIcon(icon: HugeIcons.strokeRoundedFingerAccess, size: 48, color: Colors.black87),
              const SizedBox(height: 16),
              const Text('Secure Your App', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: Colors.black87)),
              const SizedBox(height: 12),
              const Text(
                'Would you like to set up Biometric (Fingerprint/FaceID) or a PIN for faster and more secure logins?',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.black54, fontSize: 14, fontWeight: FontWeight.w400),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () {
                    Navigator.pop(ctx);
                    ref.read(autoTriggerSecurityProvider.notifier).state = true;
                    ref.read(navigationIndexProvider.notifier).state = 3; // Index 3 is ProfileScreen
                  },
                  child: const Text('Set Up Now', style: TextStyle(fontWeight: FontWeight.w500, fontSize: 15)),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  style: TextButton.styleFrom(
                    splashFactory: NoSplash.splashFactory,
                  ),
                  onPressed: () => Navigator.pop(ctx),
                  child: Text('Maybe Later', style: TextStyle(color: Colors.grey[600], fontSize: 14, fontWeight: FontWeight.w300)),
                ),
              ),
            ],
          ),
        ),
      );
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    _confettiController.dispose();
    super.dispose();
  }

  List<NavigationItem> _getNavItems() {
    return [
      const NavigationItem(
        label: 'Home',
        icon: HugeIcons.strokeRoundedHome07,
        screen: CustomerDashboard(),
      ),
      const NavigationItem(
        label: 'My Service',
        icon: HugeIcons.strokeRoundedPackage,
        screen: OrderTrackerScreen(),
      ),
      const NavigationItem(
        label: 'Compliance',
        icon: HugeIcons.strokeRoundedShield01,
        screen: ComplianceRadarScreen(),
      ),
      const NavigationItem(
        label: 'Profile',
        icon: HugeIcons.strokeRoundedUser,
        screen: ProfileScreen(),
      ),
    ];
  }


  Future<void> _checkCompletedServices() async {
    final completedOrders = ref.read(completeOrdersProvider);
    if (completedOrders.isEmpty) return;
    
    // Sort by created at to get latest, or just take first
    final latestOrder = completedOrders.first;
    
    final prefs = await SharedPreferences.getInstance();
    final lastCelebratedId = prefs.getString('last_celebrated_order_id');
    
    if (lastCelebratedId != latestOrder.id) {
      // Haven't celebrated this one yet!
      await prefs.setString('last_celebrated_order_id', latestOrder.id);
      if (mounted) {
        _showCelebrationPopup(latestOrder);
      }
    }
  }

  void _showCelebrationPopup(ServiceOrder order) {
    _confettiController.play();
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return Stack(
          alignment: Alignment.center,
          children: [
            Dialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.green.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const HugeIcon(icon: HugeIcons.strokeRoundedTick01, color: Colors.green, size: 48),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Service Completed!',
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.deepTeal),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Your order for ${order.serviceType} has been successfully completed.',
                      style: const TextStyle(fontSize: 14, color: Colors.black54),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(ctx);
                          Navigator.push(context, MaterialPageRoute(builder: (_) => ServiceOrderDetailScreen(order: order)));
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.corporateBlue,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('View Documents', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Close', style: TextStyle(color: Colors.grey)),
                    ),
                  ],
                ),
              ),
            ),
            Align(
              alignment: Alignment.topCenter,
              child: ConfettiWidget(
                confettiController: _confettiController,
                blastDirectionality: BlastDirectionality.explosive,
                shouldLoop: false,
                colors: const [Colors.green, Colors.blue, Colors.pink, Colors.orange, Colors.purple],
              ),
            ),
          ],
        );
      },
    );
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
                     const WeLoader(size: 24),
                     const SizedBox(height: 32),
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
        final currentIndex = ref.watch(navigationIndexProvider);

        ref.listen<int>(navigationIndexProvider, (previous, next) {
          if (_pageController.hasClients && next != _pageController.page?.round()) {
            _pageController.jumpToPage(next);
          }
        });

        final safeIndex = currentIndex.clamp(0, navItems.length - 1);

        return ResponsiveLayout(
          currentIndex: safeIndex,
          onIndexChanged: (index) {
            ref.read(navigationIndexProvider.notifier).state = index;
          },
          title: navItems[safeIndex].label,
          navItems: navItems,
          mobileBody: Container(
            color: AppTheme.backgroundLight,
            child: PageView(
              controller: _pageController,
              onPageChanged: (index) => ref.read(navigationIndexProvider.notifier).state = index,
              physics: const NeverScrollableScrollPhysics(),
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
                      scale = index == safeIndex ? 1.0 : 0.97;
                      opacity = index == safeIndex ? 1.0 : 0.0;
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
            onPageChanged: (index) => ref.read(navigationIndexProvider.notifier).state = index,
            physics:
                const NeverScrollableScrollPhysics(), // No swipe on desktop
            children: navItems.map((item) => item.screen).toList(),
          ),
        );
      },
      loading: () =>
          const Scaffold(body: Center(child: WeLoader(size: 24))),
      error: (err, stack) => Scaffold(body: Center(child: Text('Error: $err'))),
    );
  }
}
