import sys

with open(r'c:\projects\we_crm\crm_backend\controllers\serviceDetailsController.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add fields to destructuring
content = content.replace(
    "trackingNumber,\n        directorCredentials\n      } = req.body;",
    "trackingNumber,\n        directorCredentials,\n        tan,\n        pfCode,\n        leiNumber,\n        iecNumber,\n        issueDate,\n        status,\n        udyamNumber\n      } = req.body;"
)

# 2. Add fields to the update object
content = content.replace(
    "...(directorCredentials !== undefined && { directorCredentials })",
    "...(directorCredentials !== undefined && { directorCredentials }),\n          ...(tan !== undefined && { tan }),\n          ...(pfCode !== undefined && { pfCode }),\n          ...(leiNumber !== undefined && { leiNumber }),\n          ...(iecNumber !== undefined && { iecNumber }),\n          ...(issueDate !== undefined && { issueDate: issueDate || null }),\n          ...(status !== undefined && { status }),\n          ...(udyamNumber !== undefined && { udyamNumber })"
)

with open(r'c:\projects\we_crm\crm_backend\controllers\serviceDetailsController.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Controller fixed!")
