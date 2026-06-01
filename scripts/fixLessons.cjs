const fs = require('fs');
let code = fs.readFileSync('src/pages/Lessons.tsx', 'utf8');

code = code.replace(/\\\${/g, '${');
code = code.replace(/\\`/g, '`');

fs.writeFileSync('src/pages/Lessons.tsx', code);
console.log('Fixed escaping in Lessons.tsx');
