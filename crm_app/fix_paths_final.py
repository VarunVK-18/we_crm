import os

# fix dpiit
path = 'lib/features/orders/forms/dpiit_form_screen.dart'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()
text = text.replace('draft.containsKey', 'draftData.containsKey').replace("draft['", "draftData['")
with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

# fix fssai
path = 'lib/features/orders/forms/fssai_form_screen.dart'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()
text = text.replace('draft.containsKey', 'draftData.containsKey').replace("draft['", "draftData['")
with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

# fix lei
path = 'lib/features/orders/forms/lei_form_screen.dart'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()
text = text.replace('draft.containsKey', 'draftData.containsKey').replace("draft['", "draftData['")
with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

# iec_form_screen.dart was botched again because the regex matched a random setState.
# let's restore it and then fix it properly.
os.system('git restore lib/features/orders/forms/iec_form_screen.dart')

path = 'lib/features/orders/forms/iec_form_screen.dart'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()
    
# inject into loadDraft
load_code = """
        if (draftData.containsKey('applicantPanPath')) _applicantPanPath = draftData['applicantPanPath'];
        if (draftData.containsKey('applicantAddressProofPath')) _applicantAddressProofPath = draftData['applicantAddressProofPath'];
        if (draftData.containsKey('directorPanPath')) _directorPanPath = draftData['directorPanPath'];
        if (draftData.containsKey('directorAddressProofPath')) _directorAddressProofPath = draftData['directorAddressProofPath'];
        if (draftData.containsKey('bankAccountFirstPagePath')) _bankAccountFirstPagePath = draftData['bankAccountFirstPagePath'];
"""
text = text.replace("        _bankNameController.text = draftData['bankName'] ?? '';", "        _bankNameController.text = draftData['bankName'] ?? '';" + load_code)

save_code = """
      'applicantPanPath': _applicantPanPath,
      'applicantAddressProofPath': _applicantAddressProofPath,
      'directorPanPath': _directorPanPath,
      'directorAddressProofPath': _directorAddressProofPath,
      'bankAccountFirstPagePath': _bankAccountFirstPagePath,
"""
text = text.replace("      'bankName': _bankNameController.text,", "      'bankName': _bankNameController.text," + save_code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
    
print("All fixed")
