const { GoogleGenerativeAI } = require('@google/generative-ai');

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

    res.json({
      success: true,
      data: {
        amount: details.amount,
        transactionId: details.transactionId,
        paymentTimestamp: details.paymentTimestamp,
        upiId: details.upiId,
        accountLastFour: details.accountLastFour,
        rawText: cleanJsonText, // Kept for debugging/compatibility
        isVerified: details.amount !== null && details.transactionId !== null
      }
    });
  } catch (error) {
    console.error('OCR Extraction Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  extractPaymentDetails
};
