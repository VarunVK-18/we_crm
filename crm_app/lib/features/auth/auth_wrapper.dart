import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';
import '../common/main_navigation.dart';
import 'login_screen.dart';

class AuthWrapper extends ConsumerWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);

    return authState.when(
      data: (user) {
        debugPrint('AuthWrapper Data: ${user?.uid}');
        if (user != null) {
          return const MainNavigationScreen();
        }
        return const LoginScreen();
      },
      loading: () {
        debugPrint('AuthWrapper Loading...');
        return const Scaffold(
          body: Center(
            child: CircularProgressIndicator(),
          ),
        );
      },
      error: (e, s) {
        debugPrint('AuthWrapper Error: $e');
        return Scaffold(
          body: Center(
            child: Text('Authentication Error: $e'),
          ),
        );
      },
    );
  }
}
