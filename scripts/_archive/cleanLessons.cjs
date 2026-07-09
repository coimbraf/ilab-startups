const fs = require('fs');
let code = fs.readFileSync('temp_lessons.txt', 'utf8');

// The code currently is a single line string containing literal "\n", so let's unescape it
try {
  code = JSON.parse(code); // since it's already a JSON string from temp_lessons.txt?
} catch(e) {
  // if it's not a JSON string, just replace literal \n
  code = code.replace(/\\n/g, '\n').replace(/\\"/g, '"');
}

fs.writeFileSync('temp_lessons_clean.txt', code);
console.log('Saved temp_lessons_clean.txt!');
