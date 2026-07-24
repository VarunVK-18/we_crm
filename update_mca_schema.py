import sys

with open(r'c:\projects\we_crm\crm_backend\models\User.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add MCA credentials to client_entities
if 'mcaUsername: String' not in content:
    content = content.replace(
        "coi: String,",
        "coi: String,\n        mcaUsername: String,\n        mcaPassword: String,"
    )

# Add Director credentials to directors array
if 'mcaUsername: String' not in content.split('directors:')[1]:
    content = content.replace(
        "din: String,",
        "din: String,\n        mcaUsername: String,\n        mcaPassword: String,\n        itrUsername: String,\n        itrPassword: String,"
    )

with open(r'c:\projects\we_crm\crm_backend\models\User.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("User schema updated for MCA and Directors")
