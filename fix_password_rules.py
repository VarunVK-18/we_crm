import sys
import re

file_path = "crm_app/lib/features/profile/widgets/change_password_dialog.dart"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

widget_code = """
                const SizedBox(height: 12),
                _buildPasswordRules(),
                const SizedBox(height: 16),
"""

# Replace the specific SizedBox
target_str = """                ),
                const SizedBox(height: 16),

                // 3. Confirm New Password Field"""

replacement_str = """                ),""" + widget_code + """
                // 3. Confirm New Password Field"""

content = content.replace(target_str, replacement_str)

method_code = """
  Widget _buildPasswordRules() {
    final val = _newPasswordController.text;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Password must contain:', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF64748B))),
        const SizedBox(height: 6),
        _buildRuleItem('8-16 characters', _hasMinMaxLen(val)),
        _buildRuleItem('1 uppercase letter', _hasUppercase(val)),
        _buildRuleItem('1 number', _hasNumber(val)),
        _buildRuleItem('No emojis or special unsupported characters', _hasNoEmoji(val) || val.isEmpty),
      ],
    );
  }

  Widget _buildRuleItem(String text, bool isValid) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Icon(
            isValid ? Icons.check_circle : Icons.radio_button_unchecked,
            size: 14,
            color: isValid ? const Color(0xFF10B981) : const Color(0xFF94A3B8),
          ),
          const SizedBox(width: 6),
          Text(
            text,
            style: GoogleFonts.inter(
              fontSize: 11,
              color: isValid ? const Color(0xFF10B981) : const Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }
"""

# Insert the methods before the `Widget build(BuildContext context) {` line
build_method_str = "  @override\n  Widget build(BuildContext context) {"
if build_method_str in content:
    content = content.replace(build_method_str, method_code + "\n" + build_method_str)
else:
    # try just Widget build
    build_method_str_2 = "  Widget build(BuildContext context) {"
    content = content.replace(build_method_str_2, method_code + "\n" + build_method_str_2)


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated change_password_dialog.dart")
