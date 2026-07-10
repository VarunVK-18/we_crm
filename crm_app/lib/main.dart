import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'core/widgets/network_overlay_wrapper.dart';
import 'features/auth/auth_wrapper.dart';

import 'features/splash/splash_screen.dart';


import 'package:firebase_core/firebase_core.dart';
import 'core/services/firebase_messaging_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase (will use google-services.json for config on Android)
  await Firebase.initializeApp();

  // Initialize our custom messaging service
  final messagingService = FirebaseMessagingService();
  messagingService.initialize();

  // Explicitly ensure status bar and system navigation are visible
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  runApp(
    const ProviderScope(
      child: MainApp(),
    ),
  );
}

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'We CRM',
      navigatorKey: navigatorKey,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,
      home: const SplashScreen(),
      builder: (context, child) {
        final mediaQueryData = MediaQuery.of(context);
        return NetworkOverlayWrapper(
          child: MediaQuery(
            data: mediaQueryData.copyWith(
              textScaler: mediaQueryData.textScaler.clamp(
                minScaleFactor: 0.8,
                maxScaleFactor: 1.15,
              ),
            ),
            child: child!,
          ),
        );
      },
    );
  }
}
