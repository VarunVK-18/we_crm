const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');

/**
 * Perform OCR on a given image or extract text from a PDF buffer and return the extracted text.
 * @param {Buffer} fileBuffer
 * @param {string} mimeType
 * @returns {Promise<string>}
 */
const extractText = async (fileBuffer, mimeType = 'image/png') => {
  try {
    if (mimeType === 'application/pdf') {
      // Use pdf-parse for fast and accurate text extraction from digitally generated PDFs
      const data = await pdfParse(fileBuffer);
      return data.text;
    } else {
      // Use Tesseract for images
      const { data: { text } } = await Tesseract.recognize(fileBuffer, 'eng');
      return text;
    }
  } catch (err) {
    console.error('[OCR Validation] Extraction failed:', err);
    throw new Error('Could not read text from document.');
  }
};

/**
 * Validates a PAN Card document.
 */
const validatePAN = (text) => {
  const upperText = text.toUpperCase();
  const hasIncomeTax = upperText.includes('INCOME TAX DEPARTMENT');
  const hasGovt = upperText.includes('GOVT. OF INDIA');
  // Simple PAN regex check inside the text
  const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
  const hasPAN = panRegex.test(upperText);

  return (hasIncomeTax || hasGovt) && hasPAN;
};

/**
 * Validates an Aadhaar Card document.
 */
const validateAadhaar = (text) => {
  const upperText = text.toUpperCase();
  const hasGovt = upperText.includes('GOVERNMENT OF INDIA') || upperText.includes('UNIQUE IDENTIFICATION AUTHORITY');
  // Basic 12 digit match
  const aadhaarRegex = /\d{4}\s?\d{4}\s?\d{4}/;
  const hasAadhaar = aadhaarRegex.test(upperText);

  return hasGovt && hasAadhaar;
};

/**
 * Validates a GST Certificate.
 */
const validateGST = (text) => {
  const upperText = text.toUpperCase();
  const hasGST = upperText.includes('GOODS AND SERVICES TAX') || upperText.includes('FORM GST REG-06');
  const gstinRegex = /[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}/;
  const hasGSTIN = gstinRegex.test(upperText);

  return hasGST && hasGSTIN;
};

/**
 * Validates an Incorporation Certificate (COI).
 */
const validateCOI = (text) => {
  const upperText = text.toUpperCase();
  const hasCOI = upperText.includes('CERTIFICATE OF INCORPORATION') || upperText.includes('REGISTRAR OF COMPANIES');
  const cinRegex = /[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}/; // Simplified CIN regex
  const hasCIN = cinRegex.test(upperText);

  return hasCOI || hasCIN; // Since CIN format is very specific, either is a good indicator
};

/**
 * Validates an Udyam (MSME) Certificate.
 */
const validateUdyam = (text) => {
  const upperText = text.toUpperCase();
  const hasUdyam = upperText.includes('UDYAM REGISTRATION CERTIFICATE') || upperText.includes('MINISTRY OF MICRO');
  const udyamRegex = /UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}/;
  const hasUdyamNo = udyamRegex.test(upperText);

  return hasUdyam || hasUdyamNo;
};

/**
 * Validates a Trademark Certificate.
 */
const validateTrademark = (text) => {
  const upperText = text.toUpperCase();
  const hasTrademark = upperText.includes('TRADE MARKS REGISTRY') || upperText.includes('CERTIFICATE OF REGISTRATION OF TRADE MARK');
  return hasTrademark; // Application number formats vary significantly, checking headers is safer
};

/**
 * Validates an ISO Certificate.
 */
const validateISO = (text) => {
  const upperText = text.toUpperCase();
  const hasISO = upperText.includes('ISO 9001') || upperText.includes('CERTIFICATE OF REGISTRATION') || upperText.includes('QUALITY MANAGEMENT SYSTEM');
  return hasISO;
};

/**
 * Validates a TAN document.
 */
const validateTAN = (text) => {
  const upperText = text.toUpperCase();
  const tanRegex = /[A-Z]{4}[0-9]{5}[A-Z]{1}/;
  const hasTAN = tanRegex.test(upperText);
  return upperText.includes('TAX DEDUCTION ACCOUNT NUMBER') || hasTAN;
};

module.exports = {
  extractText,
  validatePAN,
  validateAadhaar,
  validateGST,
  validateCOI,
  validateUdyam,
  validateTrademark,
  validateISO,
  validateTAN
};
