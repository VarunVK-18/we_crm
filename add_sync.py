import sys

with open(r'c:\projects\we_crm\crm_backend\controllers\serviceDetailsController.js', 'r', encoding='utf-8') as f:
    content = f.read()

sync_logic = """
      // --- SYNC TO CLIENT ENTITY ---
      const client = await User.findById(clientId);
      if (client && client.client_entities && client.client_entities.length > 0) {
        const entity = client.client_entities[0];
        let updated = false;

        if (serviceType === 'GST') {
          if (username !== undefined) { entity.gstUsername = username; updated = true; }
          if (password !== undefined) { entity.gstPassword = password; updated = true; }
          if (gstTrn !== undefined) { entity.gstArn = gstTrn; updated = true; }
        }
        else if (serviceType === 'ITR') {
          if (username !== undefined) { entity.itrUsername = username; updated = true; }
          if (password !== undefined) { entity.itrPassword = password; updated = true; }
        }
        else if (serviceType === 'TDS') {
          if (tan !== undefined) { entity.tan = tan; updated = true; }
          if (username !== undefined) { entity.tdsUsername = username; updated = true; }
          if (password !== undefined) { entity.tdsPassword = password; updated = true; }
        }
        else if (serviceType === 'PF') {
          if (pfCode !== undefined) { entity.pfEstablishmentId = pfCode; updated = true; }
          if (username !== undefined) { entity.pfUsername = username; updated = true; }
          if (password !== undefined) { entity.pfPassword = password; updated = true; }
        }
        else if (serviceType === 'MSME') {
          if (udyamNumber !== undefined) { entity.msme = udyamNumber; updated = true; }
        }
        else if (serviceType === 'LEI') {
          if (leiNumber !== undefined) { entity.lei = leiNumber; updated = true; }
        }
        else if (serviceType === 'IEC') {
          if (iecNumber !== undefined) { entity.iec = iecNumber; updated = true; }
        }
        else if (serviceType === 'FSSAI') {
          if (username !== undefined) { entity.fssaiTrackingId = username; updated = true; }
        }
        else if (serviceType === 'Trademark') {
          if (trackingNumber !== undefined) { entity.trademarkApplicationNumber = trackingNumber; updated = true; }
        }
        else if (serviceType === 'Patent') {
          if (trackingNumber !== undefined) { entity.patentApplicationNumber = trackingNumber; updated = true; }
        }
        else if (serviceType === 'Copyright') {
          if (trackingNumber !== undefined) { entity.copyrightRegistrationNumber = trackingNumber; updated = true; }
        }

        if (updated) {
          client.markModified('client_entities');
          await client.save();
        }
      }
      // --- END SYNC ---
"""

target = """      const record = await ServiceDetails.findOneAndUpdate(
        { clientId, serviceType },
        update,
        { upsert: true, new: true, runValidators: true }
      );"""

replacement = target + "\n" + sync_logic

content = content.replace(target, replacement)

with open(r'c:\projects\we_crm\crm_backend\controllers\serviceDetailsController.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Sync logic added to controller")
