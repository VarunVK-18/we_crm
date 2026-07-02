const { GoogleGenerativeAI } = require('@google/generative-ai');

async function parseComplianceCalendarToJSON(pdfText) {
  const keys = [
    process.env.GEMINI_API_KEY1,
    process.env.GEMINI_API_KEY2,
    process.env.GEMINI_API_KEY3
  ].filter(Boolean);

  if (keys.length === 0) {
    throw new Error('No Gemini API keys found in environment variables.');
  }

  const prompt = `You are a data extraction assistant. Parse the following text extracted from a Compliance Calendar PDF and convert it into a structured JSON array.
The text contains a list of compliance events/deadlines. For each event, extract:
- dueDate: The due date or deadline for the compliance (e.g., "15th May 2026", "Monthly on 7th")
- title: The main title or name of the compliance
- description: A short description of what needs to be filed or paid
- category: The category (e.g., "GST", "Income Tax", "ROC", "PF/ESI", "Labour Law", etc.)
- formsOrSections: The form names or sections applicable (e.g., "GSTR-3B", "ITR-1")
- applicableTo: Who this is applicable to (e.g., "All Taxpayers", "Private Limited Companies")

IMPORTANT: You must return ONLY valid JSON and nothing else. Do not include markdown code block syntax like \`\`\`json. Just return the raw JSON object.
Format the output as a JSON object containing a single array called "events", like this:
{
  "events": [
    {
      "dueDate": "...",
      "title": "...",
      "description": "...",
      "category": "...",
      "formsOrSections": "...",
      "applicableTo": "..."
    }
  ]
}

Here is the PDF text:
${pdfText.substring(0, 30000)}
`;

  let lastError = null;

  for (const key of keys) {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let responseText = response.text();

      // Clean up markdown wrapping if present
      responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

      const parsedJSON = JSON.parse(responseText);
      
      if (!parsedJSON || !parsedJSON.events || !Array.isArray(parsedJSON.events)) {
        throw new Error('Invalid JSON structure returned by Gemini');
      }

      return parsedJSON.events;
    } catch (error) {
      console.warn(`Gemini key failed in compliance parser, trying next... Error: ${error.message}`);
      lastError = error;
    }
  }

  console.error("Gemini AI Parsing failed for all keys:", lastError);
  throw lastError;
}

module.exports = { parseComplianceCalendarToJSON };
