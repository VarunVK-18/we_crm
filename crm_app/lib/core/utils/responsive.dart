import 'package:flutter/material.dart';

class Responsive {
  static double _screenWidth = 375.0;
  static double _screenHeight = 812.0;
  static double _scaleFactor = 1.0;

  static void init(BuildContext context) {
    final media = MediaQuery.of(context);
    _screenWidth = media.size.width;
    _screenHeight = media.size.height;
    
    // Baseline reference: standard 375.0dp width screen
    final double scale = _screenWidth / 375.0;
    
    // Clamp the scale factor strictly to guarantee perfectly scaled layouts
    _scaleFactor = scale.clamp(0.85, 1.25);
  }

  /// Scales layout dimensions (paddings, margins, widths, heights)
  static double scale(double value) => value * _scaleFactor;

  /// Scales typography font sizes
  static double scaleFont(double value) => value * _scaleFactor;

  /// Scales icon sizes
  static double scaleIcon(double value) => value * _scaleFactor;
}

/// Dynamic size extension
extension ResponsiveDouble on double {
  double get r => Responsive.scale(this);
  double get sp => Responsive.scaleFont(this);
  double get ip => Responsive.scaleIcon(this);
}

extension ResponsiveInt on int {
  double get r => Responsive.scale(toDouble());
  double get sp => Responsive.scaleFont(toDouble());
  double get ip => Responsive.scaleIcon(toDouble());
}
