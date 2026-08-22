import os

def replace_in_file(path, old_str, new_str):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if old_str in content:
        content = content.replace(old_str, new_str)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Replaced in {path}")
    else:
        print(f"Not found in {path}")

# Landing Screen
replace_in_file('lib/features/auth/landing_screen.dart', 'assets/images/logo_transparent.png', 'assets/logo.png')

# Login Screen
replace_in_file('lib/features/auth/login_screen.dart', 'assets/images/logo_transparent.png', 'assets/logo.png')

# Client Onboarding Screen (Signup)
replace_in_file('lib/features/auth/client_onboarding_screen.dart', 'assets/images/logo_without background.jpg', 'assets/logo.png')

print("Done")
