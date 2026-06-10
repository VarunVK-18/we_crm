import os
import glob
import re

directory = 'c:\\projects\\we_crm\\webpage\\src\\app\\client\\forms\\'
for folder in os.listdir(directory):
    if not os.path.isdir(os.path.join(directory, folder)): continue
    for filename in glob.glob(os.path.join(directory, folder, '*.html')):
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Add ngNativeValidate to form
        content = re.sub(r'<form \(ngSubmit\)="submitForm\(\)" ', r'<form (ngSubmit)="submitForm()" ngNativeValidate ', content)
        
        # Remove || !formName.valid from submit buttons
        content = re.sub(r'\[disabled\]="isSubmitting\(\) \|\| ![a-zA-Z]+Form\.valid"', r'[disabled]="isSubmitting()"', content)
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
print('Updated forms!')
