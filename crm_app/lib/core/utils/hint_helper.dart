class HintHelper {
  static String getExampleHint(String label, {String? hint}) {
    // If hint already has content (not starting with e.g. and not 'Enter ...'), use it directly
    if (hint != null && hint.isNotEmpty && !hint.toLowerCase().startsWith('e.g.')) {
      final hLower = hint.toLowerCase();
      if (!hLower.contains('format') &&
          !hLower.contains('dd/mm/yyyy') &&
          !hLower.contains('supported file') &&
          !hLower.contains('enter ')) {
        return hint;
      }
    }

    final l = label.toLowerCase();

    // 1. Person Name fields take highest priority — if label contains 'name'
    //    AND is NOT a company/entity/business name, it's a person's name.
    //    Also handles "Applicant Name (As per PAN)" correctly.
    if (l.contains('name') &&
        !l.contains('company name') &&
        !l.contains('entity name') &&
        !l.contains('business name') &&
        !l.contains('proposed name') &&
        !l.contains('trade name') &&
        !l.contains('brand name') &&
        !l.contains('bank name') &&
        !l.contains('enterprise name') &&
        !l.contains('organization name') &&
        !l.contains('firm name')) {
      return 'Ravi Kumar';
    }

    // 2. Specific data type fields
    if (l.contains('email') || l.contains('mail id') || l.contains('mail address')) {
      return 'name@example.com';
    }
    if (l.contains('phone') || l.contains('mobile') || l.contains('whatsapp') || l.contains('contact number')) {
      return '9876543210';
    }
    if (l.contains(' pan') || l.startsWith('pan') || l == 'pan') return 'ABCDE1234F';
    if (l.contains('aadhaar') || l.contains('aadhar')) return '1234 5678 9012';
    if (l.contains('gstin') || l.contains('gst number') || l.contains('gst no')) {
      return '22AAAAA0000A1Z5';
    }
    if (l.contains(' din') || l.startsWith('din') || l == 'din') return '01234567';
    if (l.contains('date of birth') || l == 'dob') return '15/08/1990';
    if (l.contains('date') || l.contains('doi') || l.contains('dob')) return 'DD/MM/YYYY';
    if (l.contains('address') || l.contains('registered office') || l.contains('location')) {
      return '12, MG Road, Bengaluru - 560001';
    }
    if (l.contains('city')) return 'Bengaluru';
    if (l.contains('state')) return 'Karnataka';
    if (l.contains(' pin') || l.startsWith('pin') || l.contains('zip') || l.contains('postal') || l == 'pin') return '560001';
    if (l.contains('ifsc') || l.contains('ifs code')) return 'HDFC0001234';
    if (l.contains('account number') || l.contains('account no')) return '12345678901234';
    if (l.contains('turnover')) return '5000000';
    if (l.contains('investment') || l.contains('capital')) return '1000000';
    if (l.contains('amount') || l.contains('value') || l.contains('share holding') || l.contains('shareholding') || l.contains('percentage')) {
      return '100';
    }
    if (l.contains('activity') || l.contains('occupation') || l.contains('nature') || l.contains('object')) {
      return 'Software Services';
    }
    if (l.contains('description')) return 'Brief description here';
    if (l.contains('udyam') || l.contains('msme')) return 'UDYAM-MH-00-0000000';
    if (l.contains(' cin') || l.startsWith('cin') || l == 'cin') return 'U12345MH2023PTC123456';
    if (l.contains('llpin')) return 'AAA-1234';
    if (l.contains(' tan') || l.startsWith('tan') || l == 'tan') return 'ABCD12345E';

    // 3. Company / Entity name fields
    if (l.contains('company name') ||
        l.contains('entity name') ||
        l.contains('business name') ||
        l.contains('proposed name') ||
        l.contains('trade name') ||
        l.contains('brand name') ||
        l.contains('enterprise name') ||
        l.contains('organization name') ||
        l.contains('firm name')) {
      return 'Acme Solutions Pvt Ltd';
    }
    if (l.contains('bank name')) return 'HDFC Bank';

    return label.replaceAll('*', '').trim();
  }
}
