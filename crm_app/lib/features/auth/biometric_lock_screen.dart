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
  
  bool _isBiometricEnabled = false;
  bool _isPinEnabled = false;
  
  String _savedPin = '';
  String _enteredPin = '';
  String _errorMsg = '';

  @override
  void initState() {
    super.initState();
    _checkSecurityOnStartup();
  }

  Future<void> _checkSecurityOnStartup() async {
    final util = ref.read(biometricProvider);
    _isBiometricEnabled = await util.isBiometricEnabled();
    _isPinEnabled = await util.isPinEnabled();
    _savedPin = (await util.getAppPin()) ?? '';
    
    if (_isBiometricEnabled) {
      _promptBiometric();
    } else if (_isPinEnabled) {
      if (mounted) {
        setState(() {
          _isChecking = false;
        });
      }
    } else {
      if (mounted) {
        setState(() {
          _isLocked = false;
          _isChecking = false;
        });
      }
    }
  }

  Future<void> _promptBiometric() async {
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
  
  void _onPinDigitPressed(String digit) {
    if (_enteredPin.length < 4) {
      setState(() {
        _enteredPin += digit;
        _errorMsg = '';
      });
      if (_enteredPin.length == 4) {
        _verifyPin();
      }
    }
  }
  
  void _onPinDelete() {
    if (_enteredPin.isNotEmpty) {
      setState(() {
        _enteredPin = _enteredPin.substring(0, _enteredPin.length - 1);
        _errorMsg = '';
      });
    }
  }
  
  void _verifyPin() {
    if (_enteredPin == _savedPin) {
      setState(() {
        _isLocked = false;
      });
    } else {
      setState(() {
        _errorMsg = 'Incorrect PIN';
        _enteredPin = '';
      });
    }
  }

  Widget _buildKeypadButton(String text) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: InkWell(
          onTap: () => _onPinDigitPressed(text),
          borderRadius: BorderRadius.circular(40),
          child: Container(
            height: 70,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                )
              ]
            ),
            alignment: Alignment.center,
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: AppTheme.corporateBlue,
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!_isLocked) {
      return const MainNavigationScreen();
    }

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Spacer(),
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppTheme.corporateBlue.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    _isPinEnabled ? Icons.lock_outline : Icons.fingerprint,
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
                Text(
                  _isPinEnabled ? 'Enter your 4-digit PIN to unlock' : 'Use your fingerprint or Face ID to unlock the app securely.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 32),
                if (_isChecking)
                  const CircularProgressIndicator()
                else if (_isPinEnabled) ...[
                  // PIN Dots
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(4, (index) {
                      return Container(
                        margin: const EdgeInsets.symmetric(horizontal: 12),
                        width: 16,
                        height: 16,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: index < _enteredPin.length ? AppTheme.corporateBlue : Colors.grey.shade300,
                        ),
                      );
                    }),
                  ),
                  if (_errorMsg.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Text(_errorMsg, style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                  ],
                  const SizedBox(height: 48),
                  // Keypad
                  Column(
                    children: [
                      Row(children: [_buildKeypadButton('1'), _buildKeypadButton('2'), _buildKeypadButton('3')]),
                      Row(children: [_buildKeypadButton('4'), _buildKeypadButton('5'), _buildKeypadButton('6')]),
                      Row(children: [_buildKeypadButton('7'), _buildKeypadButton('8'), _buildKeypadButton('9')]),
                      Row(
                        children: [
                          const Expanded(child: SizedBox()),
                          _buildKeypadButton('0'),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.all(8.0),
                              child: InkWell(
                                onTap: _onPinDelete,
                                borderRadius: BorderRadius.circular(40),
                                child: Container(
                                  height: 70,
                                  alignment: Alignment.center,
                                  child: const Icon(Icons.backspace_outlined, size: 28, color: Colors.grey),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ] else
                  ElevatedButton.icon(
                    onPressed: _promptBiometric,
                    icon: const Icon(Icons.lock_open, color: Colors.white,),
                    label: const Text('Unlock App', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.corporateBlue,
                      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                    ),
                  ),
                const Spacer(),
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
      ),
    );
  }
}
