const https = require('https');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  const envPath2 = path.join(__dirname, '.env');
  let data = '';
  if (fs.existsSync(envPath)) data += '\n' + fs.readFileSync(envPath, 'utf8');
  if (fs.existsSync(envPath2)) data += '\n' + fs.readFileSync(envPath2, 'utf8');
  
  const match = data.match(/GEMINI_API_KEY=([^\s]+)/);
  return match ? match[1] : null;
}

const key = process.env.GEMINI_API_KEY || loadEnv();
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

https.get(url, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      console.log("Full Response from Google API:");
      if (parsed.models) {
        parsed.models.forEach(m => console.log(m.name, m.supportedGenerationMethods));
      } else {
        console.log(parsed);
      }
    } catch(e) {
      console.log("Parse error:", e);
    }
  });
}).on('error', e => console.error(e));
