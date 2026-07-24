import sys

with open(r'c:\projects\we_crm\webpage\src\app\dashboard\service-details\service-details.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. ServiceType
content = content.replace(
    "| 'DUNS' | 'TDS';",
    "| 'DUNS' | 'TDS' | 'PF';"
)

# 2. ServiceForm interface
content = content.replace(
    "tan: string;",
    "tan: string;\n  pfCode: string;"
)

# 3. serviceList definition
content = content.replace(
    "{ type: 'TDS', name: 'TDS Return / Registration', icon: 'request_quote' }",
    "{ type: 'TDS', name: 'TDS Return / Registration', icon: 'request_quote' },\n    { type: 'PF', name: 'PF (EPFO) Registration', icon: 'badge' }"
)

# 4. forms initialization
content = content.replace(
    "TDS: { tan: '', username: '', password: '', expiryDate: '' }",
    "TDS: { tan: '', username: '', password: '', expiryDate: '' },\n      PF: { pfCode: '', username: '', password: '', expiryDate: '' }"
)

# 5. blankForm
content = content.replace(
    "tan: '', expiryDate: ''",
    "tan: '', pfCode: '', expiryDate: ''"
)

# 6. Filtering change
content = content.replace(
    "else if (s.includes('itr') || s.includes('income tax') || s.includes('pf')) matchType = 'ITR';",
    "else if (s.includes('pf') || s.includes('epfo')) matchType = 'PF';\n    else if (s.includes('itr') || s.includes('income tax')) matchType = 'ITR';"
)

with open(r'c:\projects\we_crm\webpage\src\app\dashboard\service-details\service-details.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("PF added to service-details.ts")
