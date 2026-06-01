const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminPanel.tsx', 'utf8');

const replacement = `  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-8 mb-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-fox/10 p-3 rounded-2xl">
          <BookOpen className="w-6 h-6 text-fox" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-playfair text-navy">iLab Academy</h2>
          <p className="text-sm text-gray-500">Adicione e gerencie os vídeos disponíveis para os founders.</p>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Título *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Masterclass Vendas" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-fox/20 focus:border-fox outline-none" />
          </div>
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">ID YouTube *</label>
            <input type="text" value={youtubeId} onChange={e => setYoutubeId(e.target.value)} placeholder="Ex: dQw4w9WgXcQ" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-fox/20 focus:border-fox outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Tipo de Conteúdo</label>
            <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-fox/20 focus:border-fox outline-none">
              <option value="gravacao">Gravação iLab</option>
              <option value="externo">Conteúdo Externo</option>
            </select>
          </div>
          {type === 'externo' && (
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Nível de XP</label>
              <select value={level} onChange={e => setLevel(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-fox/20 focus:border-fox outline-none">
                <option value="iniciante">Iniciante (1x)</option>
                <option value="intermediario">Intermediário (2x)</option>
                <option value="avancado">Avançado (3x)</option>
              </select>
            </div>
          )}
          <div className={type === 'gravacao' ? 'md:col-span-2' : ''}>
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Tags (vírgula)</label>
            <input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="Ex: mvp, pitch" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-fox/20 focus:border-fox outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-3">
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Descrição Curta</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Resumo do que foi ensinado..." className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-fox/20 focus:border-fox outline-none" />
          </div>
          <div className="lg:col-span-1">
            <button
              onClick={handleAdd}
              disabled={isSubmitting}
              className="w-full bg-navy text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-navy/90 active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSubmitting ? 'Adicionando...' : <><Plus className="w-4 h-4" /> Adicionar</>}
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-navy mb-4">Aulas Disponíveis</h3>
        {isLoading ? (
          <p className="text-sm text-gray-400">Carregando...</p>
        ) : lessons.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma aula adicionada.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {lessons.map(lesson => (
              <div key={lesson.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <div className="relative aspect-video bg-gray-900">
                  <img src={\`https://img.youtube.com/vi/\${lesson.youtube_id}/mqdefault.jpg\`} alt={lesson.title} className="w-full h-full object-cover opacity-80" />
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded">
                    {lesson.duration}
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h4 className="font-bold text-navy mb-1 line-clamp-2">{lesson.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-1">{lesson.description}</p>
                  <button
                    onClick={() => handleDelete(lesson.id)}
                    className="self-end text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
// ─── Gerenciador de Squad Invites ────────────────────────────────────────────`;

const startIdx = content.indexOf('  return (\n    <div className="bg-white border border-gray-100 rounded-3xl p-8 mb-8">\n      <div className="flex items-center gap-3 mb-8">\n        <div className="bg-fox/10 p-3 rounded-2xl">\n          <BookOpen');
const endIdx = content.indexOf('// ─── Gerenciador de Squad Invites ────────────────────────────────────────────');

if (startIdx !== -1 && endIdx !== -1) {
  const newContent = content.substring(0, startIdx) + replacement + content.substring(endIdx + 81);
  fs.writeFileSync('src/pages/AdminPanel.tsx', newContent);
  console.log('Fixed JSX properly!');
} else {
  console.log('Could not find boundaries.');
}
