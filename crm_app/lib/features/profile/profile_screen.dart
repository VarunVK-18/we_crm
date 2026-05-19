import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../common/ui_components.dart';
import 'my_entities_screen.dart';
import 'name_check_screen.dart';
import 'support_tickets_screen.dart';
import 'chat_support_screen.dart';
import 'dsc_orders_screen.dart';
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
            leading: Navigator.canPop(context)
                ? IconButton(
                    icon: Icon(
                      LucideIcons.arrowLeft,
                      color: AppTheme.deepTeal,
                      size: 24.ip,
                    ),
                    onPressed: () => Navigator.maybePop(context),
                  )
                : null,
            title: Text(
              'Profile',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontSize: 20.sp,
                fontWeight: FontWeight.bold,
              ),
            ),
            centerTitle: false,
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
                    phone: '8072286963',
                  ),

                  SizedBox(height: 32.r),

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
                        icon: HugeIcons.strokeRoundedDocumentValidation,
                        title: 'Name Check',
                        subtitle: 'Check company name availability',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const NameCheckScreen(),
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
                        icon: LucideIcons.checkCircle,
                        title: 'DSC Registration',
                        subtitle: 'Manage Digital Signature Certificates',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const DSCOrdersScreen(),
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

                  SizedBox(height: 32.r),

                  // ── Account Management ────────────────────────────────────
                  Text(
                    'Account Management',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      fontSize: 16.sp,
                    ),
                  ),
                  SizedBox(height: 16.r),
                  _SectionCard(
                    tiles: [
                      ProfileTile(
                        icon: LucideIcons.trash2,
                        title: 'Delete Account',
                        subtitle: 'Permanently delete your account',
                        color: const Color.fromARGB(255, 250, 118, 118),
                        onTap: () {},
                      ),
                    ],
                  ),

                  SizedBox(height: 48.r),

                  // ── Sign Out ─────────────────────────────────────────────
                  SizedBox(
                    width: double.infinity,
                    height: 56.r,
                    child: ElevatedButton.icon(
                      onPressed: () =>
                          ref.read(authRepositoryProvider).signOut(),
                      style:
                          ElevatedButton.styleFrom(
                            backgroundColor: const Color.fromARGB(
                              255,
                              221,
                              121,
                              114,
                            ),
                            foregroundColor: const Color.fromARGB(
                              255,
                              33,
                              42,
                              44,
                            ),
                            elevation: 0,
                            shadowColor: const Color.fromARGB(
                              255,
                              255,
                              253,
                              253,
                            ).withValues(alpha: 0.1),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16.r),
                              side: BorderSide(
                                color: const Color.fromARGB(
                                  255,
                                  158,
                                  158,
                                  158,
                                ).withValues(alpha: 0.1),
                              ),
                            ),
                          ).copyWith(
                            elevation: WidgetStateProperty.resolveWith<double>(
                              (states) =>
                                  states.contains(WidgetState.pressed) ? 2 : 4,
                            ),
                          ),
                      icon: Icon(LucideIcons.logOut, size: 20.ip),
                      label: Text(
                        'Sign Out',
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
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
