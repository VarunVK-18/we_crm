import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../models/user_model.dart';

class ResponsiveLayout extends ConsumerWidget {
  final Widget mobileBody;
  final Widget desktopBody;
  final String title;
  final List<NavigationItem> navItems;
  final int currentIndex;
  final Function(int) onIndexChanged;

  const ResponsiveLayout({
    super.key,
    required this.mobileBody,
    required this.desktopBody,
    required this.title,
    required this.navItems,
    required this.currentIndex,
    required this.onIndexChanged,
  });

  Future<void> _showSignOutDialog(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Confirm Sign Out',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        content: const Text(
          'Are you sure you want to log out from Wealth Empires?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel', style: TextStyle(color: Colors.grey[600])),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red[600],
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await ref.read(authRepositoryProvider).signOut();
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(userProfileProvider).value;

    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth > 950) {
          // Desktop Layout
          return Scaffold(
            body: Container(
              decoration: BoxDecoration(gradient: AppTheme.premiumGradient),
              child: Row(
                children: [
                  _FuturisticSidebar(
                    navItems: navItems,
                    currentIndex: currentIndex,
                    onIndexChanged: onIndexChanged,
                    user: user,
                    onLogout: () => _showSignOutDialog(context, ref),
                  ),
                  Expanded(
                    child: Container(
                      margin: const EdgeInsets.fromLTRB(0, 24, 24, 24),
                      decoration: BoxDecoration(
                        color: AppTheme.backgroundLight,
                        borderRadius: BorderRadius.circular(40),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(40),
                        child: Column(
                          children: [
                            _PremiumAppBar(title: title, user: user),
                            Expanded(child: desktopBody),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        } else {
          // Mobile Layout
          return AnnotatedRegion<SystemUiOverlayStyle>(
            value: const SystemUiOverlayStyle(
              statusBarColor: Colors.transparent,
              statusBarIconBrightness: Brightness.dark,
              statusBarBrightness: Brightness.light,
            ),
            child: Scaffold(
              appBar: null,
              extendBody: true,
              body: Stack(
                children: [
                  mobileBody,
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: 0,
                    child: SafeArea(
                      top: false,
                      child: _ModernBottomNav(
                        currentIndex: currentIndex,
                        onTap: onIndexChanged,
                        navItems: navItems,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        }
      },
    );
  }
}

class _FuturisticSidebar extends StatelessWidget {
  final List<NavigationItem> navItems;
  final int currentIndex;
  final Function(int) onIndexChanged;
  final UserModel? user;
  final VoidCallback onLogout;

  const _FuturisticSidebar({
    required this.navItems,
    required this.currentIndex,
    required this.onIndexChanged,
    required this.user,
    required this.onLogout,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 280,
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    gradient: AppTheme.accentGradient,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    LucideIcons.crown,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                const Flexible(
                  child: Text(
                    'WEALTH EMPIRES',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 60),
          Expanded(
            child: ListView.builder(
              itemCount: navItems.length,
              itemBuilder: (context, index) {
                final item = navItems[index];
                final isSelected = currentIndex == index;
                return Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 4,
                  ),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? Colors.white.withOpacity(0.12)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: ListTile(
                      onTap: () => onIndexChanged(index),
                      leading: item.icon is IconData
                          ? Icon(
                              item.icon as IconData,
                              color: isSelected
                                  ? AppTheme.accentCyan
                                  : Colors.white54,
                              size: 20,
                            )
                          : HugeIcon(
                              icon: item.icon,
                              color: isSelected
                                  ? AppTheme.accentCyan
                                  : Colors.white54,
                              size: 20,
                            ),
                      title: Text(
                        item.label,
                        style: TextStyle(
                          color: isSelected ? Colors.white : Colors.white54,
                          fontWeight: isSelected
                              ? FontWeight.w700
                              : FontWeight.w500,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          _SidebarUserFooter(user: user, onLogout: onLogout),
        ],
      ),
    );
  }
}

class _SidebarUserFooter extends ConsumerWidget {
  final UserModel? user;
  final VoidCallback onLogout;

  const _SidebarUserFooter({required this.user, required this.onLogout});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final name = user?.name ?? 'User';

    final Widget avatarChild = Center(
      child: Text(
        name.isNotEmpty ? name[0].toUpperCase() : '?',
        style: const TextStyle(
          color: AppTheme.deepTeal,
          fontWeight: FontWeight.bold,
        ),
      ),
    );

    return Container(
      padding: const EdgeInsets.all(24),
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: const BoxDecoration(
              color: AppTheme.accentCyan,
              shape: BoxShape.circle,
            ),
            child: avatarChild,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  user?.name ?? 'User',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  user?.role.name.toUpperCase() ?? 'NONE',
                  style: TextStyle(
                    color: AppTheme.accentCyan.withValues(alpha: 0.6),
                    fontSize: 9,
                    letterSpacing: 1,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(
              LucideIcons.logOut,
              color: Colors.white38,
              size: 18,
            ),
            onPressed: onLogout,
          ),
        ],
      ),
    );
  }
}

class _PremiumAppBar extends StatelessWidget {
  final String title;
  final UserModel? user;
  const _PremiumAppBar({required this.title, required this.user});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 90,
      padding: const EdgeInsets.symmetric(horizontal: 40),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.5),
        border: Border(
          bottom: BorderSide(color: Colors.grey.withOpacity(0.05)),
        ),
      ),
      child: Row(
        children: [
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.deepTeal,
                  letterSpacing: -0.5,
                ),
              ),
              Text(
                'Propelling Wealth to New Frontiers',
                style: TextStyle(
                  color: Colors.grey[500],
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const Spacer(),
          // Responsive Search Bar
          Flexible(
            flex: 2,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.02),
                    blurRadius: 20,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Row(
                children: [
                  Icon(LucideIcons.search, size: 18, color: Colors.grey),
                  SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      decoration: InputDecoration(
                        hintText: 'Search dashboard...',
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        contentPadding: EdgeInsets.zero,
                        isDense: true,
                      ),
                      style: TextStyle(fontSize: 14),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (MediaQuery.of(context).size.width > 1200) ...[
            const SizedBox(width: 32),
            _UserBadge(user: user),
          ],
        ],
      ),
    );
  }
}

class _UserBadge extends ConsumerWidget {
  final UserModel? user;
  const _UserBadge({required this.user});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final name = user?.name ?? 'User';

    final Widget avatarChild = Center(
      child: Text(
        name.isNotEmpty ? name[0].toUpperCase() : '?',
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.bold,
          fontSize: 16,
        ),
      ),
    );

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const VerticalDivider(width: 1, indent: 20, endIndent: 20),
        const SizedBox(width: 32),
        Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              user?.name ?? 'User',
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 13,
                color: AppTheme.deepTeal,
              ),
            ),
            Text(
              'Online • Prime',
              style: TextStyle(
                color: Colors.green[600],
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(width: 16),
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            gradient: AppTheme.accentGradient,
            borderRadius: BorderRadius.circular(14),
          ),
          child: avatarChild,
        ),
      ],
    );
  }
}

class _ModernBottomNav extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;
  final List<NavigationItem> navItems;

  const _ModernBottomNav({
    required this.currentIndex,
    required this.onTap,
    required this.navItems,
  });
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(36, 0, 36, 24),
      child: Container(
        height: 56,
        padding: const EdgeInsets.symmetric(horizontal: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A), // Dark Navy/Black background
          borderRadius: BorderRadius.circular(40), // Pill shape
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.35),
              blurRadius: 24,
              spreadRadius: 4,
              offset: const Offset(0, 8),
            ),
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 8,
              spreadRadius: 0,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: navItems.asMap().entries.map((entry) {
            final index = entry.key;
            final item = entry.value;
            final isSelected = currentIndex == index;

            final iconData = item.icon;
            final Widget iconWidget;
            final iconColor = isSelected ? const Color(0xFF0F172A) : Colors.white70;

            if (iconData is IconData) {
              iconWidget = Icon(
                iconData,
                size: 20,
                color: iconColor,
              );
            } else {
              iconWidget = HugeIcon(
                icon: iconData,
                size: 20,
                color: iconColor,
                strokeWidth: isSelected ? 2.0 : 1.8,
              );
            }

            return GestureDetector(
              onTap: () => onTap(index),
              behavior: HitTestBehavior.opaque,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeOutQuart,
                height: 40,
                width: 40,
                decoration: BoxDecoration(
                  color: isSelected ? Colors.white : Colors.transparent,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: iconWidget,
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class NavigationItem {
  final String label;
  final dynamic icon;
  final Widget screen;

  const NavigationItem({
    required this.label,
    required this.icon,
    required this.screen,
  });
}
