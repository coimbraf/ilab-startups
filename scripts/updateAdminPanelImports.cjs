const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminPanel.tsx', 'utf8');

const imports = `import CreateStartupModal from '../components/admin/CreateStartupModal';
import InviteManager from '../components/admin/InviteManager';
import LessonsManager from '../components/admin/LessonsManager';
import SquadInviteManager from '../components/admin/SquadInviteManager';
`;

// Find the last import and add them after
const lastImportIndex = code.lastIndexOf('import ');
const nextNewline = code.indexOf('\n', lastImportIndex);

code = code.substring(0, nextNewline + 1) + imports + code.substring(nextNewline + 1);

// Let's also remove `// ─── Gerenciador de Squad Invites ────────────────────────────────────────────` at the end
code = code.replace(/\/\/ ─── Gerenciador de Squad Invites ────────────────────────────────────────────[\s\S]*$/, '');

fs.writeFileSync('src/pages/AdminPanel.tsx', code);
console.log('Updated AdminPanel imports!');
