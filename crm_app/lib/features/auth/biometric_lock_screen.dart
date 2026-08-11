import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/utils/biometric_util.dart';
import '../common/main_navigation.dart';
import '../../providers/auth_provider.dart';
import '../../core/theme/app_theme.dart';

class BiometricLockScreen extends ConsumerStatefulWidget {
  const BiometricLockScreen({super.key});

  @override
  ConsumerState<BiometricLockScreen> createState() => _BiometricLockScreenState();
}

class _BiometricLockScreenState extends ConsumerState<BiometricLockScreen> {
  bool _isChecking = true;
  bool _isLocked = true;

  @override
  void initState() {
    super.initState();
    _checkBiometricOnStartup();
  }

  Future<void> _checkBiometricOnStartup() async {
    final util = ref.read(biometricProvider);
    final isEnabled = await util.isBiometricEnabled();
    
    if (isEnabled) {
      _promptAuth();
    } else {
      if (mounted) {
        setState(() {
          _isLocked = false;
          _isChecking = false;
        });
      }
    }
  }

  Future<void> _promptAuth() async {
    setState(() {
      _isChecking = true;
    });
    final util = ref.read(biometricProvider);
    final success = await util.authenticate(reason: 'Authenticate to unlock the app');
    
    if (mounted) {
      setState(() {
        _isLocked = !success;
        _isChecking = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_isLocked) {
      return const MainNavigationScreen();
    }

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppTheme.corporateBlue.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.fingerprint,
                  size: 64,
                  color: AppTheme.corporateBlue,
                ),
              ),
              const SizedBox(height: 32),
              Text(
                'App Locked',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppTheme.deepTeal,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Use your fingerprint or Face ID to unlock the app securely.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 48),
              if (_isChecking)
                const CircularProgressIndicator()
              else
                ElevatedButton.icon(
                  onPressed: _promptAuth,
                  icon: const Icon(Icons.lock_open, color: Colors.white,),
                  label: const Text('Unlock App', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.corporateBlue,
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                  ),
                ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () {
                  ref.read(authRepositoryProvider).signOut();
                },
                child: const Text('Log Out', style: TextStyle(color: Colors.redAccent)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
