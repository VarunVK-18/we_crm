import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const String _kBiometricEnabledKey = 'biometric_enabled';
const String _kAppPinKey = 'app_pin';
const String _kAppPatternKey = 'app_pattern';
const String _kActiveSecurityMethodKey = 'active_security_method';

final biometricProvider = Provider<BiometricUtil>((ref) {
  return BiometricUtil();
});

class BiometricUtil {
  final LocalAuthentication _auth = LocalAuthentication();

  Future<bool> isBiometricAvailable() async {
    try {
      final bool canAuthenticateWithBiometrics = await _auth.canCheckBiometrics;
      final bool canAuthenticate = canAuthenticateWithBiometrics || await _auth.isDeviceSupported();
      return canAuthenticate;
    } on PlatformException {
      return false;
    }
  }

  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      return await _auth.getAvailableBiometrics();
    } on PlatformException {
      return <BiometricType>[];
    }
  }

  Future<bool> authenticate({String reason = 'Authenticate to access the app'}) async {
    try {
      return await _auth.authenticate(
        localizedReason: reason,
        persistAcrossBackgrounding: true,
        biometricOnly: false,
      );
    } on PlatformException {
      return false;
    }
  }

  Future<bool> isBiometricEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_kBiometricEnabledKey) ?? false;
  }

  Future<void> setBiometricEnabled(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kBiometricEnabledKey, enabled);
  }

  Future<bool> isPinEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_kAppPinKey) != null;
  }
  
  Future<String?> getAppPin() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_kAppPinKey);
  }
  
  Future<void> setAppPin(String pin) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kAppPinKey, pin);
  }
  
  Future<void> removeAppPin() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kAppPinKey);
  }

  Future<bool> isPatternEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_kAppPatternKey) != null;
  }
  
  Future<String?> getAppPattern() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_kAppPatternKey);
  }
  
  Future<void> setAppPattern(String pattern) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kAppPatternKey, pattern);
  }
  
  Future<void> removeAppPattern() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kAppPatternKey);
  }

  Future<String> getActiveSecurityMethod() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_kActiveSecurityMethodKey) ?? 'none';
  }

  Future<void> setActiveSecurityMethod(String method) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kActiveSecurityMethodKey, method);
  }
}
