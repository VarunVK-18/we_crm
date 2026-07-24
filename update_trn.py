import sys

with open(r'c:\projects\we_crm\webpage\src\app\dashboard\client-dashboard\client-dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '<div class="form-group"><label>ARN / App ID</label><input type="text" [(ngModel)]="currentEntity.gstArn" placeholder="Enter ARN"></div>',
    '<div class="form-group"><label>GST ARN / TRN</label><input type="text" [(ngModel)]="currentEntity.gstArn" placeholder="Enter ARN or TRN"></div>'
)

content = content.replace(
    '@if (ent.gstArn) { <div><small style="color: #64748b; display: block;">GST ARN</small><strong>{{ ent.gstArn }}</strong></div> }',
    '@if (ent.gstArn) { <div><small style="color: #64748b; display: block;">GST ARN / TRN</small><strong>{{ ent.gstArn }}</strong></div> }'
)

with open(r'c:\projects\we_crm\webpage\src\app\dashboard\client-dashboard\client-dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated ARN to ARN/TRN in Client Dashboard")
