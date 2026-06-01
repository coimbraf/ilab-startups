const fs = require('fs');

const logs = fs.readFileSync('C:/Users/biasi/.gemini/antigravity/brain/17b7d2b4-6d3b-4039-9122-94f0160290e2/.system_generated/logs/overview.txt', 'utf8');

// The overview.txt contains json objects separated by newlines
const lines = logs.split('\n');
let bestContent = '';

for (const line of lines) {
  try {
    const parsed = JSON.parse(line);
    if (parsed.tool_calls) {
      for (const tc of parsed.tool_calls) {
        if (tc.name === 'write_to_file' || tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
           const args = JSON.stringify(tc.args);
           if (args.includes('function LessonsManager') && args.length > bestContent.length) {
              bestContent = args;
           }
        }
      }
    }
  } catch(e) {}
}

if (bestContent) {
   // write exactly the best content JSON structure so we can parse it
   fs.writeFileSync('temp_extracted.json', bestContent);
   console.log('Saved best json!');
} else {
   console.log('Not found');
}
