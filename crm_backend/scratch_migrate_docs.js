const mongoose = require('mongoose');
const User = require('./models/User');
const EntityProfile = require('./models/EntityProfile');

mongoose.connect('mongodb://193.203.161.48:27018/')
  .then(async () => {
    console.log('Connected to DB');
    const profiles = await EntityProfile.find({});
    console.log(`Found ${profiles.length} profiles to check.`);
    
    let updatedUsers = 0;
    
    for (const profile of profiles) {
      if (!profile.uid) continue;
      
      const user = await User.findById(profile.uid);
      if (!user) continue;
      
      if (!user.onboarding_documents) user.onboarding_documents = [];
      let modified = false;
      
      const fileMappings = {
        'incorpCertDocId': 'Incorporation Certificate',
        'panCardDocId': 'Company PAN Card',
        'moaDocId': 'MOA',
        'aoaDocId': 'AOA',
        'bankDocId': 'Bank Statement',
        'salesInvoiceDocId': 'Sales Invoice',
        'purchaseBillsDocId': 'Purchase Bills',
        'gstDocId': 'GST Certificate',
        'aadhaarDocId': 'Director Aadhaar',
        'directorPanDocId': 'Director PAN',
        'udyamCertDocId': 'Udyam Certificate',
        'trademarkCertDocId': 'Trademark Certificate',
        'isoCertDocId': 'ISO Certificate'
      };
      
      for (const [key, friendlyName] of Object.entries(fileMappings)) {
        if (profile[key]) {
          const docId = profile[key];
          const exists = user.onboarding_documents.find(d => d.name === friendlyName || d.fileUrl === `api/documents/${docId}`);
          
          if (!exists || (exists && !exists.entityName)) {
            user.onboarding_documents = user.onboarding_documents.filter(d => d.name !== friendlyName);
            user.onboarding_documents.push({
              name: friendlyName,
              fileUrl: `api/documents/${docId}`,
              uploadedAt: profile.updatedAt || new Date(),
              entityName: profile.entityName
            });
            modified = true;
          }
        }
      }
      
      if (profile.dynamicProfileData) {
        for (const [key, value] of Object.entries(profile.dynamicProfileData)) {
          if (key.endsWith('File') && value) {
            const docId = value;
            const originalFieldname = key.replace('File', '');
            const friendlyName = originalFieldname;
            const exists = user.onboarding_documents.find(d => d.name === friendlyName || d.fileUrl === `api/documents/${docId}`);
            if (!exists || (exists && !exists.entityName)) {
              user.onboarding_documents = user.onboarding_documents.filter(d => d.name !== friendlyName);
              user.onboarding_documents.push({
                name: friendlyName,
                fileUrl: `api/documents/${docId}`,
                uploadedAt: profile.updatedAt || new Date(),
                entityName: profile.entityName
              });
              modified = true;
            }
          }
        }
      }
      
      if (modified) {
        user.markModified('onboarding_documents');
        await user.save();
        updatedUsers++;
        console.log(`Updated user ${user._id} with documents from profile ${profile._id}`);
      }
    }
    
    console.log(`Migration complete. Updated ${updatedUsers} users.`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
