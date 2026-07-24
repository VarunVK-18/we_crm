import sys

with open(r'c:\projects\we_crm\crm_backend\models\ServiceDetails.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add PF to enum
content = content.replace(
    "'ITR', 'DSC', 'FSSAI', 'DUNS', 'TDS'",
    "'ITR', 'DSC', 'FSSAI', 'DUNS', 'TDS', 'PF'"
)

# 2. Add pfCode
content = content.replace(
    "// ── TDS-specific ──",
    "// ── PF-specific ──\n  pfCode: encryptedString(),\n\n  // ── TDS-specific ──"
)

# 3. Update comment for company level
content = content.replace(
    "// ── Company-level credentials (MCA, DPIIT, GST, ITR, DSC, FSSAI, TDS) ──",
    "// ── Company-level credentials (MCA, DPIIT, GST, ITR, DSC, FSSAI, TDS, PF) ──"
)

with open(r'c:\projects\we_crm\crm_backend\models\ServiceDetails.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Backend model updated for PF")
