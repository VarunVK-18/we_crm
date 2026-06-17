import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme/app_theme.dart';

class WeLoader extends StatefulWidget {
  final Color? color;
  final double size;
  
  const WeLoader({super.key, this.color, this.size = 26.0});

  @override
  State<WeLoader> createState() => _WeLoaderState();
}

class _WeLoaderState extends State<WeLoader> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Widget _buildAnimatedIcon(Widget icon, int index) {
    final isRightFirst = index % 2 == 0;
    
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final t = _controller.value;
        
        double scale = 0.9;
        double rotateDeg = 0.0;
        double opacity = 0.7;

        if (t <= 0.25) {
          final progress = t / 0.25;
          scale = 0.9 + (0.2 * progress);
          rotateDeg = 10 * progress;
          opacity = 0.7 + (0.3 * progress);
        } else if (t <= 0.5) {
          final progress = (t - 0.25) / 0.25;
          scale = 1.1 - (0.2 * progress);
          rotateDeg = 10 - (10 * progress);
          opacity = 1.0 - (0.3 * progress);
        } else if (t <= 0.75) {
          final progress = (t - 0.5) / 0.25;
          scale = 0.9 + (0.2 * progress);
          rotateDeg = -10 * progress;
          opacity = 0.7 + (0.3 * progress);
        } else {
          final progress = (t - 0.75) / 0.25;
          scale = 1.1 - (0.2 * progress);
          rotateDeg = -10 + (10 * progress);
          opacity = 1.0 - (0.3 * progress);
        }

        if (!isRightFirst) {
          rotateDeg = -rotateDeg;
        }

        return Transform(
          alignment: Alignment.center,
          transform: Matrix4.identity()
            ..scale(scale)
            ..rotateZ(rotateDeg * math.pi / 180),
          child: Opacity(
            opacity: opacity,
            child: child,
          ),
        );
      },
      child: icon,
    );
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.color ?? AppTheme.deepTeal;
    final size = widget.size;
    final fontWeight = FontWeight.w600;

    return Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _buildAnimatedIcon(Icon(LucideIcons.fileText, color: color, size: size), 0),
        const SizedBox(width: 14),
        _buildAnimatedIcon(Text('TM', style: TextStyle(color: color, fontSize: size * 0.7, fontWeight: fontWeight, letterSpacing: 0.5)), 1),
        const SizedBox(width: 14),
        _buildAnimatedIcon(
          Container(
            width: size * 0.9,
            height: size * 0.9,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: color, width: 2),
            ),
            child: Text('R', style: TextStyle(color: color, fontSize: size * 0.5, fontWeight: fontWeight, height: 1.1)),
          ), 
          2
        ),
        const SizedBox(width: 14),
        _buildAnimatedIcon(Icon(LucideIcons.gavel, color: color, size: size), 3),
        const SizedBox(width: 14),
        _buildAnimatedIcon(Icon(LucideIcons.landmark, color: color, size: size), 4),
      ],
    );
  }
}
