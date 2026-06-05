import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../common/ui_components.dart';
import 'my_entities_screen.dart';
import 'support_tickets_screen.dart';
import 'chat_support_screen.dart';
import 'subscriptions_screen.dart';
import '../../core/utils/responsive.dart';

// ─── Profile Screen ───────────────────────────────────────────────────────────

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Responsive.init(context);
    final user = ref.watch(userProfileProvider).value;

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      body: CustomScrollView(
        slivers: [
          // ── Header ─────────────────────────────────────────────────────────
          SliverAppBar(
            floating: true,
            pinned: true,
            elevation: 0,
            scrolledUnderElevation: 0,
            surfaceTintColor: Colors.transparent,
            backgroundColor: AppTheme.backgroundLight,
            automaticallyImplyLeading: false,
            title: Text(
              'Profile',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontSize: 20.sp,
                    fontWeight: FontWeight.w700,
                  ),
            ),
            centerTitle: false,
            actions: [
              IconButton(
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (BuildContext context) {
                      return AlertDialog(
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20.r)),
                        title: const Text('Sign Out',
                            style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: AppTheme.deepTeal)),
                        content: const Text(
                            'Are you sure you want to sign out of your account?'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('Cancel',
                                style: TextStyle(
                                    color: Colors.grey,
                                    fontWeight: FontWeight.w600)),
                          ),
                          ElevatedButton(
                            onPressed: () {
                              Navigator.pop(context);
                              ref.read(authRepositoryProvider).signOut();
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.redAccent,
                              foregroundColor: Colors.white,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12.r)),
                            ),
                            child: const Text('Sign Out',
                                style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ],
                      );
                    },
                  );
                },
                icon: const Icon(LucideIcons.logOut, color: Colors.redAccent),
                tooltip: 'Sign Out',
              ),
              SizedBox(width: 8.r),
            ],
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 24.r, vertical: 16.r),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── User Info Card ────────────────────────────────────────
                  _UserInfoCard(
                    name: user?.name ?? 'User',
                    email: user?.email ?? '---',
                    phone: user?.phone ?? '---',
                  ),

                  SizedBox(height: 24.r),

                  // ── Quick Actions ─────────────────────────────────────────
                  Text(
                    'Quick Actions',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                          fontSize: 16.sp,
                        ),
                  ),
                  SizedBox(height: 16.r),
                  _SectionCard(
                    tiles: [
                      ProfileTile(
                        icon: HugeIcons.strokeRoundedOffice,
                        title: 'Entities',
                        subtitle: 'Manage your business entities',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const MyEntitiesScreen(),
                          ),
                        ),
                      ),
                      ProfileTile(
                        icon: HugeIcons.strokeRoundedMentoring,
                        title: 'Support Tickets',
                        subtitle: 'View and manage support tickets',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const SupportTicketsScreen(),
                          ),
                        ),
                      ),
                      ProfileTile(
                        icon: HugeIcons.strokeRoundedCustomerSupport,
                        title: 'Help & Support',
                        subtitle: 'Get instant help from our team',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const ChatSupportScreen(),
                          ),
                        ),
                      ),
                      ProfileTile(
                        icon: HugeIcons.strokeRoundedPayment02,
                        title: 'Subscriptions',
                        subtitle: 'View and manage your subscriptions',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const SubscriptionsScreen(),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── User Info Card ────────────────────────────────────────────────────

class _UserInfoCard extends ConsumerWidget {
  final String name;
  final String email;
  final String phone;

  const _UserInfoCard({
    required this.name,
    required this.email,
    required this.phone,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: EdgeInsets.all(24.r),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          // Avatar showing first letter of name
          Container(
            width: 80.r,
            height: 80.r,
            decoration: BoxDecoration(
              color: AppTheme.corporateBlue.withValues(alpha: 0.08),
              shape: BoxShape.circle,
              border: Border.all(
                color: AppTheme.corporateBlue.withValues(alpha: 0.15),
                width: 2.0.r,
              ),
            ),
            child: Center(
              child: Text(
                name.isNotEmpty ? name[0].toUpperCase() : 'U',
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      color: AppTheme.corporateBlue,
                      fontWeight: FontWeight.bold,
                      fontSize: 28.sp,
                    ),
              ),
            ),
          ),
          SizedBox(width: 24.r),
          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppTheme.deepTeal,
                        fontSize: 18.sp,
                      ),
                ),
                SizedBox(height: 12.r),
                Row(
                  children: [
                    Icon(LucideIcons.mail, size: 14.ip, color: Colors.grey),
                    SizedBox(width: 8.r),
                    Expanded(
                      child: Text(
                        email,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.grey,
                              fontSize: 11.sp,
                            ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 8.r),
                Row(
                  children: [
                    Icon(LucideIcons.phone, size: 14.ip, color: Colors.grey),
                    SizedBox(width: 8.r),
                    Text(
                      phone,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey,
                            fontSize: 11.sp,
                          ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Section Card ─────────────────────────────────────────────────────────────

class _SectionCard extends StatelessWidget {
  final List<Widget> tiles;
  const _SectionCard({required this.tiles});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Material(
        color: Colors.white,
        clipBehavior: Clip.antiAlias,
        borderRadius: BorderRadius.circular(24.r),
        child: Column(children: tiles),
      ),
    );
  }
}
