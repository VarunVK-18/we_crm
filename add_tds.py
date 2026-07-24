import sys

with open(r'c:\projects\we_crm\webpage\src\app\dashboard\service-details\service-details.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. ServiceType
content = content.replace(
    "type ServiceType = 'MCA' | 'DPIIT' | 'GST' | 'Trademark' | 'BIS' | 'Copyright' | 'Patent' | 'ITR' | 'DSC' | 'FSSAI' | 'DUNS';",
    "type ServiceType = 'MCA' | 'DPIIT' | 'GST' | 'Trademark' | 'BIS' | 'Copyright' | 'Patent' | 'ITR' | 'DSC' | 'FSSAI' | 'DUNS' | 'TDS';"
)

# 2. ServiceForm interface
content = content.replace(
    "gstTrn?: string;",
    "gstTrn?: string;\n  tan?: string;"
)

# 3. serviceList definition
content = content.replace(
    "    { type: 'DUNS', name: 'DUNS Registration', icon: 'account_balance' }",
    "    { type: 'DUNS', name: 'DUNS Registration', icon: 'account_balance' },\n    { type: 'TDS', name: 'TDS Return / Registration', icon: 'request_quote' }"
)

# 4. forms initialization
content = content.replace(
    "DUNS: { trackingNumber: '' }",
    "DUNS: { trackingNumber: '' },\n      TDS: { tan: '', username: '', password: '', expiryDate: '' }"
)

# 5. ITR filtering change
content = content.replace(
    "else if (s.includes('itr') || s.includes('income tax') || s.includes('tds') || s.includes('pf')) matchType = 'ITR';",
    "else if (s.includes('tds')) matchType = 'TDS';\n    else if (s.includes('itr') || s.includes('income tax') || s.includes('pf')) matchType = 'ITR';"
)

with open(r'c:\projects\we_crm\webpage\src\app\dashboard\service-details\service-details.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("TDS added to service-details.ts")
