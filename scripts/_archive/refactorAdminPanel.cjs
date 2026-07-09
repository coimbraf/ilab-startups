const fs = require('fs');

const code = fs.readFileSync('src/pages/AdminPanel.tsx', 'utf8');

// Find the start of AdminPanel
const adminPanelStart = code.indexOf('export default function AdminPanel() {');

if (adminPanelStart === -1) {
  console.log("Could not find AdminPanel");
  process.exit(1);
}

// Find the end of AdminPanel
// We know AdminPanel ends right before "// ─── Modal Cadastro"
const createStartupModalIndex = code.indexOf('// ─── Modal Cadastro');
// The actual end of AdminPanel is the } before CreateStartupModal.
// We can find the `export default function AdminPanel() { ... }` body.
// The easiest way is to split the file.
let beforeAdminPanel = code.substring(0, adminPanelStart);
let adminPanelBodyAndAfter = code.substring(adminPanelStart);

// We need to parse where AdminPanel ends.
// AdminPanel has:
//       </AnimatePresence>
//     </div>
//   );
// }
//
// // ─── Modal Cadastro
const endOfAdminPanelStr = `
    </div>
  );
}`;

const adminPanelEnd = adminPanelBodyAndAfter.indexOf(endOfAdminPanelStr) + endOfAdminPanelStr.length;

let oldAdminPanel = adminPanelBodyAndAfter.substring(0, adminPanelEnd);
let afterAdminPanel = adminPanelBodyAndAfter.substring(adminPanelEnd);

// Let's modify oldAdminPanel to become ApprovalsManager
// Remove "export default function AdminPanel() {" and replace with "function ApprovalsManager() {"
let approvalsManager = oldAdminPanel.replace('export default function AdminPanel() {', 'function ApprovalsManager() {');

// Remove the Guard
const guardRegex = /\/\/ Guard: apenas admin acessa[\s\S]*?if\s*\(user\?\.role\s*!==\s*'admin'\)\s*\{[\s\S]*?\s*\}\s*\}/;
approvalsManager = approvalsManager.replace(guardRegex, '');

// The old AdminPanel returned:
// return (
//   <div className="min-h-screen bg-gray-50 pb-24 pt-20">
//     <div className="bg-white border-b border-gray-100 mb-8 pt-8 pb-8">...</div>
//     <div className="container mx-auto px-4">...</div>
//     <div className="container mx-auto px-4 mt-16 space-y-16">
//       <SquadInviteManager />
//       <InviteManager />
//       <LessonsManager />
//     </div>
//     ... modals
//   </div>
// )

// We will just let ApprovalsManager return its content. We should remove the <SquadInviteManager />, <InviteManager />, <LessonsManager /> from its return.
approvalsManager = approvalsManager.replace(
  /<div className="container mx-auto px-4 mt-16 space-y-16">[\s\S]*?<LessonsManager \/>[\s\S]*?<\/div>/,
  ''
);

// We'll replace the outer min-h-screen wrapper with a simpler wrapper or just keep it as is, since it will be inside a <main> tag.
approvalsManager = approvalsManager.replace(
  /<div className="min-h-screen bg-gray-50 pb-24 pt-20">/,
  '<div className="pb-12">'
);

const newAdminPanel = `

function OverviewManager() {
  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col items-center justify-center text-center h-64">
      <div className="bg-fox/10 p-4 rounded-full mb-4">
        <PieChart className="w-8 h-8 text-fox" />
      </div>
      <h3 className="text-xl font-bold text-navy mb-2">Visão Geral</h3>
      <p className="text-gray-500 text-sm">O dashboard de métricas está em desenvolvimento.</p>
    </div>
  );
}

function SquadsManager() {
  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col items-center justify-center text-center h-64">
      <div className="bg-fox/10 p-4 rounded-full mb-4">
        <Users className="w-8 h-8 text-fox" />
      </div>
      <h3 className="text-xl font-bold text-navy mb-2">Gestão de Squads</h3>
      <p className="text-gray-500 text-sm">O módulo de gestão de squads está em desenvolvimento.</p>
    </div>
  );
}

function MembersManager() {
  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col items-center justify-center text-center h-64">
      <div className="bg-fox/10 p-4 rounded-full mb-4">
        <UserCircle className="w-8 h-8 text-fox" />
      </div>
      <h3 className="text-xl font-bold text-navy mb-2">Gestão de Membros</h3>
      <p className="text-gray-500 text-sm">O módulo de membros está em desenvolvimento.</p>
    </div>
  );
}

function MeetingsManagerPlaceholder() {
  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col items-center justify-center text-center h-64">
      <div className="bg-fox/10 p-4 rounded-full mb-4">
        <Calendar className="w-8 h-8 text-fox" />
      </div>
      <h3 className="text-xl font-bold text-navy mb-2">Gestão de Encontros</h3>
      <p className="text-gray-500 text-sm">O módulo de encontros está em desenvolvimento.</p>
    </div>
  );
}

export default function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'geral' | 'aprovacoes' | 'squads' | 'membros' | 'convites' | 'academy' | 'encontros'>('aprovacoes');

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen pt-[5rem] flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold font-playfair text-navy mb-2">Acesso Restrito</h2>
          <p className="text-gray-500">Apenas coordenadores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'geral': return <OverviewManager />;
      case 'aprovacoes': return <ApprovalsManager />;
      case 'squads': return <SquadsManager />;
      case 'membros': return <MembersManager />;
      case 'convites': return (
        <div className="space-y-8">
          <SquadInviteManager />
          <InviteManager />
        </div>
      );
      case 'academy': return <LessonsManager />;
      case 'encontros': return <MeetingsManagerPlaceholder />;
      default: return <ApprovalsManager />;
    }
  };

  const tabs = [
    { id: 'geral', label: 'Visão Geral', icon: PieChart },
    { id: 'aprovacoes', label: 'Aprovações', icon: CheckSquare },
    { id: 'squads', label: 'Squads', icon: Users },
    { id: 'membros', label: 'Membros', icon: UserCircle },
    { id: 'convites', label: 'Convites', icon: LinkIcon },
    { id: 'academy', label: 'iLab Academy', icon: BookOpen },
    { id: 'encontros', label: 'Encontros', icon: Calendar }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 pt-[5rem] flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white border-r border-gray-100 flex-shrink-0 flex flex-col md:min-h-[calc(100vh-5rem)] p-4 md:p-6 sticky top-[5rem]">
        <h2 className="font-playfair font-bold text-navy text-xl mb-6 hidden md:block px-4">Admin Panel</h2>
        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap",
                  isActive 
                    ? "bg-fox text-white shadow-md" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-navy"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>
      
      <main className="flex-1 md:overflow-y-auto">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

`;

// Add imports for icons
let newImports = beforeAdminPanel.replace(
  /import \{([^}]+)\} from 'lucide-react';/,
  (match, p1) => {
    const icons = p1.split(',').map(i => i.trim());
    const needed = ['PieChart', 'CheckSquare', 'UserCircle', 'Link as LinkIcon', 'Calendar'];
    needed.forEach(n => {
      if (!icons.includes(n)) {
        icons.push(n);
      }
    });
    return `import { ${icons.join(', ')} } from 'lucide-react';`;
  }
);

fs.writeFileSync('src/pages/AdminPanel.tsx', newImports + approvalsManager + newAdminPanel + afterAdminPanel);
console.log('Done!');
