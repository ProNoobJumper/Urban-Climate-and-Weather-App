require('dotenv').config();
const https = require('https');

const API_KEY = process.env.GEMINI_API_KEY;

console.log('Testing Gemini API with direct HTTP call...');
console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'MISSING');

const data = JSON.stringify({
  contents: [{
    parts: [{
      text: "Say 'Hello from Gemini' if you can read this."
    }]
  }]
});

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
    try {
      const parsed = JSON.parse(responseData);
      if (parsed.candidates && parsed.candidates[0]) {
        console.log('\n✅ SUCCESS! Gemini Response:');
        console.log(parsed.candidates[0].content.parts[0].text);
      } else if (parsed.error) {
        console.log('\n❌ API Error:', parsed.error.message);
      }
    } catch (e) {
      console.log('Could not parse response');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error);
});

req.write(data);
req.end();
