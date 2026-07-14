const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminPanel.tsx', 'utf8');

// 1. Interface MemberInput
content = content.replace(
  'interface MemberInput {\r\n  name: string;\r\n  role: MemberRole;\r\n  customRole: string;\r\n  isLeader: boolean;\r\n}',
  'interface MemberInput {\r\n  name: string;\r\n  role: MemberRole;\r\n  customRole: string;\r\n  isLeader: boolean;\r\n  userId?: string;\r\n}'
);

content = content.replace(
  'interface MemberInput {\n  name: string;\n  role: MemberRole;\n  customRole: string;\n  isLeader: boolean;\n}',
  'interface MemberInput {\n  name: string;\n  role: MemberRole;\n  customRole: string;\n  isLeader: boolean;\n  userId?: string;\n}'
);

// 2. setMembers init
content = content.replace(
  '{ name: \'\', role: \'CEO\', customRole: \'\', isLeader: true }',
  '{ name: \'\', role: \'CEO\', customRole: \'\', isLeader: true, userId: \'\' }'
);

// 3. addMember
content = content.replace(
  '{ name: \'\', role: \'Outro\', customRole: \'\', isLeader: false }',
  '{ name: \'\', role: \'Outro\', customRole: \'\', isLeader: false, userId: \'\' }'
);

// 4. formState
content = content.replace(
  '  const [formError, setFormError] = useState(\'\');',
  '  const [formError, setFormError] = useState(\'\');\n  const [availableFounders, setAvailableFounders] = useState<any[]>([]);\n\n  useEffect(() => {\n    getAvailableFounders().then(setAvailableFounders);\n  }, []);'
);

// 5. upsert loop
content = content.replace(
  '          isLeader: member.isLeader,\n        });\n      }',
  '          isLeader: member.isLeader,\n        });\n        if (member.userId) {\n          await linkFounderToStartup(member.userId, startupId);\n        }\n      }'
);
content = content.replace(
  '          isLeader: member.isLeader,\r\n        });\r\n      }',
  '          isLeader: member.isLeader,\r\n        });\r\n        if (member.userId) {\r\n          await linkFounderToStartup(member.userId, startupId);\r\n        }\r\n      }'
);

// 6. Select
const selectTargetLF = '                    {members.length > 1 && (\n                      <button onClick={() => removeMember(i)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">\n                        <Trash2 className="w-4 h-4" />\n                      </button>\n                    )}\n                  </div>';
const selectTargetCRLF = selectTargetLF.replace(/\n/g, '\r\n');

const selectReplaceLF = selectTargetLF + '\n\n                  <select\n                    value={member.userId || \'\'}\n                    onChange={e => updateMember(i, \'userId\', e.target.value)}\n                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-fox/20 focus:border-fox outline-none text-gray-500 mt-2"\n                  >\n                    <option value="">Vincular usuário da plataforma (Opcional)...</option>\n                    {availableFounders.map(f => (\n                      <option key={f.id} value={f.id}>\n                        ID: {f.id.substring(0,8)}... (Confirme o email)\n                      </option>\n                    ))}\n                  </select>';
const selectReplaceCRLF = selectReplaceLF.replace(/\n/g, '\r\n');

content = content.replace(selectTargetLF, selectReplaceLF);
content = content.replace(selectTargetCRLF, selectReplaceCRLF);

fs.writeFileSync('src/pages/AdminPanel.tsx', content);
console.log("File updated successfully.");
