require('dotenv').config();
const https = require('https');

const API_KEY = process.env.GEMINI_API_KEY;

console.log('Listing available Gemini models (full output)...\n');

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models?key=${API_KEY}`,
  method: 'GET'
};

const req = https.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(responseData);
      if (parsed.models) {
        console.log('Available Models for Text Generation:\n');
        parsed.models
          .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
          .forEach(model => {
            console.log(`✓ ${model.name}`);
            console.log(`  Display Name: ${model.displayName}`);
            console.log(`  Methods: ${model.supportedGenerationMethods.join(', ')}`);
            console.log('');
          });
      } else {
        console.log('Full Response:', JSON.stringify(parsed, null, 2));
      }
    } catch (e) {
      console.log('Raw Response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();
