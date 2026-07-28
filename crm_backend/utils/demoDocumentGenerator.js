const fs = require('fs');
const path = require('path');

/**
 * Generates a valid PDF 1.4 Buffer with title, subtitle, and details text.
 * Openable in any PDF reader or browser.
 */
function createDemoPdfBuffer(title = 'WE CRM Demo Document', subtitle = 'Official Statutory Filing Record', details = 'Verified by WE-CRM Compliance System') {
  // Sanitize ASCII text for PDF compatibility
  const cleanTitle = String(title).replace(/[()]/g, '');
  const cleanSubtitle = String(subtitle).replace(/[()]/g, '');
  const cleanDetails = String(details).replace(/[()]/g, '');

  const streamText = `BT
/F1 16 Tf
50 720 Td
(${cleanTitle}) Tj
/F1 12 Tf
0 -30 Td
(${cleanSubtitle}) Tj
0 -20 Td
(${cleanDetails}) Tj
ET
`;
  const streamLength = Buffer.byteLength(streamText, 'utf8');

  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${streamLength} >>
stream
${streamText}endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000234 00000 n 
0000000302 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
450
%%EOF`;

  return Buffer.from(pdfString, 'utf8');
}

/**
 * Generates a valid 1x1 PNG Buffer with signature 0x89 0x50 0x4E 0x47.
 */
function createDemoImageBuffer() {
  const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  return Buffer.from(base64Png, 'base64');
}

/**
 * Ensures standard demo files exist in the specified uploads folder.
 * Creates any missing sample PDF or PNG files.
 */
function ensureDemoFilesExist(uploadsDir) {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const sampleFiles = [
    { name: 'demo_coi.pdf', title: 'Certificate of Incorporation', subtitle: 'Ministry of Corporate Affairs', details: 'Statutory Certificate ID: WE-COI-998877' },
    { name: 'demo_moa.pdf', title: 'Memorandum of Association', subtitle: 'Company Constitution Document', details: 'Authorized Capital: INR 10,000,000' },
    { name: 'demo_aoa.pdf', title: 'Articles of Association', subtitle: 'Internal Corporate Governance', details: 'Approved by Board of Directors' },
    { name: 'demo_gstin.pdf', title: 'GST Registration Certificate', subtitle: 'Government of India - GSTIN', details: 'GSTIN: 33AAACW9999K1Z5' },
    { name: 'demo_pan.pdf', title: 'Permanent Account Number Card', subtitle: 'Income Tax Department', details: 'PAN: AAACW9999K' },
    { name: 'demo_certificate.pdf', title: 'Compliance Verification Certificate', subtitle: 'Issued by WE-CRM Statutory Audit Team', details: 'Status: Fully Compliant' },
    { name: 'demo_invoice.pdf', title: 'Tax Invoice & Receipt', subtitle: 'WE-CRM Billing Department', details: 'Amount Paid: INR 15,000 | GST: 18%' },
    { name: 'demo_receipt.pdf', title: 'Payment Receipt', subtitle: 'WE-CRM Financial Records', details: 'Transaction Reference: TXN-WE-909090' },
    { name: 'demo_dsc_token.pdf', title: 'Class 3 DSC Token Form', subtitle: 'Digital Signature Certificate Form', details: 'Serial: USB-DSC-2026-X88' },
    { name: 'demo_audit_report.pdf', title: 'Annual Statutory Audit Report', subtitle: 'Audited Financial Statements', details: 'Financial Year: 2025-2026' },
    { name: 'demo_shareholders.pdf', title: 'Shareholding Pattern Document', subtitle: 'List of Equity Shareholders', details: 'Verified Share Capital Table' }
  ];

  for (const file of sampleFiles) {
    const filePath = path.join(uploadsDir, file.name);
    if (!fs.existsSync(filePath)) {
      const buffer = createDemoPdfBuffer(file.title, file.subtitle, file.details);
      fs.writeFileSync(filePath, buffer);
    }
  }

  const imageFiles = ['demo_signature.png', 'demo_logo.png'];
  for (const imgName of imageFiles) {
    const filePath = path.join(uploadsDir, imgName);
    if (!fs.existsSync(filePath)) {
      const buffer = createDemoImageBuffer();
      fs.writeFileSync(filePath, buffer);
    }
  }

  return true;
}

module.exports = {
  createDemoPdfBuffer,
  createDemoImageBuffer,
  ensureDemoFilesExist
};
