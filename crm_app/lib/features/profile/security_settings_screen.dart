// ignore_for_file: deprecated_member_use, unused_local_variable, unused_import, unused_element_parameter
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:local_auth/local_auth.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/biometric_util.dart';
import '../../core/utils/responsive.dart';
import 'set_pattern_screen.dart';
import 'set_pin_screen.dart';
import '../common/ui_components.dart';

class SecuritySettingsScreen extends ConsumerStatefulWidget {
  const SecuritySettingsScreen({super.key});

  @override
  ConsumerState<SecuritySettingsScreen> createState() => _SecuritySettingsScreenState();
}

class _SecuritySettingsScreenState extends ConsumerState<SecuritySettingsScreen> {
  String _activeMethod = 'none';
  bool _isLoading = true;
  bool _hasFingerprint = false;
  bool _hasFace = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final util = ref.read(biometricProvider);
    final active = await util.getActiveSecurityMethod();
    
    // Check available biometrics
    final availableBiometrics = await util.getAvailableBiometrics();
    final hasFingerprint = availableBiometrics.contains(BiometricType.fingerprint) || availableBiometrics.contains(BiometricType.strong);
    final hasFace = availableBiometrics.contains(BiometricType.face);

    setState(() {
      _activeMethod = active;
      _hasFingerprint = hasFingerprint;
      _hasFace = hasFace;
      _isLoading = false;
    });
  }

  Future<void> _changeMethod(String method) async {
    if (method == _activeMethod) return;

    final util = ref.read(biometricProvider);

    if (method == 'none') {
      await util.setActiveSecurityMethod('none');
      setState(() => _activeMethod = 'none');
      return;
    }

    if (method == 'pin') {
      final pin = await Navigator.push<String>(
        context,
        MaterialPageRoute(builder: (_) => const SetPinScreen()),
      );
      if (pin != null) {
        await util.setAppPin(pin);
        await util.setActiveSecurityMethod('pin');
        setState(() => _activeMethod = 'pin');
      }
      return;
    }

    if (method == 'pattern') {
      final pattern = await Navigator.push<String>(
        context,
        MaterialPageRoute(builder: (_) => const SetPatternScreen()),
      );
      if (pattern != null) {
        await util.setAppPattern(pattern);
        await util.setActiveSecurityMethod('pattern');
        setState(() => _activeMethod = 'pattern');
      }
      return;
    }

    if (method == 'fingerprint' || method == 'face') {
      final success = await util.authenticate(reason: 'Authenticate to enable biometric login');
      if (success) {
        await util.setActiveSecurityMethod(method);
        setState(() => _activeMethod = method);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to authenticate. Biometric lock not enabled.'), backgroundColor: Colors.red),
          );
        }
      }
      return;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Colors.white,
        body: Center(child: CircularProgressIndicator(color: AppTheme.corporateBlue)),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: Text(
          'App Lock Settings',
          style: GoogleFonts.outfit(
            color: AppTheme.deepTeal,
            fontWeight: FontWeight.w600,
            fontSize: 18.sp,
          ),
        ),
        backgroundColor: AppTheme.backgroundLight,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppTheme.deepTeal),
      ),
      body: ListView(
        padding: EdgeInsets.all(24.r),
        children: [
          Text(
            'Select your preferred method to lock and secure the app.',
            style: TextStyle(fontSize: 14.sp, color: AppTheme.deepTeal, fontWeight: FontWeight.w200),
          ),
          SizedBox(height: 24.r),
          Container(
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
              child: Column(
                children: [
                  _buildOption('none', 'None', 'No app lock', Icons.lock_open),
                  _buildOption('pin', '4-Digit PIN', 'Unlock with a PIN code', Icons.pin_outlined),
                  _buildOption('pattern', 'Pattern Lock', 'Draw an unlock pattern', Icons.gesture),
                  if (_hasFingerprint)
                    _buildOption('fingerprint', 'Fingerprint Lock', 'Use your fingerprint', Icons.fingerprint),
                  if (_hasFace)
                    _buildOption('face', 'Face Lock', 'Use face recognition', Icons.face),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOption(String method, String title, String subtitle, IconData icon) {
    final isSelected = _activeMethod == method;
    return ProfileTile(
      icon: icon,
      title: title,
      subtitle: subtitle,
      trailing: isSelected ? const Icon(Icons.check_circle, color: AppTheme.corporateBlue) : const SizedBox.shrink(),
      onTap: () => _changeMethod(method),
    );
  }
}
