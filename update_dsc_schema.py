import sys

with open(r'c:\projects\we_crm\crm_backend\models\User.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add DSC credentials to client_entities
if 'dscTokenPin: String' not in content:
    content = content.replace(
        "dsc: String,",
        "dsc: String,\n        dscTokenPin: String,\n        dscPassword: String,"
    )

with open(r'c:\projects\we_crm\crm_backend\models\User.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("User schema updated for DSC")
