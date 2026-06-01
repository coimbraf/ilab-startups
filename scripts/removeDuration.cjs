const fs = require('fs');

let content = fs.readFileSync('src/pages/AdminPanel.tsx', 'utf8');

// 1. Remove the duration input div entirely
const durationDivRegex = /<div className="lg:col-span-1">\s*<label className="text-\[11px\] font-black uppercase tracking-widest text-gray-400 block mb-1\.5 flex items-center justify-between">Duração <span className="text-\[9px\] lowercase opacity-50 font-normal">Automático<\/span><\/label>\s*<input type="text" value={duration} readOnly[^>]+>\s*<\/div>/g;

content = content.replace(durationDivRegex, '');

// 2. Change Title and Youtube ID to col-span-2 so they fill the first row
content = content.replace(
  '<div className="lg:col-span-1">\r\n          <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Título *</label>',
  '<div className="lg:col-span-2">\r\n          <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Título *</label>'
);
content = content.replace(
  '<div className="lg:col-span-1">\n          <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Título *</label>',
  '<div className="lg:col-span-2">\n          <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Título *</label>'
);

content = content.replace(
  '<div className="lg:col-span-1">\r\n          <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">ID YouTube *</label>',
  '<div className="lg:col-span-2">\r\n          <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">ID YouTube *</label>'
);
content = content.replace(
  '<div className="lg:col-span-1">\n          <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">ID YouTube *</label>',
  '<div className="lg:col-span-2">\n          <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">ID YouTube *</label>'
);

// 3. Update handleAdd to not require duration
content = content.replace(
  "if (!title || !youtubeId || !duration) {\r\n      alert('Preencha os campos obrigatórios.');\r\n      return;\r\n    }",
  "if (!title || !youtubeId) {\r\n      alert('Preencha os campos obrigatórios.');\r\n      return;\r\n    }"
);
content = content.replace(
  "if (!title || !youtubeId || !duration) {\n      alert('Preencha os campos obrigatórios.');\n      return;\n    }",
  "if (!title || !youtubeId) {\n      alert('Preencha os campos obrigatórios.');\n      return;\n    }"
);

fs.writeFileSync('src/pages/AdminPanel.tsx', content);
console.log('Removed duration UI successfully.');
