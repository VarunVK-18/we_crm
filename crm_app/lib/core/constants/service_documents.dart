const Map<String, List<String>> kServiceRequiredDocuments = {
  // Company Incorporation
  'Proprietorship Registration': ['PAN Card', 'Aadhaar Card', 'Business Address Proof', 'Proprietor Photo'],
  'Partnership Firm Registration': ['Partnership Deed', 'PAN of Firm', 'ID Proof of Partners', 'Address Proof of Partners'],
  'Private Limited Incorporation': ['Registered Office Proof (EB/Wifi Bill < 2mo)'],
  
  // Compliance Services
  'MCA Compliance Package (Private Ltd)': ['Company PAN', 'AOC-4 & MGT-7', 'DSC & DIN of Directors', 'Bank Statements'],
  'MCA Compliance Package (LLP)': ['LLP PAN', 'Form 8 & Form 11', 'DSC of Partners', 'Bank Statements'],
  'GST Compliance Package': ['GST Certificate', 'Invoices List', 'Bank Statements', 'Purchase/Sales Register'],
  'Comprehensive MCA + GST + TDS': ['Company PAN', 'GST Certificate', 'TDS Records', 'Annual Audit Report'],
  
  // Business Licenses
  'IEC Code Registration': ['PAN Card', 'Aadhaar Card', 'Bank Proof (Cancelled Cheque)', 'Address Proof'],
  'FSSAI Food License': ['Aadhaar Card', 'PAN Card', 'Passport Size Photo', 'Business Address Proof'],
  'ISO Certifications': ['GST Certificate', 'Business Address Proof', 'Scope of Operations', 'Organization Chart'],
  
  // Taxation Services
  'TAX filing': ['Form 16/16A', 'Bank Statements', 'Investment Proofs', 'PAN Card'],
  'TAX Planning': ['Current Financials', 'Existing Policy Details', 'Income Projection', 'PAN Card'],
  'GST Services': ['PAN Card', 'Address Proof', 'Aadhaar Card', 'Bank Details'],
  'PAN, TAN & Bank Setup': ['Personal ID Proofs', 'Address Proof', 'Company Incorporation Copy'],
  
  // Marketplace / Selection Services
  '360° Compliance': ['Company Profile', 'Last Year Audit', 'GST Details', 'Legal Structure Copy'],
  'Trademark Registration': ['UDYAM MSME Certificate', 'Trademark Logo', 'Signature with name'],
  'Accounting & Tax': ['Trial Balance', 'Previous Audit Report', 'Bank Statements', 'Purchase/Sales Bills'],
  'GST Onboarding': ['PAN Card', 'Business Address Proof', 'Aadhaar Card', 'Photo'],
  'Strategic Tax Planning': ['Latest Financial Statements', 'Tax History', 'Asset List', 'PAN Card'],
  'Capital Funding': ['Project Report', 'Previous Financials', 'Pitch Deck', 'ID Proof of Founders'],
  'Risk Management': ['Legal History', 'Internal Compliance Manual', 'Policy Papers', 'ID Proof'],
  'MSME Certification': ['Company PAN Card'],
  'DUNS Number Registration': ['Business Registration Proof', 'PAN Card', 'Aadhaar of Authorized Signatory'],
  'LLP Incorporation': ['Registered Office Proof (EB/Wifi Bill < 2mo)'],
};
