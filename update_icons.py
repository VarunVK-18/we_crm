import os
import glob

directories = [
    'c:\\projects\\we_crm\\webpage\\src\\app\\client\\client-dashboard.html',
    'c:\\projects\\we_crm\\webpage\\src\\app\\client\\client-services\\client-services.html',
    'c:\\projects\\we_crm\\webpage\\src\\app\\client\\client-help-support\\client-help-support.html'
]

for filename in directories:
    if not os.path.exists(filename): continue
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace('<span class="eab-label">CALL</span>', '<span class="eab-label"><hugeicons-icon [icon]="Call02Icon" [size]="16" color="rgba(255,255,255,0.7)" [strokeWidth]="2"></hugeicons-icon></span>')
    content = content.replace('<span class="eab-label">MAIL</span>', '<span class="eab-label"><hugeicons-icon [icon]="MailOpenIcon" [size]="16" color="rgba(255,255,255,0.7)" [strokeWidth]="2"></hugeicons-icon></span>')
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
print('Updated HTML files!')
