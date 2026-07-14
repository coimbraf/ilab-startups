const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminPanel.tsx', 'utf8');

// Update SquadInviteManager option
content = content.replace(
  'ID: {f.id.substring(0,8)}... (Verifique o email dele)',
  '{f.name || f.email || f.id.substring(0,8)}'
);

// Update CreateStartupModal option
content = content.replace(
  'ID: {f.id.substring(0,8)}... (Confirme o email)',
  '{f.name || f.email || f.id.substring(0,8)}'
);

// Update SquadInviteManager linked founders list
content = content.replace(
  '<span className="text-xs font-mono text-gray-600 truncate mr-2">ID: {lf.id.substring(0,12)}...</span>',
  '<span className="text-xs font-bold text-gray-700 truncate mr-2">{lf.name || lf.id.substring(0,12)}</span>'
);

fs.writeFileSync('src/pages/AdminPanel.tsx', content);
console.log("AdminPanel updated to show names.");
