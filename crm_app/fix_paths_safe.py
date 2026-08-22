import re

def safe_inject(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    path_vars = re.findall(r'String\?\s+(_\w+Path)\b', content)
    if not path_vars:
        return
        
    changes = 0
    for var in path_vars:
        key = var.replace('_', '')
        
        # 1. Inject into _loadDraft
        load_line = f"        if (draft.containsKey('{key}')) {var} = draft['{key}'];"
        if load_line not in content:
            # Find the setState inside _loadDraft
            pattern_load = re.compile(r'(Future<void> _loadDraft\(\) async \{.*?setState\(\(\) \{)(.*?)(\}\);)', re.DOTALL)
            match = pattern_load.search(content)
            if match:
                if f"draft.containsKey('{key}')" not in content:
                    content = content[:match.start(2)] + match.group(2) + f"\n{load_line}" + content[match.end(2):]
                    changes += 1

        # 2. Inject into _saveDraft
        save_line = f"      '{key}': {var},"
        if save_line not in content:
            # Locate `final data = <String, dynamic>{` ... `};` inside _saveDraft
            pattern_save = re.compile(r'(Future<void> _saveDraft\(\) async \{.*?final data = <String, dynamic>\{)(.*?)(\};)', re.DOTALL)
            match = pattern_save.search(content)
            if match:
                if f"'{key}':" not in content:
                    content = content[:match.start(2)] + match.group(2) + f"\n{save_line}" + content[match.end(2):]
                    changes += 1
                    
    if changes > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Safe injected paths into {filepath}")

files = [
    'lib/features/orders/forms/dpiit_form_screen.dart',
    'lib/features/orders/forms/fssai_form_screen.dart',
    'lib/features/orders/forms/gst_form_screen.dart',
    'lib/features/orders/forms/iec_form_screen.dart',
    'lib/features/orders/forms/lei_form_screen.dart',
]

for f in files:
    safe_inject(f)
