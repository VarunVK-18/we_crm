import { DocumentMatcher } from './webpage/src/app/utils/document-matcher';
import { AutoFillUtils } from './webpage/src/app/utils/autofill-utils';

function testAutofill() {
  // Mock User Data
  const user = {
    owner_name: 'KANNAPPAN',
    company_name: 'TWO STAR LIFTS AND ESCALATOR PRIVATE LIMITED',
    email: 'test@twostar.com',
    phone: '9876543210',
    pan: 'ABCDE1234F',
    directors: [{
      ownerName: 'KANNAPPAN',
      pan: 'ABCDE1234F',
      mobileNumber: '9876543210',
      email: 'test@twostar.com'
    }],
    client_entities: [{
      entityName: 'TWO STAR LIFTS AND ESCALATOR PRIVATE LIMITED',
      pan: 'ABCDE1234F',
      gstin: '22AAAAA0000A1Z5',
      address: '123 Test Address, Test City, 123456',
      incorporationDate: '2020-01-01'
    }],
    onboarding_documents: [
      { name: 'PAN', fileUrl: 'https://example.com/pan.pdf' },
      { name: 'GST Certificate', fileUrl: 'https://example.com/gst.pdf' },
      { name: 'Incorporation', fileUrl: 'https://example.com/incorp.pdf' }
    ]
  };

  const results = [];

  // Mock Component for pf-form
  class MockPfForm {
    businessName = '';
    panNumber = '';
    dateOfIncorporation = '';
    businessAddress = '';
    signatoryName = '';
    signatoryMobile = '';
    signatoryEmail = '';
    
    // docs
    existingDocs: any = {};
  }
  const pfComponent = new MockPfForm();
  
  // Test autofill text
  AutoFillUtils.autoFillTextData(pfComponent, user.company_name, user);
  
  // Test autofill docs for pf-form
  const pfKeywordMap: any = {
    'panCard': ['pan'],
    'businessAddressProof': ['business address', 'rent agreement', 'eb bill', 'property tax'],
    'incorpCert': ['incorporation', 'incorp'],
  };
  
  for (const field of Object.keys(pfKeywordMap)) {
    const matchedDoc = DocumentMatcher.findExistingDoc(user.company_name, user.onboarding_documents, pfKeywordMap[field]);
    if (matchedDoc) {
      pfComponent.existingDocs[field] = matchedDoc;
    }
  }

  results.push({ form: 'PF Form', field: 'businessName (Company Name)', expected: user.company_name, actual: pfComponent.businessName, pass: pfComponent.businessName === user.company_name });
  results.push({ form: 'PF Form', field: 'panNumber (PAN)', expected: user.pan, actual: pfComponent.panNumber, pass: pfComponent.panNumber === user.pan });
  results.push({ form: 'PF Form', field: 'dateOfIncorporation', expected: '2020-01-01', actual: pfComponent.dateOfIncorporation, pass: pfComponent.dateOfIncorporation === '2020-01-01' });
  results.push({ form: 'PF Form', field: 'signatoryName (Director Name)', expected: user.owner_name, actual: pfComponent.signatoryName, pass: pfComponent.signatoryName === user.owner_name });
  results.push({ form: 'PF Form', field: 'Document: panCard', expected: 'https://example.com/pan.pdf', actual: pfComponent.existingDocs['panCard']?.fileUrl, pass: pfComponent.existingDocs['panCard']?.fileUrl === 'https://example.com/pan.pdf' });
  results.push({ form: 'PF Form', field: 'Document: incorpCert', expected: 'https://example.com/incorp.pdf', actual: pfComponent.existingDocs['incorpCert']?.fileUrl, pass: pfComponent.existingDocs['incorpCert']?.fileUrl === 'https://example.com/incorp.pdf' });


  // Mock Component for gst-form
  class MockGstForm {
    legalName = '';
    panOfBusiness = '';
    businessEmail = '';
    businessPhone = '';
    incorpDate = '';
    dir1FullName = '';
    dir1Pan = '';
    
    // docs
    existingDocs: any = {};
  }
  const gstComponent = new MockGstForm();
  
  AutoFillUtils.autoFillTextData(gstComponent, user.company_name, user);
  
  const gstKeywordMap: any = {
    'incorpCert': ['incorporation', 'incorp'],
    'companyPanFile': ['company pan', 'pan card', 'pan'],
  };
  
  for (const field of Object.keys(gstKeywordMap)) {
    const matchedDoc = DocumentMatcher.findExistingDoc(user.company_name, user.onboarding_documents, gstKeywordMap[field]);
    if (matchedDoc) {
      gstComponent.existingDocs[field] = matchedDoc;
    }
  }

  results.push({ form: 'GST Form', field: 'legalName (Company Name)', expected: user.company_name, actual: gstComponent.legalName, pass: gstComponent.legalName === user.company_name });
  results.push({ form: 'GST Form', field: 'panOfBusiness (PAN)', expected: user.pan, actual: gstComponent.panOfBusiness, pass: gstComponent.panOfBusiness === user.pan });
  results.push({ form: 'GST Form', field: 'incorpDate', expected: '2020-01-01', actual: gstComponent.incorpDate, pass: gstComponent.incorpDate === '2020-01-01' });
  results.push({ form: 'GST Form', field: 'businessPhone', expected: user.phone, actual: gstComponent.businessPhone, pass: gstComponent.businessPhone === user.phone });
  results.push({ form: 'GST Form', field: 'Document: companyPanFile', expected: 'https://example.com/pan.pdf', actual: gstComponent.existingDocs['companyPanFile']?.fileUrl, pass: gstComponent.existingDocs['companyPanFile']?.fileUrl === 'https://example.com/pan.pdf' });


  console.log(JSON.stringify(results, null, 2));
}

testAutofill();
