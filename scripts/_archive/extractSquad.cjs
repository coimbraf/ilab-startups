const fs = require('fs');
const code = fs.readFileSync('src/pages/AdminPanel.tsx', 'utf8');
const start = code.indexOf('function SquadInviteManager');
if (start !== -1) {
  let extract = code.substring(start);
  const imports = `import React, { useState, useEffect } from 'react';
import { getAvailableFounders, inviteUserToStartup, getFoundersByStartup, unlinkFounderFromStartup, linkFounderToStartup } from '../../data/supabaseService';
import { useStartups } from '../../hooks/useStartups';
import { UserPlus, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

`;
  fs.writeFileSync('src/components/admin/SquadInviteManager.tsx', imports + 'export default ' + extract);
  console.log('Saved SquadInviteManager');
  
  // Remove it from AdminPanel
  const newCode = code.substring(0, start);
  fs.writeFileSync('src/pages/AdminPanel.tsx', newCode);
}
