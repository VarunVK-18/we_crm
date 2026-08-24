 const Map<String, List<String>> kServiceRequiredDocuments = {
  // Incorporation
  'Private Limited Incorporation': ['Directors Aadhar & PAN Card', 'EB Bill < 2 months'],
  'LLP Incorporation': ['Partners Aadhar & PAN Card', 'EB Bill < 2 months'],
  'OPC Incorporation': ['Director & Nominee Aadhar & PAN Card', 'EB Bill < 2 months'],
  'MSME Registration': ['Aadhar & PAN Card', 'Bank account details', 'EB Bill < 2 months'],
  'Proprietorship Registration': [],

  // Compliance
  'MCA Compliance': ['Last Year Bank Statements', 'All Company documents'],
  'TDS Return Filing': ['TAN & PAN', 'Salary Details', 'Previous TDS Return / RPU File (if available)', 'Valid Digital Signature'],
  'PF Registration & Compliance': ['Employee Master Details', 'PF Contribution Details', 'Employee KYC Details', 'Bank Account Details'],

  // IP
  'Trademark Registration': ['Trademark Logo', 'MSME Certificate'],
  'Copyright Registration': ['Identity Proof of Applicant', 'Details of the Copyright Work'],
  'Patent Registration': ['Company Registration Documents', 'Details of the Invention', 'Technical Documents'],

  // Tax
  'Income Tax Return (ITR)': ['Last Year Bank Statements', 'All Company documents'],
  'GST Registration': ['Aadhaar & PAN Card', 'Recent Photograph of the applicant', 'Proof of Principal Place of Business', 'Cancelled Cheque or Bank Statement'],
  'GST Returns Filing': [],
  'GST Cancellation': [],

  // Licensing
  'DPIIT Recognition': [],
  'ISO Certification': ['Recent Invoice copy raised', 'Address Proof', 'Authorised Letter'],
  'FSSAI Registration': ['Company Incorporation documents', 'Proof of Business Address', 'NOC from Premises Owner'],
  'DUNS Number': ['Address Proof (Utility bill / Bank statement)', 'Company Incorporation & PAN'],
  'Import Export Code (IEC)': ['Company Incorporation & PAN'],
  'BIS Certification': [],
  'CE Certification': [],
  'RoHS Certification': [],
  'LEI Registration': [],
  'Digital Signature Certificate (DSC)': ['Aadhar & PAN Card'],
};

const Map<String, List<String>> kServiceFinalDocuments = {
  'Private Limited Incorporation': ['Certificate of Incorporation (COI)', 'PAN Card', 'TAN Allotment Letter', 'Memorandum of Association (MOA)', 'Articles of Association (AOA)', 'Incorporation Forms (SPICe+)'],
  'LLP Incorporation': ['Certificate of Incorporation', 'LLP Agreement', 'PAN Card', 'TAN Allotment Letter'],
  'OPC Incorporation': ['Certificate of Incorporation (COI)', 'PAN Card', 'TAN Allotment Letter', 'Memorandum of Association (MOA)', 'Articles of Association (AOA)', 'Incorporation Forms (SPICe+)'],
  'MSME Registration': ['Udyam Registration Certificate'],
  'Proprietorship Registration': ['GST Registration Certificate', 'MSME Registration'],
  'TDS Return Filing': ['TDS Return Filing Acknowledgement', 'Form 27A', 'Filed Return Copy', 'Challan Details'],
  'PF Registration & Compliance': ['EPFO Registration Certificate', 'PF Registration Number', 'Monthly/Periodic PF Filing Challans & ECR Acknowledgements'],
  'Trademark Registration': ['Trademark Application Receipt (TM-A)', 'Application Number'],
  'Copyright Registration': ['Copyright Registration Certificate'],
  'Patent Registration': ['Patent Application Receipt', 'Application Number', 'Patent Certificate', 'Filed Patent Documents'],
  'Income Tax Return (ITR)': ['ITR-V Acknowledgement', 'Filed Income Tax Return Copy'],
  'GST Registration': ['GST Registration Certificate', 'GSTIN'],
  'GST Returns Filing': ['GST Return Filing Acknowledgement', 'Challan'],
  'GST Cancellation': ['GST Cancellation Order', 'GST Cancellation Acknowledgement'],
  'DPIIT Recognition': ['DPIIT Startup Recognition Certificate'],
  'ISO Certification': ['ISO Certificate'],
  'FSSAI Registration': ['FSSAI License'],
  'DUNS Number': ['D-U-N-S® Number Confirmation Letter/Certificate'],
  'Import Export Code (IEC)': ['IEC Certificate'],
  'BIS Certification': ['BIS License'],
  'CE Certification': ['CE Certificate'],
  'RoHS Certification': ['RoHS Compliance Certificate'],
  'LEI Registration': ['Legal Entity Identifier (LEI) Certificate'],
  'Digital Signature Certificate (DSC)': ['Digital Signature Certificate (DSC)', 'USB Token'],
};

