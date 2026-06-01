const fs = require('fs');
const logs = fs.readFileSync('C:/Users/biasi/.gemini/antigravity/brain/17b7d2b4-6d3b-4039-9122-94f0160290e2/.system_generated/logs/overview.txt', 'utf8');

const regex = /function InviteManager\(\) \{[\s\S]*?export default function AdminPanel/g;
let match;
let lastMatch = null;
while ((match = regex.exec(logs)) !== null) {
  lastMatch = match[0];
}

if (lastMatch) {
  // It's still in json string form inside the log file, so let's try evaluating it or just replacing literal \n
  const code = lastMatch
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
    
  fs.writeFileSync('temp_extracted.txt', code);
  console.log('Saved to temp_extracted.txt!');
} else {
  console.log('not found');
}
