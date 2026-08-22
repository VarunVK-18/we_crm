with open('lib/features/orders/forms/iec_form_screen.dart', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("'bankName': _bankNameController.text,", """'bankName': _bankNameController.text,
      'applicantPanPath': _applicantPanPath,
      'applicantAddressProofPath': _applicantAddressProofPath,
      'directorPanPath': _directorPanPath,
      'directorAddressProofPath': _directorAddressProofPath,
      'bankAccountFirstPagePath': _bankAccountFirstPagePath,""")

with open('lib/features/orders/forms/iec_form_screen.dart', 'w', encoding='utf-8') as f:
    f.write(text)
