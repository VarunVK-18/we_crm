import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/error_handler.dart';
import '../../../providers/auth_provider.dart';

class ChangePasswordDialog extends ConsumerStatefulWidget {
  final bool isForced;
  const ChangePasswordDialog({super.key, this.isForced = false});

  static Future<void> show(BuildContext context, {bool isForced = false}) {
    return showDialog(
      context: context,
      barrierDismissible: !isForced,
      builder: (ctx) => WillPopScope(
        onWillPop: () async => !isForced,
        child: ChangePasswordDialog(isForced: isForced),
      ),
    );
  }

  @override
  ConsumerState<ChangePasswordDialog> createState() => _ChangePasswordDialogState();
}

class _ChangePasswordDialogState extends ConsumerState<ChangePasswordDialog> {
  final _formKey = GlobalKey<FormState>();
  final _oldPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscureOld = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _oldPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  bool _hasMinMaxLen(String val) => val.length >= 8 && val.length <= 16;
  bool _hasUppercase(String val) => RegExp(r'[A-Z]').hasMatch(val);
  bool _hasNumber(String val) => RegExp(r'[0-9]').hasMatch(val);
  bool _hasNoEmoji(String val) => val.isNotEmpty && RegExp(r'^[\x21-\x7E]+$').hasMatch(val);

  bool _isPasswordValid(String val) {
    return _hasMinMaxLen(val) && _hasUppercase(val) && _hasNumber(val) && _hasNoEmoji(val);
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    final newPass = _newPasswordController.text;
    if (!_isPasswordValid(newPass)) {
      setState(() {
        _errorMessage = 'Please meet all password requirements.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await ref.read(authRepositoryProvider).changePassword(
        oldPassword: _oldPasswordController.text,
        newPassword: _newPasswordController.text,
        confirmPassword: _confirmPasswordController.text,
      );

      if (mounted) {
        ref.read(authRepositoryProvider).markPasswordChanged();
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(LucideIcons.checkCircle2, color: Colors.white, size: 18),
                const SizedBox(width: 10),
                Text(
                  'Password updated successfully!',
                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
                ),
              ],
            ),
            backgroundColor: const Color(0xFF10B981),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } catch (e) {
      showGlobalError(e);
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }



  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Flexible(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.only(left: 24.0, right: 24.0, top: 20.0, bottom: 8.0),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      widget.isForced ? 'Change Default Password' : 'Change Password',
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    if (!widget.isForced)
                      IconButton(
                        icon: const Icon(LucideIcons.x, size: 20, color: Colors.black54),
                        onPressed: () => Navigator.pop(context),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                  ],
                ),
                if (widget.isForced) ...[
                  const SizedBox(height: 8),
                  Text(
                    'For security reasons, you must change your password before using the application.',
                    style: GoogleFonts.inter(fontSize: 12, color: Colors.black54),
                  ),
                ],
                const SizedBox(height: 8),
                Text(
                  'Password Requirements:',
                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                ),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('• 8 to 16 characters', style: GoogleFonts.inter(color: Colors.black87, fontSize: 12)),
                          const SizedBox(height: 4),
                          Text('• 1 uppercase letter', style: GoogleFonts.inter(color: Colors.black87, fontSize: 12)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('• 1 numeric digit', style: GoogleFonts.inter(color: Colors.black87, fontSize: 12)),
                          const SizedBox(height: 4),
                          Text('• 1 special character', style: GoogleFonts.inter(color: Colors.black87, fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Error Message if any
                if (_errorMessage != null) ...[
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(LucideIcons.info, size: 16, color: Colors.redAccent),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: GoogleFonts.inter(fontSize: 13, color: Colors.redAccent, fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                ],

                // 1. Old Password Field
                if (!widget.isForced) ...[
                  Text(
                    'Old Password *',
                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                  ),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: _oldPasswordController,
                    obscureText: _obscureOld,
                    style: GoogleFonts.inter(fontSize: 13, color: Colors.black87),
                    decoration: _inputDecoration(
                      hint: '••••••••',
                      isObscure: _obscureOld,
                      onToggleObscure: () => setState(() => _obscureOld = !_obscureOld),
                    ),
                    validator: (val) {
                      if (val == null || val.trim().isEmpty) return 'Current password is required';
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                ],

                // 2. New Password Field
                Text(
                  'New Password *',
                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                ),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _newPasswordController,
                  obscureText: _obscureNew,
                  style: GoogleFonts.inter(fontSize: 13, color: Colors.black87),
                  onChanged: (_) => setState(() {}),
                  decoration: _inputDecoration(
                    hint: '••••••••',
                    isObscure: _obscureNew,
                    onToggleObscure: () => setState(() => _obscureNew = !_obscureNew),
                  ),
                  validator: (val) {
                    if (val == null || val.isEmpty) return 'New password is required';
                    if (!_isPasswordValid(val)) return 'Password does not meet rules below';
                    return null;
                  },
                ),
                const SizedBox(height: 12),

                // 3. Confirm New Password Field
                Text(
                  'Confirm New Password *',
                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                ),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _confirmPasswordController,
                  obscureText: _obscureConfirm,
                  style: GoogleFonts.inter(fontSize: 13, color: Colors.black87),
                  decoration: _inputDecoration(
                    hint: '••••••••',
                    isObscure: _obscureConfirm,
                    onToggleObscure: () => setState(() => _obscureConfirm = !_obscureConfirm),
                  ),
                  validator: (val) {
                    if (val == null || val.isEmpty) return 'Please confirm your new password';
                    if (val != _newPasswordController.text) return 'Passwords do not match';
                    return null;
                  },
                ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: _isLoading ? null : () => Navigator.pop(context),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                  child: Text(
                    'Cancel',
                    style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: Colors.grey.shade700, letterSpacing: 0),
                  ),
                ),
                const SizedBox(width: 8),
                TextButton(
                  onPressed: _isLoading ? null : _handleSubmit,
                  style: TextButton.styleFrom(
                    backgroundColor: AppTheme.deepTeal,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Text(
                          'Save',
                          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white, letterSpacing: 0),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }



  InputDecoration _inputDecoration({
    required String hint,
    required bool isObscure,
    required VoidCallback onToggleObscure,
  }) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.inter(fontSize: 13, color: Colors.grey.shade400),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppTheme.corporateBlue, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.redAccent),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
      ),
      suffixIcon: IconButton(
        icon: Icon(
          isObscure ? LucideIcons.eyeOff : LucideIcons.eye,
          size: 18,
          color: Colors.grey.shade600,
        ),
        onPressed: onToggleObscure,
      ),
    );
  }
}
