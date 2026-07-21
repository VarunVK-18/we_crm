import 'package:crm_app/core/utils/error_handler.dart';
import 'package:crm_app/core/utils/file_picker_util.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image_cropper/image_cropper.dart';
import '../../core/theme/app_theme.dart';
import '../../core/constants/port.dart';
import '../../providers/auth_provider.dart';
import '../common/ui_components.dart';
import 'my_entities_screen.dart';
import 'support_tickets_screen.dart';
import 'chat_support_screen.dart';
import 'subscriptions_screen.dart';
import 'company_details_screen.dart';
import '../../core/utils/responsive.dart';
import '../../providers/navigation_provider.dart';
import '../../providers/compliance_provider.dart';

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
            title: Padding(
              padding: EdgeInsets.only(left: 12.r, top: 12.r),
              child: Text(
                'My Profile',
                style: GoogleFonts.outfit(
                      fontSize: 18.sp,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.deepTeal,
                    ),
              ),
            ),
            centerTitle: false,
            actions: [
              IconButton(
                onPressed: () async {
                  final confirm = await showDialog<bool>(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: const Text('Sign Out'),
                      content: const Text(
                          'Are you sure you want to sign out? You will need to enter your credentials to access your account again.'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context, false),
                          child: Text(
                            'Cancel',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ),
                        TextButton(
                          onPressed: () => Navigator.pop(context, true),
                          child: Text(
                            'OK',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: const Color.fromARGB(255, 6, 6, 6),
                                ),
                          ),
                        ),
                      ],
                    ),
                  );
                  if (confirm == true) {
                    ref.read(navigationIndexProvider.notifier).state = 0;
                    ref.read(authRepositoryProvider).signOut();
                  }
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
                  Builder(builder: (context) {
                    final selectedEntity = ref.watch(selectedEntityProvider);
                    final String actualSelectedEntity = (selectedEntity.isNotEmpty && selectedEntity != 'All Entities')
                        ? selectedEntity
                        : (user?.clientEntities.isNotEmpty == true ? user!.clientEntities.first.entityName : (user?.companyName ?? ''));
                        
                    final displayedCompany = actualSelectedEntity;
                        
                    String displayLogo = user?.profileImage ?? '';
                    if (actualSelectedEntity.isNotEmpty && user?.clientEntities != null) {
                      try {
                        final matchedEntity = user!.clientEntities.firstWhere(
                          (ce) => ce.entityName.trim().toLowerCase() == actualSelectedEntity.trim().toLowerCase(),
                        );
                        if (matchedEntity.entityLogo.isNotEmpty) {
                          displayLogo = matchedEntity.entityLogo;
                        } else {
                          displayLogo = ''; // Ensure we don't show the global profile image if entity has no logo
                        }
                      } catch (e) {
                        displayLogo = '';
                      }
                    }
                        
                    return _UserInfoCard(
                      uid: user?.id ?? '',
                      name: user?.name ?? 'User',
                      email: user?.email ?? '---',
                      phone: user?.phone ?? '---',
                      profileImage: displayLogo,
                      companyName: displayedCompany,
                      selectedEntity: actualSelectedEntity,
                    );
                  }),

                  SizedBox(height: 24.r),

                  // ── Quick Actions ───────────────────────────────────────── //
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
                        title: 'Switch Entities',
                        subtitle: 'Switch your active business entity',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const MyEntitiesScreen(),
                          ),
                        ),
                      ),
                      ProfileTile(
                        icon: LucideIcons.building, // Or HugeIcons.strokeRoundedOffice
                        title: 'Company Details',
                        subtitle: 'View your company information',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const CompanyDetailsScreen(),
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

class _UserInfoCard extends ConsumerStatefulWidget {
  final String uid;
  final String name;
  final String email;
  final String phone;
  final String profileImage;
  final String companyName;
  final String selectedEntity;

  const _UserInfoCard({
    required this.uid,
    required this.name,
    required this.email,
    required this.phone,
    required this.profileImage,
    required this.companyName,
    required this.selectedEntity,
  });

  @override
  ConsumerState<_UserInfoCard> createState() => _UserInfoCardState();
}

class _UserInfoCardState extends ConsumerState<_UserInfoCard> {
  bool _isUploading = false;

  void _showProfileMenu() {
    showModalBottomSheet(
      context: context,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20.r)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (widget.profileImage.isNotEmpty)
                ListTile(
                  leading: const Icon(LucideIcons.user),
                  title: const Text('View Profile Picture'),
                  onTap: () {
                    Navigator.pop(context);
                    _viewProfilePicture();
                  },
                ),
              ListTile(
                leading: const Icon(LucideIcons.camera),
                title: const Text('Take Photo'),
                onTap: () {
                  Navigator.pop(context);
                  _pickAndUploadImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: const Icon(LucideIcons.image),
                title: const Text('Choose from Gallery'),
                onTap: () {
                  Navigator.pop(context);
                  _pickAndUploadImage(ImageSource.gallery);
                },
              ),
              if (widget.profileImage.isNotEmpty)
                ListTile(
                  leading: const Icon(LucideIcons.trash2, color: Colors.red),
                  title: const Text('Remove Picture', style: TextStyle(color: Colors.red)),
                  onTap: () {
                    Navigator.pop(context);
                    _removeProfileImage();
                  },
                ),
            ],
          ),
        );
      },
    );
  }

  void _viewProfilePicture() {
    if (widget.profileImage.isEmpty) return;
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: EdgeInsets.zero,
        child: Stack(
          fit: StackFit.expand,
          children: [
            GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(color: Colors.black87),
            ),
            Center(
              child: InteractiveViewer(
                child: Image.network(
                  '$kBaseUrl/${widget.profileImage}',
                  fit: BoxFit.contain,
                ),
              ),
            ),
            Positioned(
              top: 40.r,
              right: 20.r,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 30),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickAndUploadImage(ImageSource source) async {
    if (widget.uid.isEmpty) return;
    final picker = ImagePicker();
    final pickedFile = await FilePickerUtil.pickImage(
      source: source,
      imageQuality: 50,
    );
    if (pickedFile != null) {
      final croppedFile = await ImageCropper().cropImage(
        sourcePath: pickedFile.path,
        aspectRatio: const CropAspectRatio(ratioX: 1, ratioY: 1),
        uiSettings: [
          AndroidUiSettings(
            toolbarTitle: 'Crop Profile Picture',
            toolbarColor: AppTheme.deepTeal,
            toolbarWidgetColor: Colors.white,
            initAspectRatio: CropAspectRatioPreset.square,
            lockAspectRatio: true,
          ),
          IOSUiSettings(
            title: 'Crop Profile Picture',
            aspectRatioLockEnabled: true,
            resetAspectRatioEnabled: false,
          ),
        ],
      );

      if (croppedFile != null) {
        setState(() => _isUploading = true);
        try {
          if (widget.selectedEntity.isNotEmpty && widget.selectedEntity != 'All Entities') {
            await ref.read(authRepositoryProvider).uploadEntityLogo(widget.uid, widget.selectedEntity, croppedFile.path);
          } else {
            await ref.read(authRepositoryProvider).uploadProfileImage(widget.uid, croppedFile.path);
          }
          ref.invalidate(userProfileProvider);
        } catch (e) {
      showGlobalError(e);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to upload image: $e')));
          }
        } finally {
          if (mounted) setState(() => _isUploading = false);
        }
      }
    }
  }

  Future<void> _removeProfileImage() async {
    if (widget.uid.isEmpty) return;
    setState(() => _isUploading = true);
    try {
      if (widget.selectedEntity.isNotEmpty && widget.selectedEntity != 'All Entities') {
        await ref.read(authRepositoryProvider).removeEntityLogo(widget.uid, widget.selectedEntity);
        ref.invalidate(userProfileProvider);
      } else {
        await ref.read(authRepositoryProvider).removeProfileImage(widget.uid);
        ref.invalidate(userProfileProvider);
      }
    } catch (e) {
      showGlobalError(e);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to remove image: $e')));
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
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
          // Avatar showing profile image or first letter of name
          GestureDetector(
            onTap: _showProfileMenu,
            onLongPress: widget.profileImage.isNotEmpty ? _viewProfilePicture : null,
            child: Stack(
              children: [
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
                    image: widget.profileImage.isNotEmpty
                        ? DecorationImage(
                            image: NetworkImage('$kBaseUrl/${widget.profileImage}'),
                            fit: BoxFit.cover,
                          )
                        : null,
                  ),
                  child: widget.profileImage.isEmpty
                      ? Center(
                          child: Text(
                            widget.name.isNotEmpty ? widget.name[0].toUpperCase() : 'U',
                            style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                                  color: AppTheme.corporateBlue,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 28.sp,
                                ),
                          ),
                        )
                      : null,
                ),
                if (_isUploading)
                  Positioned.fill(
                    child: Container(
                      decoration: const BoxDecoration(
                        color: Colors.black45,
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: CircularProgressIndicator(color: Colors.white),
                      ),
                    ),
                  ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    padding: EdgeInsets.all(4.r),
                    decoration: BoxDecoration(
                      color: AppTheme.corporateBlue,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2.r),
                    ),
                    child: Icon(LucideIcons.camera, color: Colors.white, size: 14.ip),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(width: 24.r),
          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.companyName.isNotEmpty ? widget.companyName : widget.name,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppTheme.deepTeal,
                        fontSize: 18.sp,
                      ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (widget.companyName.isNotEmpty) ...[
                  SizedBox(height: 4.r),
                  Row(
                    children: [
                      Icon(LucideIcons.user, size: 14.sp, color: Colors.grey.shade600),
                      SizedBox(width: 4.r),
                      Expanded(
                        child: Text(
                          widget.name,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey.shade600,
                            fontWeight: FontWeight.w500,
                            fontSize: 12.sp,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
                SizedBox(height: 12.r),
                Row(
                  children: [
                    Icon(LucideIcons.mail, size: 14.ip, color: Colors.grey),
                    SizedBox(width: 8.r),
                    Expanded(
                      child: Text(
                        widget.email,
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
                      widget.phone,
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
