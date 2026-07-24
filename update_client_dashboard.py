import sys

with open(r'c:\projects\we_crm\webpage\src\app\dashboard\client-dashboard\client-dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

mca_html = """
                      <h5 style="margin-top: 24px; margin-bottom: 16px; color: var(--accent-primary); font-size: 16px;">MCA</h5>
                      <div class="form-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
                        <div class="form-group"><label>MCA Username</label><input type="text" [(ngModel)]="currentEntity.mcaUsername" placeholder="MCA Username"></div>
                        <div class="form-group">
                          <label>MCA Password</label>
                          <div class="pwd-wrapper">
                            <input [type]="showPassword['mca'] ? 'text' : 'password'" [(ngModel)]="currentEntity.mcaPassword" placeholder="MCA Password">
                            <span class="material-symbols-outlined pwd-toggle" (click)="togglePassword('mca')">{{ showPassword['mca'] ? 'visibility_off' : 'visibility' }}</span>
                          </div>
                        </div>
                      </div>
"""

target = '<h5 style="margin-top: 24px; margin-bottom: 16px; color: var(--accent-primary); font-size: 16px;">GST</h5>'

if 'MCA Username' not in content:
    content = content.replace(target, mca_html + "\n" + target)

with open(r'c:\projects\we_crm\webpage\src\app\dashboard\client-dashboard\client-dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Client dashboard updated with MCA fields")
