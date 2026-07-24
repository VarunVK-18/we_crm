content = open(r'c:\projects\we_crm\webpage\src\app\dashboard\service-details\service-details.html', encoding='utf-8').read()
content = content.replace('/ autocomplete=\"new-password\">', 'autocomplete=\"new-password\" />')
open(r'c:\projects\we_crm\webpage\src\app\dashboard\service-details\service-details.html', 'w', encoding='utf-8').write(content)
print("Fixed syntax")
