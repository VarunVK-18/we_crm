import sys

with open(r'c:\projects\we_crm\crm_app\lib\repositories\auth_repository.dart', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "if (response.statusCode != 200) {",
    "if (response.statusCode != 200 && response.statusCode != 201 && response.statusCode != 202) {"
)

with open(r'c:\projects\we_crm\crm_app\lib\repositories\auth_repository.dart', 'w', encoding='utf-8') as f:
    f.write(content)

print("Auth repository fixed")
