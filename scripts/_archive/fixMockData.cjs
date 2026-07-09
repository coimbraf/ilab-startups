const fs = require('fs');
let code = fs.readFileSync('src/data/mockData.ts', 'utf8');
code = code.replace(/role: 'CEO'/g, "role: 'Negócios'");
code = code.replace(/role: 'CTO'/g, "role: 'Tech'");
code = code.replace(/role: 'PM'/g, "role: 'Negócios'");
code = code.replace(/role: 'CMO'/g, "role: 'Negócios'");
fs.writeFileSync('src/data/mockData.ts', code);
console.log('Fixed MemberRole in mockData.ts');
