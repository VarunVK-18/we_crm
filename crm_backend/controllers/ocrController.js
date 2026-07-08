const { GoogleGenerativeAI } = require('@google/generative-ai');
const Company = require('../models/Company');

// Utility to get the next working key
const getWorkingKey = async (prompt, imagePart) => {
  const keys = [
    process.env.GEMINI_API_KEY1,
    process.env.GEMINI_API_KEY2,
    process.env.GEMINI_API_KEY3
  ].filter(Boolean);

  if (keys.length === 0) {
    throw new Error('No Gemini API keys found in environment variables.');
  }

  let lastError = null;

  for (const key of keys) {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' }); // Requested model
      
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.warn(`Key failed, trying next... Error: ${error.message}`);
      lastError = error;
    }
  }

  throw new Error(`All Gemini API keys failed. Last error: ${lastError.message}`);
};

// @desc    Extract payment details from an uploaded image using Gemini
// @route   POST /api/ocr/extract
// @access  Private
const extractPaymentDetails = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image provided for OCR.' });
    }

    const mimeType = req.file.mimetype;
    const base64Data = req.file.buffer.toString('base64');

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType
      },
    };

    const bankSettingsRaw = req.body.bankSettings;
    let parsedBankSettings = null;
    if (bankSettingsRaw) {
      try {
        parsedBankSettings = JSON.parse(bankSettingsRaw);
      } catch (e) { /* Handle gracefully */ }
    }

    // Fallback: fetch directly from DB if not passed from frontend
    if (!parsedBankSettings && req.user && req.user.company_id) {
      try {
        const company = await Company.findById(req.user.company_id);
        if (company && company.settings && company.settings.bank_details) {
          parsedBankSettings = company.settings.bank_details;
          console.log('[OCR] Loaded bank settings from DB:', JSON.stringify(parsedBankSettings));
        }
      } catch (e) { /* Handle gracefully */ }
    } else if (parsedBankSettings) {
      console.log('[OCR] Using bank settings from request body:', JSON.stringify(parsedBankSettings));
    }

    const prompt = `You are an expert OCR AI that extracts payment details from receipts or screenshots. 
Extract the following information and return ONLY a valid JSON object with no markdown formatting or extra text:
{
  "amount": <number or null>,
  "transactionId": "<string or null>",
  "paymentTimestamp": "<string or null>",
  "upiId": "<string or null>",
  "accountLastFour": "<string or null>"
}

Ensure the amount is a raw number (e.g., 5000, not "5,000" or "Rs 5000").
Extract any transaction ID or reference number as a string.
Extract the date/time of payment if visible.
Extract the UPI ID (e.g., example@okaxis, 9876543210@ybl) if present.
Extract the last 4 digits of the bank account (e.g., "1234") if visible (look for "A/c ending with", "XXXX1234", etc.).
If a field is not found, set it to null.`;

    const jsonText = await getWorkingKey(prompt, imagePart);
    
    // Parse the JSON (clean up markdown code blocks if the model ignored instructions)
    let cleanJsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    const details = JSON.parse(cleanJsonText);

    let isBankMatched = false;
    
    console.log('[OCR] Extracted from receipt:', JSON.stringify({ upiId: details.upiId, accountLastFour: details.accountLastFour, transactionId: details.transactionId }));
    console.log('[OCR] parsedBankSettings available:', !!parsedBankSettings);

    if (parsedBankSettings && (details.upiId || details.accountLastFour)) {
      const receiptUpi = (details.upiId || '').toLowerCase().trim();
      const receiptAcc = (details.accountLastFour || '').trim();
      
      const savedSavingsUpi = (parsedBankSettings.savings_upi_id || '').toLowerCase().trim();
      const savedCurrentUpi = (parsedBankSettings.current_upi_id || '').toLowerCase().trim();
      const savedSavingsAcc = (parsedBankSettings.savings_account_last_four || '').trim();
      const savedCurrentAcc = (parsedBankSettings.current_account_last_four || '').trim();
      
      if (receiptUpi) {
        if ((savedSavingsUpi && receiptUpi.includes(savedSavingsUpi)) || 
            (savedCurrentUpi && receiptUpi.includes(savedCurrentUpi))) {
          isBankMatched = true;
        }
      }
      
      if (!isBankMatched && receiptAcc) {
        if ((savedSavingsAcc && receiptAcc.includes(savedSavingsAcc)) || 
            (savedCurrentAcc && receiptAcc.includes(savedCurrentAcc))) {
          isBankMatched = true;
        }
      }
    }

    res.json({
      success: true,
      data: {
        amount: details.amount,
        transactionId: details.transactionId,
        paymentTimestamp: details.paymentTimestamp,
        upiId: details.upiId,
        accountLastFour: details.accountLastFour,
        rawText: cleanJsonText, // Kept for debugging/compatibility
        isVerified: details.amount !== null && details.transactionId !== null && isBankMatched
      }
    });
  } catch (error) {
    console.error('OCR Extraction Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Extract application details from an uploaded image/PDF using Gemini
// @route   POST /api/ocr/extract-application
// @access  Private
const extractApplicationDetails = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No document provided for OCR.' });
    }

    const mimeType = req.file.mimetype;
    const base64Data = req.file.buffer.toString('base64');

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType
      },
    };

    const prompt = `You are an expert OCR AI that extracts application details from legal/government acknowledgment receipts (like Trademarks, Patents, Copyrights).
Extract the following information and return ONLY a valid JSON object with no markdown formatting or extra text:
{
  "applicationId": "<string or null>",
  "dateOfFiling": "<string or null>"
}

Ensure the Application ID (or Registration Number, Acknowledgement Number) is extracted accurately as a string.
Extract the date of filing or application date if visible.
If a field is not found, set it to null.`;

    const jsonText = await getWorkingKey(prompt, imagePart);
    
    // Parse the JSON (clean up markdown code blocks if the model ignored instructions)
    let cleanJsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    const details = JSON.parse(cleanJsonText);

    res.json({
      success: true,
      data: {
        applicationId: details.applicationId,
        dateOfFiling: details.dateOfFiling
      }
    });
  } catch (error) {
    console.error('OCR Application Extraction Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  extractPaymentDetails,
  extractApplicationDetails
};
