const mongoose = require('mongoose');

async function testMobilePrefill() {
  await mongoose.connect('mongodb://localhost:27017/we_crm');

  const EntityProfile = require('./models/EntityProfile');
  const entityName = 'Two Star Lifts And Escalator Private Limited';
  
  // Find the entity we injected earlier
  const profile = await EntityProfile.findOne({ entityName: new RegExp(entityName, 'i') });
  
  if (!profile) {
    console.log('Profile not found for test.');
    process.exit(1);
  }

  let profileData = {};
  let profileDocs = [];

  const knownFields = ['pan', 'email', 'phone', 'address', 'cin', 'incorporationDate', 'gstin', 
  'directorName', 'directorEmail', 'directorPhone', 'directorPan', 'directorDin', 'bankAccount', 'bankIfsc', 'bankName', 
  'tan'];
  
  knownFields.forEach(k => { 
    if (profile[k]) profileData[k] = profile[k]; 
  });
  
  if (profile.dynamicProfileData) {
    Object.assign(profileData, profile.dynamicProfileData);
  }

  // Collect documents
  if (profile.panCardDocId) profileDocs.push({ documentType: 'pan', name: profile.panCardDocName, fileUrl: `/api/documents/${profile.panCardDocId}` });
  if (profile.aadhaarDocId) profileDocs.push({ documentType: 'aadhaar', name: profile.aadhaarDocName, fileUrl: `/api/documents/${profile.aadhaarDocId}` });
  if (profile.incorpCertDocId) profileDocs.push({ documentType: 'coi', name: profile.incorpCertDocName, fileUrl: `/api/documents/${profile.incorpCertDocId}` });
  if (profile.addressProofDocId) profileDocs.push({ documentType: 'addressProof', name: profile.addressProofDocName, fileUrl: `/api/documents/${profile.addressProofDocId}` });
  if (profile.directorPhotoDocId) profileDocs.push({ documentType: 'directorPhoto', name: profile.directorPhotoDocName, fileUrl: `/api/documents/${profile.directorPhotoDocId}` });

  console.log("MOBILE PREFILL API RESPONSE (MOCK):");
  console.log("Form Details:", JSON.stringify(profileData, null, 2));
  console.log("Documents:", JSON.stringify(profileDocs, null, 2));

  mongoose.connection.close();
}

testMobilePrefill();
