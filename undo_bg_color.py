import sys

# 1. login_screen.dart
path_login = r'c:\projects\we_crm\crm_app\lib\features\auth\login_screen.dart'
with open(path_login, 'r', encoding='utf-8') as f:
    content_login = f.read()

content_login = content_login.replace(
    "      child: Scaffold(\n        backgroundColor: Colors.white,",
    "      child: Scaffold(\n        backgroundColor: const Color(0xFFFDFBF7),"
)

with open(path_login, 'w', encoding='utf-8') as f:
    f.write(content_login)


# 2. client_onboarding_screen.dart
path_onboard = r'c:\projects\we_crm\crm_app\lib\features\auth\client_onboarding_screen.dart'
with open(path_onboard, 'r', encoding='utf-8') as f:
    content_onboard = f.read()

content_onboard = content_onboard.replace(
    "    return Scaffold(\n      backgroundColor: Colors.white,",
    "    return Scaffold(\n      backgroundColor: const Color(0xFFFDFBF7),"
)

with open(path_onboard, 'w', encoding='utf-8') as f:
    f.write(content_onboard)

print("Background color reverted successfully")
