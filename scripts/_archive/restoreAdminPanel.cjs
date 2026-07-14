const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminPanel.tsx', 'utf8');

const codeToInsert = `function LessonsManager() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  const [duration, setDuration] = useState('');
  const [type, setType] = useState<'gravacao' | 'externo'>('gravacao');
  const [level, setLevel] = useState('iniciante');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadLessons = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getLessons();
      setLessons(data);
    } catch (err) {
      console.error('Failed to load lessons', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  const handleAdd = async () => {
    if (!title || !youtubeId) {
      alert('Preencha os campos obrigatórios.');
      return;
    }
    setIsSubmitting(true);
    try {
      const fetchedDuration = await fetchYoutubeDuration(youtubeId);
      
      let calcXp = 0;
      if (type === 'externo' && fetchedDuration) {
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
      setType('gravacao');
      setLevel('iniciante');
      setTagsInput('');
      await loadLessons();
    } catch (err) {
      console.error('Failed to add lesson', err);
      alert('Erro ao adicionar aula.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar esta aula?')) return;
    try {
      await deleteLesson(id);
      await loadLessons();
    } catch (err) {
      console.error('Failed to delete lesson', err);
      alert('Erro ao deletar aula.');
    }
  };

  return (
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
`;

const lines = content.split('\n');
const insertIndex = lines.findIndex(l => l.includes('<label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Descrição Curta</label>'));

const newLines = [
  ...lines.slice(0, insertIndex),
  codeToInsert,
  ...lines.slice(insertIndex)
];

fs.writeFileSync('src/pages/AdminPanel.tsx', newLines.join('\n').replace(/\n\n/g, '\n'));
console.log('Restored AdminPanel.tsx correctly.');
