const fs = require('fs');

let content = fs.readFileSync('src/pages/AdminPanel.tsx', 'utf8');

const target1 = '<label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Duração *</label>';
const target2 = '<input type="text" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Ex: 45 min" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-fox/20 focus:border-fox outline-none" />';

const replace1 = '<label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5 flex items-center justify-between">Duração <span className="text-[9px] lowercase opacity-50 font-normal">Automático</span></label>';
const replace2 = '<input type="text" value={duration} readOnly placeholder={youtubeId.length === 11 && !duration ? "Calculando..." : "Preenchido sozinho"} className="w-full px-4 py-3 bg-gray-100 text-gray-500 border border-gray-200 rounded-xl text-sm cursor-not-allowed outline-none" />';

content = content.replace(target1, replace1);
content = content.replace(target2, replace2);

fs.writeFileSync('src/pages/AdminPanel.tsx', content);
console.log('Fixed duration field!');
