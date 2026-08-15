// ignore_for_file: deprecated_member_use, unused_local_variable, unused_import, unused_element_parameter
import 'package:flutter/material.dart';

class SetPinScreen extends StatefulWidget {
  const SetPinScreen({super.key});

  @override
  State<SetPinScreen> createState() => _SetPinScreenState();
}

class _SetPinScreenState extends State<SetPinScreen> {
  String _enteredPin = '';
  String? _firstPin;
  String _errorMsg = '';
  
  void _onPinDigitPressed(String digit) {
    if (_enteredPin.length < 4) {
      setState(() {
        _enteredPin += digit;
        _errorMsg = '';
      });
      if (_enteredPin.length == 4) {
        Future.delayed(const Duration(milliseconds: 200), _processPinComplete);
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

  void _processPinComplete() {
    if (_firstPin == null) {
      setState(() {
        _firstPin = _enteredPin;
        _enteredPin = '';
      });
    } else {
      if (_firstPin == _enteredPin) {
        Navigator.pop(context, _enteredPin);
      } else {
        setState(() {
          _errorMsg = 'PINs do not match. Try again.';
          _firstPin = null;
          _enteredPin = '';
        });
      }
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
            alignment: Alignment.center,
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 28,
                fontFamily: 'sans-serif',
                fontWeight: FontWeight.w400,
                color: Colors.black,
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final title = _firstPin == null ? 'Set 4-Digit PIN' : 'Confirm 4-Digit PIN';
    final subtitle = _firstPin == null ? 'Create a PIN to secure your app' : 'Re-enter your PIN to confirm';

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: SafeArea(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(height: 20),
            Text(
              title,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w400,
                fontFamily: 'sans-serif',
                color: Colors.black,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 14,
                fontFamily: 'sans-serif',
                color: Colors.grey[600],
              ),
            ),
            const Spacer(),
            // PIN Dots
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(4, (index) {
                final isFilled = index < _enteredPin.length;
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 12),
                  width: 16,
                  height: 16,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isFilled ? Colors.black : Colors.transparent,
                    border: Border.all(
                      color: isFilled ? Colors.black : Colors.grey.shade400,
                      width: 1.5,
                    ),
                  ),
                );
              }),
            ),
            if (_errorMsg.isNotEmpty) ...[
              const SizedBox(height: 24),
              Text(
                _errorMsg,
                style: const TextStyle(color: Colors.red, fontFamily: 'sans-serif'),
              ),
            ],
            const Spacer(),
            // Keypad
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
              child: Column(
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
                              child: const Icon(Icons.backspace_outlined, size: 28, color: Colors.black),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
