import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/responsive.dart';

class GlassCard extends StatelessWidget {
  final Widget child;
  final double? width;
  final double? height;
  final EdgeInsetsGeometry? padding;
  final Color? glowColor;

  const GlassCard({
    super.key,
    required this.child,
    this.width,
    this.height,
    this.padding,
    this.glowColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width != null ? width!.r : null,
      height: height != null ? height!.r : null,
      decoration: AppTheme.glassDecoration(context: context),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24.r),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            padding: padding ?? EdgeInsets.all(24.r),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.white.withOpacity(0.1),
                  Colors.white.withOpacity(0.05),
                ],
              ),
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}

class FuturisticButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;
  final dynamic icon;
  final bool isSecondary;

  const FuturisticButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.isSecondary = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16.r),
        gradient: isSecondary ? null : AppTheme.accentGradient,
        boxShadow: isSecondary
            ? null
            : [
                BoxShadow(
                  color: AppTheme.accentCyan.withOpacity(0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
      ),
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: isSecondary ? Colors.white : Colors.transparent,
          foregroundColor: isSecondary ? AppTheme.deepTeal : Colors.white,
          shadowColor: Colors.transparent,
          padding: EdgeInsets.symmetric(horizontal: 24.r, vertical: 16.r),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16.r),
            side: isSecondary
                ? BorderSide(color: Colors.grey.withOpacity(0.2))
                : BorderSide.none,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              if (icon is IconData)
                Icon(icon as IconData, size: 20.ip)
              else
                HugeIcon(
                  icon: icon,
                  size: 20.ip,
                  color: isSecondary ? AppTheme.deepTeal : Colors.white,
                ),
              SizedBox(width: 12.r),
            ],
            Text(
              label,
              style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}

class PremiumStatCard extends StatelessWidget {
  final String title;
  final String value;
  final String trend;
  final dynamic icon;
  final Color color;

  const PremiumStatCard({
    super.key,
    required this.title,
    required this.value,
    required this.trend,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: EdgeInsets.all(20.r),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: EdgeInsets.all(10.r),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12.r),
                ),
                child: icon is IconData
                    ? Icon(icon as IconData, color: color, size: 20.ip)
                    : HugeIcon(icon: icon, color: color, size: 20.ip),
              ),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 8.r, vertical: 4.r),
                decoration: BoxDecoration(
                  color: trend.startsWith('+')
                      ? Colors.green.withOpacity(0.1)
                      : Colors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8.r),
                ),
                child: Text(
                  trend,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: trend.startsWith('+') ? Colors.green : Colors.red,
                    fontWeight: FontWeight.bold,
                    fontSize: 10.sp,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 16.r),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.w900,
              color: AppTheme.deepTeal,
              letterSpacing: -0.5,
              fontSize: 24.sp,
            ),
          ),
          SizedBox(height: 4.r),
          Text(
            title,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: Colors.grey[500],
              fontWeight: FontWeight.w600,
              fontSize: 12.sp,
            ),
          ),
        ],
      ),
    );
  }
}

class CircleServiceButton extends StatelessWidget {
  final String label;
  final dynamic icon;
  final VoidCallback onTap;
  final Color? color;

  const CircleServiceButton({
    super.key,
    required this.label,
    required this.icon,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(right: 16.r),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16.r),
        child: Column(
          children: [
            Container(
              width: 56.r,
              height: 56.r,
              decoration: BoxDecoration(
                color: (color ?? AppTheme.corporateBlue).withOpacity(0.08),
                shape: BoxShape.circle,
                border: Border.all(
                  color: (color ?? AppTheme.corporateBlue).withOpacity(0.05),
                ),
              ),
              child: Center(
                child: icon is IconData
                    ? Icon(
                        icon as IconData,
                        color: color ?? AppTheme.corporateBlue,
                        size: 22.ip,
                      )
                    : HugeIcon(
                        icon: icon,
                        color: color ?? AppTheme.corporateBlue,
                        size: 22.ip,
                        strokeWidth: 1.5,
                      ),
              ),
            ),
            SizedBox(height: 10.r),
            SizedBox(
              width: 68.r,
              child: Text(
                label,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppTheme.deepTeal,
                  fontSize: 11.sp,
                  height: 1.2,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class SectionHeader extends StatelessWidget {
  final String title;
  final TextStyle? style;
  const SectionHeader({super.key, required this.title, this.style});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          title,
          style:
              style ??
              Theme.of(context).textTheme.titleMedium?.copyWith(
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
      ],
    );
  }
}

class ResponsiveHeader extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget? action;
  final Color? textColor;
  final Color? subtitleColor;

  const ResponsiveHeader({
    super.key,
    required this.title,
    required this.subtitle,
    this.action,
    this.textColor,
    this.subtitleColor,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isMobile = constraints.maxWidth < 600;

        if (isMobile) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      color: textColor ?? AppTheme.deepTeal,
                      height: 1.2,
                      fontSize: 24.sp,
                    ),
                  ),
                  SizedBox(height: 4.r),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: subtitleColor ?? Colors.grey,
                      fontSize: 13.sp,
                    ),
                  ),
                ],
              ),
              if (action != null) ...[SizedBox(height: 16.r), action!],
            ],
          );
        }

        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      color: textColor ?? AppTheme.deepTeal,
                      fontSize: 24.sp,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: subtitleColor ?? Colors.grey,
                      fontSize: 13.sp,
                    ),
                  ),
                ],
              ),
            ),
            if (action != null) action!,
          ],
        );
      },
    );
  }
}

class ProfileTile extends StatefulWidget {
  final dynamic icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final Color? color;

  const ProfileTile({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.color,
  });

  @override
  State<ProfileTile> createState() => _ProfileTileState();
}

class _ProfileTileState extends State<ProfileTile> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) {
        setState(() => _isPressed = false);
        widget.onTap();
      },
      onTapCancel: () => setState(() => _isPressed = false),
      child: AnimatedScale(
        scale: _isPressed ? 0.98 : 1.0,
        duration: const Duration(milliseconds: 150),
        curve: Curves.easeInOut,
        child: Container(
          color: Colors.transparent, // Required for GestureDetector to catch taps on empty space
          child: ListTile(
            contentPadding: EdgeInsets.symmetric(horizontal: 24.r, vertical: 6.r),
            leading: Container(
              padding: EdgeInsets.all(12.r),
              decoration: BoxDecoration(
                color: (widget.color ?? AppTheme.corporateBlue).withOpacity(0.15),
                borderRadius: BorderRadius.circular(12.r),
              ),
              child: widget.icon is IconData
                  ? Icon(
                      widget.icon as IconData,
                      color: widget.color ?? AppTheme.corporateBlue,
                      size: 22.ip,
                    )
                  : HugeIcon(
                      icon: widget.icon,
                      color: widget.color ?? AppTheme.corporateBlue,
                      size: 22.ip,
                    ),
            ),
            title: Text(
              widget.title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: widget.color ?? AppTheme.deepTeal,
                fontWeight: FontWeight.w600, // Card title weight 600
                fontSize: 15.sp,
              ),
            ),
            subtitle: Text(
              widget.subtitle,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey[500],
                fontWeight: FontWeight.w400, // Subtitle weight 400
                fontSize: 11.sp,
              ),
            ),
            trailing: Icon(
              LucideIcons.chevronRight,
              size: 18.ip,
              color: Colors.grey[400],
            ),
          ),
        ),
      ),
    );
  }
}
