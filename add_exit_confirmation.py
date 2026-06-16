import os
import re

DIR = r"c:\projects\we_crm\crm_app\lib\features\orders"

will_pop_method = """
  Future<bool> _onWillPop() async {
    final shouldPop = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Are You Sure To Exit ?', style: TextStyle(fontWeight: FontWeight.bold)),
          content: const Text('Any unsaved progress will be lost.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('No'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              child: const Text('Yes', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );
    return shouldPop ?? false;
  }

"""

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if '_onWillPop' in content:
        print(f"Skipped {os.path.basename(filepath)}")
        return

    # Find the build method
    build_match = re.search(r'Widget\s+build\s*\(\s*BuildContext\s+context\s*\)\s*\{', content)
    if not build_match:
        return

    # Insert _onWillPop just before build
    build_idx = build_match.start()
    content = content[:build_idx] + will_pop_method + content[build_idx:]

    # Find return Scaffold(
    # Because we added will_pop_method, the index of build changed.
    # We find it again
    build_match = re.search(r'Widget\s+build\s*\(\s*BuildContext\s+context\s*\)\s*\{', content)
    
    # We search for return Scaffold( AFTER the build method
    scaffold_match = re.search(r'return\s+Scaffold\s*\(', content[build_match.start():])
    if not scaffold_match:
        print(f"Could not find return Scaffold in {os.path.basename(filepath)}")
        return
        
    start_scaffold = build_match.start() + scaffold_match.start()
    
    # Find the matching closing parenthesis for Scaffold
    # The string starts at return Scaffold( -> we want the index of (
    open_paren_idx = content.find('(', start_scaffold)
    
    count = 0
    end_scaffold = -1
    for i in range(open_paren_idx, len(content)):
        if content[i] == '(':
            count += 1
        elif content[i] == ')':
            count -= 1
            if count == 0:
                end_scaffold = i
                break
                
    if end_scaffold == -1:
        print(f"Mismatched parentheses in {os.path.basename(filepath)}")
        return
        
    # Replace return Scaffold( with return WillPopScope(onWillPop: _onWillPop, child: Scaffold(
    # And add ) at end_scaffold
    
    new_content = (
        content[:start_scaffold] + 
        "return WillPopScope(\n      onWillPop: _onWillPop,\n      child: Scaffold(" + 
        content[open_paren_idx+1:end_scaffold] + 
        ")" + 
        content[end_scaffold:]
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Updated {os.path.basename(filepath)}")

for filename in os.listdir(DIR):
    if filename.endswith('_form_screen.dart'):
        process_file(os.path.join(DIR, filename))
