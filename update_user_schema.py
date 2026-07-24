import sys

with open(r'c:\projects\we_crm\crm_backend\models\User.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add lei and iec to client_entities
if 'lei: String' not in content:
    content = content.replace(
        "msme: String,",
        "msme: String,\n        lei: String,\n        iec: String,"
    )

with open(r'c:\projects\we_crm\crm_backend\models\User.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("User schema updated")
