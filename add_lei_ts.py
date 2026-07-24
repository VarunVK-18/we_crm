import sys

with open(r'c:\projects\we_crm\webpage\src\app\dashboard\service-details\service-details.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. ServiceType
content = content.replace(
    "| 'PF';",
    "| 'PF' | 'LEI' | 'IEC';"
)

# 2. ServiceForm interface
content = content.replace(
    "pfCode: string;",
    "pfCode: string;\n  leiNumber: string;\n  iecNumber: string;\n  issueDate: string;\n  status: string;"
)

# 3. serviceList definition
content = content.replace(
    "{ type: 'PF', name: 'PF (EPFO) Registration', icon: 'badge' }",
    "{ type: 'PF', name: 'PF (EPFO) Registration', icon: 'badge' },\n    { type: 'LEI', name: 'LEI Registration', icon: 'gavel' },\n    { type: 'IEC', name: 'Import Export Code (IEC)', icon: 'flight_takeoff' }"
)

# 4. forms initialization
content = content.replace(
    "PF: { pfCode: '', username: '', password: '', expiryDate: '' }",
    "PF: { pfCode: '', username: '', password: '', expiryDate: '' },\n      LEI: { leiNumber: '', issueDate: '', expiryDate: '', status: 'active' },\n      IEC: { iecNumber: '', issueDate: '', status: 'active' }"
)

# 5. blankForm
content = content.replace(
    "pfCode: '', expiryDate: ''",
    "pfCode: '', leiNumber: '', iecNumber: '', issueDate: '', status: 'active', expiryDate: ''"
)

# 6. Filtering change
content = content.replace(
    "else if (s.includes('pf') || s.includes('epfo')) matchType = 'PF';",
    "else if (s.includes('lei') || s.includes('legal entity')) matchType = 'LEI';\n    else if (s.includes('iec') || s.includes('import export')) matchType = 'IEC';\n    else if (s.includes('pf') || s.includes('epfo')) matchType = 'PF';"
)

with open(r'c:\projects\we_crm\webpage\src\app\dashboard\service-details\service-details.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("LEI and IEC added to service-details.ts")
