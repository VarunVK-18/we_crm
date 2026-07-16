import 'package:flutter/material.dart';

import 'package:in_app_update/in_app_update.dart';
import 'dart:io';
import 'package:flutter/foundation.dart';

import '../auth/auth_wrapper.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    );

    _opacity = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.0, end: 1.0).chain(CurveTween(curve: Curves.easeIn)),
        weight: 20,
      ),
      TweenSequenceItem(tween: ConstantTween(1.0), weight: 60),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 0.0).chain(CurveTween(curve: Curves.easeOut)),
        weight: 20,
      ),
    ]).animate(_controller);

    _controller.forward();
    _initAppAndCheckForUpdate();
  }

  Future<void> _initAppAndCheckForUpdate() async {
    // Check for updates on Android
    if (!kIsWeb && Platform.isAndroid) {
      try {
        final updateInfo = await InAppUpdate.checkForUpdate();
        if (updateInfo.updateAvailability == UpdateAvailability.updateAvailable) {
          // You can also use performImmediateUpdate() depending on preference
          await InAppUpdate.performImmediateUpdate();
        }
      } catch (e) {
        debugPrint('Update check failed: $e');
      }
    }

    // Navigate to AuthWrapper after animation completes
    // Assuming the update process completes or is skipped
    Future.delayed(const Duration(milliseconds: 2500), () {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) =>
                const AuthWrapper(),
            transitionDuration: Duration.zero,
            reverseTransitionDuration: Duration.zero,
          ),
        );
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: FadeTransition(
        opacity: _opacity,
        child: Center(
          child: Transform.scale(
            scale: 1.02, // Slight zoom to hide the edge line artifact in the image
            child: Image.asset(
              'assets/images/splash_screen.jpg',
              fit: BoxFit.fitWidth,
              width: double.infinity,
            ),
          ),
        ),
      ),
    );
  }
}
