import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'core/widgets/network_overlay_wrapper.dart';
import 'features/auth/auth_wrapper.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

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

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'We CRM',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,
      home: const AuthWrapper(),
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
