const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminPanel.tsx', 'utf8');

// 1. Add states
const stateOld = `  const [youtubeId, setYoutubeId] = useState('');
  const [duration, setDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);`;

const stateNew = `  const [youtubeId, setYoutubeId] = useState('');
  const [duration, setDuration] = useState('');
  const [type, setType] = useState<'gravacao' | 'externo'>('gravacao');
  const [level, setLevel] = useState('iniciante');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);`;

content = content.replace(stateOld, stateNew);

// 2. Update handleAdd
const handleAddOld = `    try {
      const fetchedDuration = await fetchYoutubeDuration(youtubeId);
      await createLesson({ title, description, youtube_id: youtubeId, duration: fetchedDuration || '' });
      setTitle('');
      setDescription('');
      setYoutubeId('');
      setDuration('');
      await loadLessons();`;

const handleAddNew = `    try {
      const fetchedDuration = await fetchYoutubeDuration(youtubeId);
      let calcXp = 0;
      
      if (type === 'externo' && fetchedDuration) {
        // Parse duration like "3m 42s"
        const minMatch = fetchedDuration.match(/(\\d+)m/);
        const minutes = minMatch ? parseInt(minMatch[1], 10) : 0;
        let multiplier = 1;
        if (level === 'intermediario') multiplier = 2;
        if (level === 'avancado') multiplier = 3;
        calcXp = minutes * multiplier;
      }
      
      const tags = tagsInput.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);

      await createLesson({ 
        title, 
        description, 
        youtube_id: youtubeId, 
        duration: fetchedDuration || '',
        type,
        level: type === 'externo' ? level : undefined,
        xp: calcXp,
        tags
      });
      
      setTitle('');
      setDescription('');
      setYoutubeId('');
      setDuration('');
      setTagsInput('');
      setType('gravacao');
      setLevel('iniciante');
      await loadLessons();`;

content = content.replace(handleAddOld, handleAddNew);

// 3. Update the Grid
const gridStartOld = `<div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="lg:col-span-2">`;

const gridStartNew = `<div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>`;

content = content.replace(gridStartOld, gridStartNew);

const gridRestOld = `<div className="lg:col-span-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">ID YouTube *</label>
          <input type="text" value={youtubeId} onChange={e => setYoutubeId(e.target.value)} placeholder="Ex: dQw4w9WgXcQ" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-fox/20 focus:border-fox outline-none" />
        </div>
        <div className="lg:col-span-3">
          <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Descrição Curta</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Resumo do que foi ensinado..." className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-fox/20 focus:border-fox outline-none" />
        </div>
        <div className="lg:col-span-1">
          <button`;

const gridRestNew = `<div>
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
        <div className="md:col-span-1">
          <button`;

content = content.replace(gridRestOld, gridRestNew);

fs.writeFileSync('src/pages/AdminPanel.tsx', content);
console.log('AdminPanel updated for Lesson fields');
