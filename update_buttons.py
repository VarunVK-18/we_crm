import os

lib_dir = r'c:\projects\we_crm\crm_app\lib\features\orders'
files = [f for f in os.listdir(lib_dir) if f.endswith('_form_screen.dart')]

target = """              OutlinedButton(
                onPressed: onPick,
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: path == null ? Colors.grey[400]! : AppTheme.corporateBlue),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: Text(path == null ? 'Upload' : 'Change', style: TextStyle(color: path == null ? Colors.black87 : AppTheme.corporateBlue)),
              ),"""

replacement = """              ElevatedButton(
                onPressed: onPick,
                style: ElevatedButton.styleFrom(
                  backgroundColor: path == null ? Colors.black : Colors.white,
                  foregroundColor: path == null ? Colors.white : AppTheme.corporateBlue,
                  side: BorderSide(color: path == null ? Colors.black : AppTheme.corporateBlue),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  elevation: 0,
                ),
                child: Text(
                  path == null ? 'Upload' : 'Change',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
                ),
              ),"""

count = 0
for f in files:
    filepath = os.path.join(lib_dir, f)
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if target in content:
        new_content = content.replace(target, replacement)
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as file:
                file.write(new_content)
            count += 1
            print(f'Updated {f}')

print(f'Total files updated: {count}')
