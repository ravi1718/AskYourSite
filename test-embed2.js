const fs = require('fs');

async function check() {
  try {
    const env = fs.readFileSync('.env', 'utf8');
    const key = env.match(/GEMINI_API_KEY=([^\s]+)/)[1];
    
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await res.json();
    
    if (data.models) {
      const embedModels = data.models.filter(m => m.supportedGenerationMethods.includes('embedContent'));
      console.log("Supported Models:");
      embedModels.forEach(m => console.log(m.name));
    } else {
      console.log("Error from API:", data);
    }
  } catch (e) {
    console.error("Script error:", e);
  }
}
check();
