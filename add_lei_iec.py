import sys

with open(r'c:\projects\we_crm\crm_backend\models\ServiceDetails.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add LEI, IEC to enum
content = content.replace(
    "'ITR', 'DSC', 'FSSAI', 'DUNS', 'TDS', 'PF'",
    "'ITR', 'DSC', 'FSSAI', 'DUNS', 'TDS', 'PF', 'LEI', 'IEC'"
)

# 2. Add LEI and IEC fields
content = content.replace(
    "// ── PF-specific ──",
    "// ── LEI / IEC-specific ──\n  leiNumber: { type: String, default: '' },\n  iecNumber: { type: String, default: '' },\n  issueDate: { type: Date, default: null },\n  status: { type: String, default: 'active' },\n\n  // ── PF-specific ──"
)

# 3. Update comment for company level
content = content.replace(
    "// ── Company-level credentials (MCA, DPIIT, GST, ITR, DSC, FSSAI, TDS, PF) ──",
    "// ── Company-level credentials (MCA, DPIIT, GST, ITR, DSC, FSSAI, TDS, PF, LEI, IEC) ──"
)

with open(r'c:\projects\we_crm\crm_backend\models\ServiceDetails.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Backend model updated for LEI and IEC")
