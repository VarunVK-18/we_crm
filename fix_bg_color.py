import sys

def change_bg(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("backgroundColor: const Color(0xFFFDFBF7),", "backgroundColor: Colors.white,")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

change_bg(r'c:\projects\we_crm\crm_app\lib\features\auth\login_screen.dart')
change_bg(r'c:\projects\we_crm\crm_app\lib\features\auth\client_onboarding_screen.dart')

print("Background color changed")
