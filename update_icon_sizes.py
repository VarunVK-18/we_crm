import os

directories = [
    'c:\\projects\\we_crm\\webpage\\src\\app\\client\\client-dashboard.html',
    'c:\\projects\\we_crm\\webpage\\src\\app\\client\\client-services\\client-services.html',
    'c:\\projects\\we_crm\\webpage\\src\\app\\client\\client-help-support\\client-help-support.html'
]

for filename in directories:
    if not os.path.exists(filename): continue
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace('<hugeicons-icon [icon]="Call02Icon" [size]="16"', '<hugeicons-icon [icon]="Call02Icon" [size]="20"')
    content = content.replace('<hugeicons-icon [icon]="MailOpenIcon" [size]="16"', '<hugeicons-icon [icon]="MailOpenIcon" [size]="20"')
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
print('Increased icon sizes!')
