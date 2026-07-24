import sys

with open(r'c:\projects\we_crm\webpage\src\app\dashboard\client-dashboard\client-dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Input fields for LEI and IEC
lei_iec_inputs = """                      <h5 style="margin-top: 24px; margin-bottom: 16px; color: var(--accent-primary); font-size: 16px;">LEI & IEC</h5>
                      <div class="form-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
                        <div class="form-group"><label>LEI Number</label><input type="text" [(ngModel)]="currentEntity.lei" placeholder="LEI Number"></div>
                        <div class="form-group"><label>IEC Number</label><input type="text" [(ngModel)]="currentEntity.iec" placeholder="IEC Number"></div>
                      </div>
"""
target_ip = '<h5 style="margin-top: 24px; margin-bottom: 16px; color: var(--accent-primary); font-size: 16px;">Intellectual Property</h5>'
if 'LEI Number' not in content:
    content = content.replace(target_ip, lei_iec_inputs + "\n" + target_ip)


# 2. Add Read-only labels for LEI and IEC
lei_iec_labels = """                          @if (ent.lei) { <div><small style="color: #64748b; display: block;">LEI</small><strong>{{ ent.lei }}</strong></div> }
                          @if (ent.iec) { <div><small style="color: #64748b; display: block;">IEC</small><strong>{{ ent.iec }}</strong></div> }"""
target_iso = '@if (ent.iso) { <div><small style="color: #64748b; display: block;">ISO</small><strong>{{ ent.iso }}</strong></div> }'
if 'ent.lei' not in content:
    content = content.replace(target_iso, lei_iec_labels + "\n" + target_iso)


with open(r'c:\projects\we_crm\webpage\src\app\dashboard\client-dashboard\client-dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Client dashboard updated with LEI and IEC fields")
