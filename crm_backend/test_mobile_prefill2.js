const mongoose = require('mongoose');

async function testMobilePrefill() {
  await mongoose.connect('mongodb://193.203.161.48:27018/we_crm');
  const User = require('./models/User');

  const entityName = 'Two Star Lifts And Escalator Private Limited';
  const user = await User.findOne({ company_name: new RegExp('Two Star Lifts', 'i') });

  if (!user) {
    console.log('User not found.');
    process.exit(1);
  }

  let profileData = {};
  let profileDocs = [];

  // MOCK THE UPDATED CONTROLLER LOGIC
  profileData['email'] = user.email;
  profileData['phone'] = user.phone;
  profileData['directorName'] = user.owner_name || user.name;
  
  if (user.directors && user.directors.length > 0) {
    const dir = user.directors[0];
    profileData['directorDin'] = dir.din;
    profileData['directorPan'] = dir.pan;
  }

  if (user.client_entities && user.client_entities.length > 0) {
    let entity = user.client_entities.find(e => {
      const n1 = (e.entityName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const n2 = entityName.toLowerCase().replace(/[^a-z0-9]/g, '');
      return n1.includes(n2) || n2.includes(n1);
    });
    if (!entity) entity = user.client_entities[0];
    
    if (entity) {
      profileData['companyName'] = entity.entityName;
      profileData['pan'] = entity.pan;
      profileData['gstin'] = entity.gstin;
      profileData['cin'] = entity.cin;
      profileData['address'] = entity.address || user.address;
      if (entity.incorporationDate) {
         const date = new Date(entity.incorporationDate);
         profileData['incorporationDate'] = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      }
    }
  }

  if (user.onboarding_documents && user.onboarding_documents.length > 0) {
    user.onboarding_documents.forEach(d => {
      const n = (d.name || '').toLowerCase();
      const type = n.includes('incorporation') || n.includes('coi') ? 'coi' :
                   n.includes('pan') ? 'pan' :
                   n.includes('aadhaar') ? 'aadhaar' :
                   n.includes('moa') ? 'moa' :
                   n.includes('aoa') ? 'aoa' :
                   n.includes('bank') ? 'bankStatement' :
                   n.includes('sales') ? 'salesInvoice' :
                   n.includes('purchase') ? 'purchaseBills' :
                   n.includes('address') || n.includes('electricity') ? 'addressProof' :
                   n.includes('photo') ? 'directorPhoto' : 'other';
      
      if (type !== 'other') {
        profileDocs.push({ documentType: type, name: d.name, fileUrl: d.fileUrl });
      }
    });
  }

  console.log(JSON.stringify({ profileData, profileDocs }, null, 2));
  mongoose.connection.close();
}

testMobilePrefill();
