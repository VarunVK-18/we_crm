import re

with open('lib/features/services/registration_services_screen.dart', 'r') as f:
    content = f.read()

match = re.search(r'final List<Map<String, dynamic>> _allPackages = (\[.*?\]);', content, re.DOTALL)
if match:
    packages = match.group(1)
    out = f"""import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

final List<Map<String, dynamic>> kAvailableServices = {packages};
"""
    with open('lib/core/constants/available_services.dart', 'w') as f_out:
        f_out.write(out)
    print("Rewritten successfully")
else:
    print("Match not found")
