import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand Colors (Wealth Empires Platinum)
  static const Color deepTeal = Color(0xFF0D1B1E);
  static const Color accentCyan = Color(0xFF00E5FF);
  static const Color neonPurple = Color(0xFF7C4DFF);
  static const Color innovationPurple = neonPurple; // Alias for compatibility
  static const Color backgroundLight = Color(0xFFF8FAFC);
  static const Color surfaceLight = Colors.white;
  static const Color corporateBlue = Color(0xFF1E3BB3);
  static const Color activeOrange = Color(0xFFFFA033);
  
  // Futuristic Gradients
  static LinearGradient get premiumGradient => const LinearGradient(
        colors: [deepTeal, Color(0xFF1E3A3A)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );

  static LinearGradient get headerGradient => const LinearGradient(
        colors: [corporateBlue, Color(0xFF3B5BDB)],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      );

  static LinearGradient get accentGradient => const LinearGradient(
        colors: [accentCyan, neonPurple],
        begin: Alignment.centerLeft,
        end: Alignment.centerRight,
      );

  // Glassmorphism System
  static BoxDecoration glassDecoration({
    required BuildContext context,
    double blur = 20,
    double opacity = 0.7,
  }) =>
      BoxDecoration(
        color: surfaceLight.withOpacity(opacity),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.2), width: 1.5),
        boxShadow: softShadow,
      );

  static List<BoxShadow> get softShadow => [
        BoxShadow(
          color: Colors.black.withOpacity(0.04),
          blurRadius: 40,
          offset: const Offset(0, 16),
        ),
      ];

  // Reusable Decorations for Forms
  static BoxDecoration warningDecoration({bool isCritical = false}) => BoxDecoration(
        color: isCritical
            ? Colors.red.withValues(alpha: 0.05)
            : Colors.amber.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isCritical
              ? Colors.red.withValues(alpha: 0.2)
              : Colors.amber.withValues(alpha: 0.3),
        ),
      );

  static BoxDecoration packageHeaderDecoration(List<Color> colors) => BoxDecoration(
        gradient: LinearGradient(
          colors: colors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
      );

  // Brand Styles (Preserved as per user request)
  static TextStyle get brandStyle => GoogleFonts.outfit(
        fontWeight: FontWeight.w900,
        letterSpacing: 2,
        color: deepTeal,
      );

  static ThemeData get lightTheme {
    final baseTextTheme = GoogleFonts.outfitTextTheme();
    
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: deepTeal,
      scaffoldBackgroundColor: backgroundLight,
      colorScheme: ColorScheme.fromSeed(
        seedColor: deepTeal,
        primary: deepTeal,
        secondary: accentCyan,
        tertiary: neonPurple,
        surface: surfaceLight,
      ),
      textTheme: baseTextTheme.copyWith(
        displayLarge: GoogleFonts.outfit(
          fontSize: 32,
          fontWeight: FontWeight.w900,
          color: deepTeal,
          letterSpacing: -1,
        ),
        headlineLarge: GoogleFonts.outfit(
          fontSize: 28,
          fontWeight: FontWeight.w900,
          color: deepTeal,
          letterSpacing: -0.5,
        ),
        headlineMedium: GoogleFonts.outfit(
          fontSize: 24,
          fontWeight: FontWeight.w800,
          color: deepTeal,
        ),
        titleLarge: GoogleFonts.outfit(
          fontSize: 20,
          fontWeight: FontWeight.w800,
          color: deepTeal,
        ),
        titleMedium: GoogleFonts.outfit(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: deepTeal,
        ),
        bodyLarge: GoogleFonts.outfit(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: deepTeal.withOpacity(0.8),
        ),
        bodyMedium: GoogleFonts.outfit(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: Colors.grey[700],
        ),
        labelLarge: GoogleFonts.outfit(
          fontSize: 12,
          fontWeight: FontWeight.w900,
          letterSpacing: 1.2,
          color: deepTeal,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        systemOverlayStyle: const SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.dark, // Dark icons for light bg
          statusBarBrightness: Brightness.light,    // For iOS
          systemNavigationBarColor: Colors.white,
          systemNavigationBarIconBrightness: Brightness.dark,
        ),
        iconTheme: const IconThemeData(color: deepTeal),
        titleTextStyle: GoogleFonts.outfit(
          color: deepTeal,
          fontSize: 20,
          fontWeight: FontWeight.w800,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          backgroundColor: deepTeal,
          foregroundColor: Colors.white,
          minimumSize: const Size(0, 56),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700),
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: surfaceLight,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        hintStyle: GoogleFonts.outfit(color: Colors.grey[400], fontSize: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: Colors.grey.withOpacity(0.1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: Colors.grey.withOpacity(0.1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Colors.black, width: 1.5),
        ),
      ),
    );
  }

  // Restore darkTheme to fix compilation errors in main.dart
  static ThemeData get darkTheme => lightTheme.copyWith(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF020617),
        textTheme: lightTheme.textTheme.apply(
          bodyColor: Colors.white,
          displayColor: Colors.white,
        ),
      );
}
