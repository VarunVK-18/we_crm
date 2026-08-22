import sys

# 1. Update change_password_dialog.dart
file_path_pwd = "crm_app/lib/features/profile/widgets/change_password_dialog.dart"
with open(file_path_pwd, "r", encoding="utf-8") as f:
    content_pwd = f.read()

# We need to remove:
#                 const SizedBox(height: 12),
#                 _buildPasswordRules(),
#                 const SizedBox(height: 16),
# Note: since the user wants it removed, we can just replace it with `const SizedBox(height: 16),`
target_pwd = """                const SizedBox(height: 12),
                _buildPasswordRules(),
                const SizedBox(height: 16),"""
if target_pwd in content_pwd:
    content_pwd = content_pwd.replace(target_pwd, "                const SizedBox(height: 16),")
    with open(file_path_pwd, "w", encoding="utf-8") as f:
        f.write(content_pwd)
    print("Updated change_password_dialog.dart")
else:
    print("Could not find _buildPasswordRules in change_password_dialog.dart")

# 2. Add AppBar to order_tracker.dart
file_path_orders = "crm_app/lib/features/orders/order_tracker.dart"
with open(file_path_orders, "r", encoding="utf-8") as f:
    content_orders = f.read()

target_orders = """    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F9),
      body: SafeArea("""

replacement_orders = """    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F9),
      appBar: AppBar(
        title: Text(
          'My Services',
          style: GoogleFonts.inter(
            color: const Color(0xFF1E293B),
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: Color(0xFF1E293B)),
      ),
      body: SafeArea("""

if target_orders in content_orders:
    # Also need to make sure we import GoogleFonts if not already, but it's likely already imported.
    content_orders = content_orders.replace(target_orders, replacement_orders)
    with open(file_path_orders, "w", encoding="utf-8") as f:
        f.write(content_orders)
    print("Updated order_tracker.dart")
else:
    print("Could not find Scaffold in order_tracker.dart")
