import re
content = open(r'c:\projects\we_crm\webpage\src\app\dashboard\service-details\service-details.html', encoding='utf-8').read()

bad_block = '''} @else if (svc.type === 'DUNS') {
              <div class="sd-form-grid" style="grid-template-columns: 1fr;">
                <div class="sd-field">
                  <label class="sd-label">Application ID</label>
                  <input class="sd-input" type="text" [(ngModel)]="forms['DUNS'].trackingNumber" placeholder="Enter Application ID" autocomplete="new-password" />
                </div>
              </div>
            } @else {'''

content = content.replace(bad_block, '} @else {')
open(r'c:\projects\we_crm\webpage\src\app\dashboard\service-details\service-details.html', 'w', encoding='utf-8').write(content)
print("Removed bad blocks")
