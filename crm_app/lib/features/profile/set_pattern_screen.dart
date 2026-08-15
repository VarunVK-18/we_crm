// ignore_for_file: deprecated_member_use, unused_local_variable, unused_import, unused_element_parameter
import 'package:flutter/material.dart';
import 'package:pattern_lock/pattern_lock.dart';
import '../../core/theme/app_theme.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/utils/responsive.dart';

class SetPatternScreen extends StatefulWidget {
  const SetPatternScreen({super.key});

  @override
  State<SetPatternScreen> createState() => _SetPatternScreenState();
}

class _SetPatternScreenState extends State<SetPatternScreen> {
  List<int>? _firstPattern;
  bool _isConfirming = false;
  String _message = 'Draw an unlock pattern';
  Color _messageColor = AppTheme.deepTeal;

  void _onPatternComplete(List<int> input) {
    if (input.length < 4) {
      setState(() {
        _message = 'Connect at least 4 dots. Try again.';
        _messageColor = Colors.red;
      });
      return;
    }

    if (!_isConfirming) {
      setState(() {
        _firstPattern = input;
        _isConfirming = true;
        _message = 'Pattern recorded. Draw again to confirm.';
        _messageColor = AppTheme.corporateBlue;
      });
    } else {
      if (_firstPattern != null && _firstPattern!.length == input.length && 
          _firstPattern!.asMap().entries.every((e) => e.value == input[e.key])) {
        // Match!
        final patternString = input.join(',');
        Navigator.pop(context, patternString);
      } else {
        setState(() {
          _message = 'Patterns do not match. Try again.';
          _messageColor = Colors.red;
          _isConfirming = false;
          _firstPattern = null;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          'Set Pattern Lock',
          style: GoogleFonts.outfit(
            color: AppTheme.deepTeal,
            fontWeight: FontWeight.w600,
            fontSize: 18.sp,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppTheme.deepTeal),
      ),
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 60),
            Text(
              _message,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: _messageColor,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 60),
            Flexible(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40.0),
                child: PatternLock(
                  selectedColor: AppTheme.corporateBlue,
                  pointRadius: 8,
                  showInput: true,
                  dimension: 3,
                  relativePadding: 0.7,
                  selectThreshold: 25,
                  fillPoints: true,
                  onInputComplete: _onPatternComplete,
                ),
              ),
            ),
            const SizedBox(height: 40),
            TextButton(
              onPressed: () {
                setState(() {
                  _firstPattern = null;
                  _isConfirming = false;
                  _message = 'Draw an unlock pattern';
                  _messageColor = AppTheme.deepTeal;
                });
              },
              child: const Text('Reset', style: TextStyle(color: AppTheme.corporateBlue, fontSize: 16)),
            ),
          ],
        ),
      ),
    );
  }
}
