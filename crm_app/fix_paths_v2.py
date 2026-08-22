import os
import re

files = [
    'lib/features/orders/forms/dpiit_form_screen.dart',
    'lib/features/orders/forms/fssai_form_screen.dart',
    'lib/features/orders/forms/gst_form_screen.dart',
    'lib/features/orders/forms/iec_form_screen.dart',
    'lib/features/orders/forms/lei_form_screen.dart',
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Find all the injected lines which start with "        if (draft.containsKey("
    lines = content.split('\n')
    bad_lines = []
    clean_lines = []
    
    for line in lines:
        if 'if (draft.containsKey(' in line and 'Path' in line and '=' in line and "draft['" in line:
            # We assume these are our broken injected lines, collect them
            bad_lines.append(line.strip())
        else:
            clean_lines.append(line)
            
    content = '\n'.join(clean_lines)
    
    # Now we need to insert the bad_lines into the correct _loadDraft
    if bad_lines:
        load_draft_regex = re.compile(r'(Future<void> _loadDraft\(\) async \{.*?setState\(\(\) \{)(.*?)(\}\);)', re.DOTALL)
        match = load_draft_regex.search(content)
        if match:
            injected_code = '\n        '.join(bad_lines)
            content = content[:match.start(2)] + match.group(2) + f"\n        {injected_code}\n      " + content[match.end(2):]
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {filepath}")
        
