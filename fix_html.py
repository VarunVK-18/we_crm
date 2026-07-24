import re

content = open(r'c:\projects\we_crm\webpage\src\app\dashboard\service-details\service-details.html', encoding='utf-8').read()

# Add autocomplete="new-password" to all inputs except the file input and date inputs (for safety, though new-password is good for text/password)
content = re.sub(r'(<input[^>]+type="text"[^>]+)>', r'\1 autocomplete="new-password">', content)
content = re.sub(r'(<input[^>]+type="password"[^>]+)>', r'\1 autocomplete="new-password">', content)
content = re.sub(r'(<input[^>]+\[type\]="showPass[^>]+)>', r'\1 autocomplete="new-password">', content)

# Fix placeholders for password inputs
content = content.replace('placeholder="        "', 'placeholder="Enter Password"')
content = content.replace('placeholder="Director Username"', 'placeholder="Enter Username"')

# Add DUNS section before the @else fallback
duns_html = '''} @else if (svc.type === 'DUNS') {
              <div class="sd-form-grid" style="grid-template-columns: 1fr;">
                <div class="sd-field">
                  <label class="sd-label">Application ID</label>
                  <input class="sd-input" type="text" [(ngModel)]="forms['DUNS'].trackingNumber" placeholder="Enter Application ID" autocomplete="new-password" />
                </div>
              </div>
            '''
content = content.replace("} @else {", duns_html + "} @else {")

open(r'c:\projects\we_crm\webpage\src\app\dashboard\service-details\service-details.html', 'w', encoding='utf-8').write(content)
print("HTML fixed successfully.")
