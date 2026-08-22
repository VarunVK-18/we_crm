import os
import re
import glob

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all path variables
    # Format: String? _xyzPath; or String? _xyzPath = null;
    path_vars = re.findall(r'String\?\s+(_\w+Path)\b', content)
    
    if not path_vars:
        return

    # Special handling for DirectorDetailsFormScreen as it has a List of DirectorFormData
    if 'director_details_form_screen.dart' in filepath:
        # We skip it for now and fix it manually since it's a list
        return
        
    changes = 0
    # Add to _loadDraft
    # Locate _loadDraft() { ... setState(() { ... }); ... }
    
    # Add to _saveDraft
    
    for var in path_vars:
        key = var.replace('_', '')
        
        # Add to loadDraft
        load_line = f"        if (draft.containsKey('{key}')) {var} = draft['{key}'];"
        if load_line not in content:
            # Insert into setState
            pattern = re.compile(r'(setState\(\(\)\s*\{)(.*?)(\}\);)', re.DOTALL)
            match = pattern.search(content)
            if match:
                # add load_line inside setState
                if f"draft.containsKey('{key}')" not in content:
                    content = content[:match.start(2)] + match.group(2) + f"\n{load_line}" + content[match.end(2):]
                    changes += 1

        # Add to saveDraft
        save_line = f"      '{key}': {var},"
        if save_line not in content:
            # Locate `final data = <String, dynamic>{` ... `};`
            pattern = re.compile(r'(final data = <String, dynamic>\{)(.*?)(\};)', re.DOTALL)
            match = pattern.search(content)
            if match:
                if f"'{key}':" not in content:
                    content = content[:match.start(2)] + match.group(2) + f"\n{save_line}" + content[match.end(2):]
                    changes += 1
                    
    if changes > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {os.path.basename(filepath)} with {len(path_vars)} path variables.")


files = glob.glob('lib/features/orders/forms/*.dart')
for f in files:
    process_file(f)

