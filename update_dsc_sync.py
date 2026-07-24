import sys

with open(r'c:\projects\we_crm\crm_backend\controllers\serviceDetailsController.js', 'r', encoding='utf-8') as f:
    content = f.read()

dsc_sync_logic = """
      if (serviceType === 'DSC') {
        if (tokenPin !== undefined) { entity.dscTokenPin = tokenPin; updated = true; }
        if (password !== undefined) { entity.dscPassword = password; updated = true; }
      }
      else if (serviceType === 'MCA') {"""

if "serviceType === 'DSC'" not in content:
    content = content.replace("if (serviceType === 'MCA') {", dsc_sync_logic)

with open(r'c:\projects\we_crm\crm_backend\controllers\serviceDetailsController.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Controller sync updated for DSC")
