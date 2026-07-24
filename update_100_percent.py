import sys
import re

# 1. Update User.js
with open(r'c:\projects\we_crm\crm_backend\models\User.js', 'r', encoding='utf-8') as f:
    user_content = f.read()

if 'dpiitUsername: String' not in user_content:
    user_content = user_content.replace(
        "dpiitRecognitionNumber: String,",
        "dpiitRecognitionNumber: String,\n        dpiitUsername: String,\n        dpiitPassword: String,\n        dunsNumber: String,\n        bisNumber: String,\n        fssaiPassword: String,"
    )
    with open(r'c:\projects\we_crm\crm_backend\models\User.js', 'w', encoding='utf-8') as f:
        f.write(user_content)

# 2. Update serviceDetailsController.js
with open(r'c:\projects\we_crm\crm_backend\controllers\serviceDetailsController.js', 'r', encoding='utf-8') as f:
    ctrl_content = f.read()

if "entity.dpiitUsername" not in ctrl_content:
    new_sync = """
      else if (serviceType === 'DPIIT') {
        if (username !== undefined) { entity.dpiitUsername = username; updated = true; }
        if (password !== undefined) { entity.dpiitPassword = password; updated = true; }
      }
      else if (serviceType === 'DUNS') {
        if (trackingNumber !== undefined) { entity.dunsNumber = trackingNumber; updated = true; }
      }
      else if (serviceType === 'BIS') {
        if (trackingNumber !== undefined) { entity.bisNumber = trackingNumber; updated = true; }
      }"""
    
    ctrl_content = ctrl_content.replace("else if (serviceType === 'ITR') {", new_sync + "\n      else if (serviceType === 'ITR') {")
    
    ctrl_content = ctrl_content.replace(
        "if (username !== undefined) { entity.fssaiTrackingId = username; updated = true; }",
        "if (username !== undefined) { entity.fssaiTrackingId = username; updated = true; }\n        if (password !== undefined) { entity.fssaiPassword = password; updated = true; }"
    )

    with open(r'c:\projects\we_crm\crm_backend\controllers\serviceDetailsController.js', 'w', encoding='utf-8') as f:
        f.write(ctrl_content)

# 3. Update client-dashboard.html
with open(r'c:\projects\we_crm\webpage\src\app\dashboard\client-dashboard\client-dashboard.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

if 'DPIIT Username' not in html_content:
    dpiit_html = """
                      <div class="form-group"><label>DPIIT Username</label><input type="text" [(ngModel)]="currentEntity.dpiitUsername" placeholder="DPIIT Username"></div>
                      <div class="form-group">
                        <label>DPIIT Password</label>
                        <div class="pwd-wrapper">
                          <input [type]="showPassword['dpiit'] ? 'text' : 'password'" [(ngModel)]="currentEntity.dpiitPassword" placeholder="DPIIT Password">
                          <span class="material-symbols-outlined pwd-toggle" (click)="togglePassword('dpiit')">{{ showPassword['dpiit'] ? 'visibility_off' : 'visibility' }}</span>
                        </div>
                      </div>
                      <div class="form-group"><label>DUNS Number</label><input type="text" [(ngModel)]="currentEntity.dunsNumber" placeholder="DUNS Number"></div>
                      <div class="form-group"><label>BIS Number</label><input type="text" [(ngModel)]="currentEntity.bisNumber" placeholder="BIS Number"></div>"""
    
    html_content = html_content.replace('<div class="form-group"><label>DPIIT Recog. No.</label>', dpiit_html + '\n                      <div class="form-group"><label>DPIIT Recog. No.</label>')

    # add fssai password right after fssai tracking id
    fssai_pass_html = """
                      <div class="form-group">
                        <label>FSSAI Password</label>
                        <div class="pwd-wrapper">
                          <input [type]="showPassword['fssai_pass'] ? 'text' : 'password'" [(ngModel)]="currentEntity.fssaiPassword" placeholder="FSSAI Password">
                          <span class="material-symbols-outlined pwd-toggle" (click)="togglePassword('fssai_pass')">{{ showPassword['fssai_pass'] ? 'visibility_off' : 'visibility' }}</span>
                        </div>
                      </div>"""
    html_content = html_content.replace('<div class="form-group"><label>FSSAI App ID</label>', fssai_pass_html + '\n                      <div class="form-group"><label>FSSAI App ID</label>')
    
    # Readonly sections
    readonly_additions = """
                          @if (ent.dpiitUsername) { <div><small style="color: #64748b; display: block;">DPIIT Username</small><strong>{{ ent.dpiitUsername }}</strong></div> }
                          @if (ent.dpiitPassword) { <div><small style="color: #64748b; display: block;">DPIIT Password</small><strong>{{ ent.dpiitPassword }}</strong></div> }
                          @if (ent.dunsNumber) { <div><small style="color: #64748b; display: block;">DUNS</small><strong>{{ ent.dunsNumber }}</strong></div> }
                          @if (ent.bisNumber) { <div><small style="color: #64748b; display: block;">BIS</small><strong>{{ ent.bisNumber }}</strong></div> }
                          @if (ent.fssaiPassword) { <div><small style="color: #64748b; display: block;">FSSAI Password</small><strong>{{ ent.fssaiPassword }}</strong></div> }"""
    html_content = html_content.replace('@if (ent.dpiitRecognitionNumber)', readonly_additions + '\n                          @if (ent.dpiitRecognitionNumber)')
    
    with open(r'c:\projects\we_crm\webpage\src\app\dashboard\client-dashboard\client-dashboard.html', 'w', encoding='utf-8') as f:
        f.write(html_content)

print("100% completed")
