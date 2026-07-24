import sys

with open(r'c:\projects\we_crm\crm_backend\controllers\serviceDetailsController.js', 'r', encoding='utf-8') as f:
    content = f.read()

mca_sync_logic = """
      if (serviceType === 'MCA') {
        if (username !== undefined) { entity.mcaUsername = username; updated = true; }
        if (password !== undefined) { entity.mcaPassword = password; updated = true; }
      }
      else if (serviceType === 'GST') {"""

content = content.replace("if (serviceType === 'GST') {", mca_sync_logic)

dir_sync_logic = """
      if (updated) {
        client.markModified('client_entities');
      }

      // Sync Director Credentials
      if ((serviceType === 'MCA' || serviceType === 'ITR') && Array.isArray(directorCredentials)) {
        directorCredentials.forEach(dirCred => {
          const dirIndex = dirCred.index;
          if (client.directors && client.directors.length > dirIndex) {
            const dirProfile = client.directors[dirIndex];
            if (serviceType === 'MCA') {
              if (dirCred.username !== undefined) dirProfile.mcaUsername = dirCred.username;
              if (dirCred.password !== undefined) dirProfile.mcaPassword = dirCred.password;
            } else if (serviceType === 'ITR') {
              if (dirCred.username !== undefined) dirProfile.itrUsername = dirCred.username;
              if (dirCred.password !== undefined) dirProfile.itrPassword = dirCred.password;
            }
            updated = true;
          }
        });
        if (updated) {
          client.markModified('directors');
        }
      }

      if (updated) {
        await client.save();
      }
    }"""

old_save_logic = """
      if (updated) {
        client.markModified('client_entities');
        await client.save();
      }
    }"""

content = content.replace(old_save_logic, dir_sync_logic)

with open(r'c:\projects\we_crm\crm_backend\controllers\serviceDetailsController.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Controller sync updated for MCA and Directors")
