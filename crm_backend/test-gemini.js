require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
async function run() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY1);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
    const result = await model.generateContent("Say hi.");
    console.log(await result.response.text());
  } catch (err) {
    console.error("Error:", err.message);
  }
}
run();
