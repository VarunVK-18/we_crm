import sys

with open(r'c:\projects\we_crm\webpage\src\app\dashboard\client-dashboard\client-dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Add DSC Token PIN and DSC Password
dsc_fields = """                      <div class="form-group"><label>DSC</label><input type="text" [(ngModel)]="currentEntity.dsc" placeholder="Enter DSC"></div>
                      <div class="form-group">
                        <label>DSC Token PIN</label>
                        <div class="pwd-wrapper">
                          <input [type]="showPassword['dsc_pin'] ? 'text' : 'password'" [(ngModel)]="currentEntity.dscTokenPin" placeholder="Token PIN">
                          <span class="material-symbols-outlined pwd-toggle" (click)="togglePassword('dsc_pin')">{{ showPassword['dsc_pin'] ? 'visibility_off' : 'visibility' }}</span>
                        </div>
                      </div>
                      <div class="form-group">
                        <label>DSC Password</label>
                        <div class="pwd-wrapper">
                          <input [type]="showPassword['dsc_pass'] ? 'text' : 'password'" [(ngModel)]="currentEntity.dscPassword" placeholder="DSC Password">
                          <span class="material-symbols-outlined pwd-toggle" (click)="togglePassword('dsc_pass')">{{ showPassword['dsc_pass'] ? 'visibility_off' : 'visibility' }}</span>
                        </div>
                      </div>"""

target_dsc = '<div class="form-group"><label>DSC</label><input type="text" [(ngModel)]="currentEntity.dsc" placeholder="Enter DSC"></div>'

if 'DSC Token PIN' not in content:
    content = content.replace(target_dsc, dsc_fields)

# Add read-only labels
dsc_labels = """                          @if (ent.dsc) { <div><small style="color: #64748b; display: block;">DSC</small><strong>{{ ent.dsc }}</strong></div> }
                          @if (ent.dscTokenPin) { <div><small style="color: #64748b; display: block;">DSC Token PIN</small><strong>{{ ent.dscTokenPin }}</strong></div> }
                          @if (ent.dscPassword) { <div><small style="color: #64748b; display: block;">DSC Password</small><strong>{{ ent.dscPassword }}</strong></div> }"""

target_dsc_label = '@if (ent.dsc) { <div><small style="color: #64748b; display: block;">DSC</small><strong>{{ ent.dsc }}</strong></div> }'

if 'ent.dscTokenPin' not in content:
    content = content.replace(target_dsc_label, dsc_labels)

with open(r'c:\projects\we_crm\webpage\src\app\dashboard\client-dashboard\client-dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Client dashboard updated with DSC fields")
