import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:crm_app/core/utils/biometric_util.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late BiometricUtil util;

  setUp(() {
    // Mock SharedPreferences for testing
    SharedPreferences.setMockInitialValues({});
    util = BiometricUtil();
  });

  group('BiometricUtil PIN tests', () {
    test('isPinEnabled returns false initially', () async {
      final isEnabled = await util.isPinEnabled();
      expect(isEnabled, false);
    });

    test('getAppPin returns null initially', () async {
      final pin = await util.getAppPin();
      expect(pin, isNull);
    });

    test('setAppPin saves the PIN and enables PIN lock', () async {
      await util.setAppPin('1234');
      
      final isEnabled = await util.isPinEnabled();
      expect(isEnabled, true);
      
      final pin = await util.getAppPin();
      expect(pin, '1234');
    });

    test('removeAppPin deletes the PIN', () async {
      await util.setAppPin('4321');
      await util.removeAppPin();
      
      final isEnabled = await util.isPinEnabled();
      expect(isEnabled, false);
      
      final pin = await util.getAppPin();
      expect(pin, isNull);
    });
  });
}
