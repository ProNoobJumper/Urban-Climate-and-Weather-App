require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  console.log('Testing Gemini Connection...');
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is missing from .env');
    return;
  }
  
  console.log('✅ GEMINI_API_KEY found (length: ' + process.env.GEMINI_API_KEY.length + ')');

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = 'Say "Hello from Gemini" if you can read this.';
    console.log('Sending prompt...');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini Response:', text);
  } catch (error) {
    console.error('❌ Gemini Error:', error.message);
    if (error.response) {
      console.error('Error details:', JSON.stringify(error.response));
    }
    
    // Try listing models
    try {
      console.log('Listing available models...');
      // Note: listModels is not directly on genAI instance in some versions, 
      // but let's try to see if we can get a clearer error or use a different model.
      const modelPro = genAI.getGenerativeModel({ model: 'gemini-pro' });
      console.log('Retrying with gemini-pro...');
      const result = await modelPro.generateContent('Hello');
      console.log('✅ gemini-pro worked!');
    } catch (e) {
      console.error('❌ gemini-pro also failed:', e.message);
    }
  }
}

testGemini();
