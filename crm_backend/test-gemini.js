const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGemini() {
  const key = process.env.GEMINI_API_KEY1;
  console.log('Testing with key starting with:', key.substring(0, 5));
  
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(['Hello, return a valid JSON array with one object containing {"status": "success"}']);
    const text = await result.response.text();
    console.log('Gemini Response:', text);
  } catch (error) {
    console.error('Gemini Error:', error.message);
  }
}

testGemini();
