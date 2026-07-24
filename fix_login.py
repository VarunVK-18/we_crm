import sys

with open(r'c:\projects\we_crm\crm_app\lib\features\auth\login_screen.dart', 'r', encoding='utf-8') as f:
    content = f.read()

if "import 'auth_wrapper.dart';" not in content:
    content = content.replace(
        "import '../../providers/auth_provider.dart';",
        "import '../../providers/auth_provider.dart';\nimport 'auth_wrapper.dart';"
    )

content = content.replace(
    "ref.read(navigationIndexProvider.notifier).state = 0;\n      TextInput.finishAutofillContext();",
    "ref.read(navigationIndexProvider.notifier).state = 0;\n      TextInput.finishAutofillContext();\n      if (mounted) {\n        Navigator.of(context).pushAndRemoveUntil(\n          MaterialPageRoute(builder: (_) => const AuthWrapper()),\n          (route) => false,\n        );\n      }"
)

with open(r'c:\projects\we_crm\crm_app\lib\features\auth\login_screen.dart', 'w', encoding='utf-8') as f:
    f.write(content)

print("Login screen fixed")
