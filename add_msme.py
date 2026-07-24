import sys

# 1. Update Backend
with open(r'c:\projects\we_crm\crm_backend\models\ServiceDetails.js', 'r', encoding='utf-8') as f:
    backend_content = f.read()

backend_content = backend_content.replace(
    "'LEI', 'IEC'",
    "'LEI', 'IEC', 'MSME'"
)
backend_content = backend_content.replace(
    "iecNumber: { type: String, default: '' },",
    "iecNumber: { type: String, default: '' },\n  udyamNumber: { type: String, default: '' },"
)
backend_content = backend_content.replace(
    "(MCA, DPIIT, GST, ITR, DSC, FSSAI, TDS, PF, LEI, IEC)",
    "(MCA, DPIIT, GST, ITR, DSC, FSSAI, TDS, PF, LEI, IEC, MSME)"
)

with open(r'c:\projects\we_crm\crm_backend\models\ServiceDetails.js', 'w', encoding='utf-8') as f:
    f.write(backend_content)


# 2. Update TS
with open(r'c:\projects\we_crm\webpage\src\app\dashboard\service-details\service-details.ts', 'r', encoding='utf-8') as f:
    ts_content = f.read()

ts_content = ts_content.replace(
    "| 'LEI' | 'IEC';",
    "| 'LEI' | 'IEC' | 'MSME';"
)
ts_content = ts_content.replace(
    "iecNumber: string;",
    "iecNumber: string;\n  udyamNumber: string;"
)
ts_content = ts_content.replace(
    "{ type: 'IEC', name: 'Import Export Code (IEC)', icon: 'flight_takeoff' }",
    "{ type: 'IEC', name: 'Import Export Code (IEC)', icon: 'flight_takeoff' },\n    { type: 'MSME', name: 'MSME / Udyam Registration', icon: 'storefront' }"
)
ts_content = ts_content.replace(
    "IEC: { iecNumber: '', issueDate: '', status: 'active' }",
    "IEC: { iecNumber: '', issueDate: '', status: 'active' },\n      MSME: { udyamNumber: '' }"
)
ts_content = ts_content.replace(
    "iecNumber: '', issueDate: ''",
    "iecNumber: '', udyamNumber: '', issueDate: ''"
)
ts_content = ts_content.replace(
    "else if (s.includes('startup') || s.includes('dpiit') || s.includes('msme')) matchType = 'DPIIT';",
    "else if (s.includes('startup') || s.includes('dpiit')) matchType = 'DPIIT';\n    else if (s.includes('msme') || s.includes('udyam')) matchType = 'MSME';"
)

with open(r'c:\projects\we_crm\webpage\src\app\dashboard\service-details\service-details.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print("Backend and TS updated for MSME")
