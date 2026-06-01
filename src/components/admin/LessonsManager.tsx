import React, { useState, useEffect } from 'react';
import { useUI } from '../../contexts/UIContext';
import { supabase, getLessons, createLesson, deleteLesson, getCourses, createCourse, deleteCourse } from '../../data/supabaseService';
import { Lesson, Course } from '../../data/mockData';
import { ListVideo } from 'lucide-react';
import { BookOpen, Play, Edit, Trash2, Loader2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function LessonsManager() {
  const { toast, confirm } = useUI();

  const [activeTab, setActiveTab] = useState<'videos' | 'cursos'>('videos');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtube_url: '',
    type: 'gravacao' as 'gravacao' | 'externo',
    level: 'iniciante' as 'iniciante' | 'intermediario' | 'avancado',
    tags: ''
  });
  const [courseData, setCourseData] = useState({
    playlistUrl: '',
    level: 'iniciante' as 'iniciante' | 'intermediario' | 'avancado',
    bonusXp: 100,
    apiKey: ''
  });

  
  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLessons = async () => {
    setIsLoading(true);
    try {
      const data = await getLessons();
      setLessons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLessons();
    loadCourses();
  }, []);

  
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseData.apiKey) {
      toast('Insira a chave da API do YouTube', 'error');
      return;
    }
    setIsCreating(true);
    try {
      await createCourse(courseData.playlistUrl, courseData.level, courseData.bonusXp, courseData.apiKey);
      toast('Curso criado com sucesso!', 'success');
      setCourseData(prev => ({ ...prev, playlistUrl: '', bonusXp: 100 }));
      loadCourses();
    } catch (err: any) {
      console.error(err);
      toast('Erro ao criar curso: ' + err.message, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!await confirm('Excluir este curso e todos os episódios?')) return;
    try {
      await deleteCourse(id);
      loadCourses();
    } catch (err) {
      console.error(err);
      toast('Erro ao excluir.', 'error');
    }
  };

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      // Calculate XP automatically
      const xpMultipliers = { iniciante: 1, intermediario: 2, avancado: 3 };
      const xp = formData.type === 'externo' ? (20 * xpMultipliers[formData.level]) : 0; // standard 20 min base if no duration
      const ytId = extractYoutubeId(formData.youtube_url);

      await createLesson({
        title: formData.title,
        description: formData.description,
        type: formData.type,
        level: formData.level,
        youtube_id: ytId,
        duration: '0', // Will be calculated automatically via trigger/API
        xp,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
      });
      toast('Aula adicionada com sucesso!', 'success');
      setFormData({ title: '', description: '', youtube_url: '', type: 'gravacao', level: 'iniciante', tags: '' });
      loadLessons();
    } catch (err) {
      console.error(err);
      toast('Erro ao criar aula.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm('Excluir esta aula?')) return;
    try {
      await deleteLesson(id);
      loadLessons();
    } catch (err) {
      console.error(err);
      toast('Erro ao excluir aula.', 'error');
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

      
      <div className="flex gap-4 mb-6 border-b border-gray-100 pb-px">
        <button 
          onClick={() => setActiveTab('videos')}
          className={`pb-3 px-2 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'videos' ? 'text-fox border-b-2 border-fox' : 'text-gray-400 hover:text-navy'}`}
        >
          Vídeos Avulsos
        </button>
        <button 
          onClick={() => setActiveTab('cursos')}
          className={`pb-3 px-2 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'cursos' ? 'text-fox border-b-2 border-fox' : 'text-gray-400 hover:text-navy'}`}
        >
          Trilhas & Cursos
        </button>
      </div>

      {activeTab === 'videos' ? (
      <><form onSubmit={handleCreate} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Título *</label>
            <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-fox/20" placeholder="Ex: Masterclass Pitch" />
          </div>
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">URL do YouTube *</label>
            <input required value={formData.youtube_url} onChange={e => setFormData({ ...formData, youtube_url: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-fox/20" placeholder="Ex: https://youtube.com/watch?v=..." />
          </div>
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Tipo de Conteúdo *</label>
            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-fox/20 bg-white">
              <option value="gravacao">Gravação iLab (Sem XP)</option>
              <option value="externo">Conteúdo Externo (Com XP)</option>
            </select>
          </div>
          {formData.type === 'externo' && (
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Nível de Dificuldade</label>
              <select value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value as any })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-fox/20 bg-white">
                <option value="iniciante">Iniciante (1x)</option>
                <option value="intermediario">Intermediário (2x)</option>
                <option value="avancado">Avançado (3x)</option>
              </select>
            </div>
          )}
          <div className="md:col-span-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Tags (separadas por vírgula)</label>
            <input value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-fox/20" placeholder="Ex: mvp, pitch, captable" />
          </div>
          <div className="md:col-span-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Descrição</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-fox/20 resize-none" rows={2} placeholder="Breve resumo..." />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button type="submit" disabled={isCreating} className="bg-fox text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-fox/90 transition-colors disabled:opacity-50">
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Cadastrar Aula
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-fox animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lessons.map(lesson => (
            <div key={lesson.id} className="border border-gray-100 rounded-2xl p-4 flex gap-4 items-center bg-gray-50/50 hover:bg-white hover:border-gray-200 transition-colors group">
              <div className="w-24 h-16 bg-gray-200 rounded-xl overflow-hidden relative shrink-0">
                <img src={`https://img.youtube.com/vi/${lesson.youtube_id}/mqdefault.jpg`} alt="Thumbnail" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><Play className="w-6 h-6 text-white" /></div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-navy truncate">{lesson.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-fox bg-fox/10 px-2 py-0.5 rounded-md uppercase">
                    {lesson.type === 'externo' ? 'Conteúdo Externo' : 'Gravação iLab'}
                  </span>
                  {lesson.type === 'externo' && <span className="text-[10px] font-bold text-gold">+{lesson.xp} XP</span>}
                </div>
              </div>
              <button onClick={() => handleDelete(lesson.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {lessons.length === 0 && <p className="text-gray-400 text-sm py-4 md:col-span-2 text-center">Nenhuma aula cadastrada ainda.</p>}
        </div>
      )}

      </>
      ) : (
      <>
        <form onSubmit={handleCreateCourse} className="bg-fox/5 p-6 rounded-2xl border border-fox/10 mb-8 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-fox/70 block mb-1.5">URL da Playlist do YouTube *</label>
              <input required value={courseData.playlistUrl} onChange={e => setCourseData({ ...courseData, playlistUrl: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-fox/20 text-sm focus:ring-2 focus:ring-fox/40 bg-white" placeholder="Ex: https://youtube.com/playlist?list=..." />
              <p className="text-[10px] text-fox/60 mt-1">O sistema puxará título, descrição e episódios automaticamente.</p>
            </div>
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-fox/70 block mb-1.5">Nível de Dificuldade</label>
              <select value={courseData.level} onChange={e => setCourseData({ ...courseData, level: e.target.value as any })} className="w-full px-4 py-3 rounded-xl border border-fox/20 text-sm focus:ring-2 focus:ring-fox/40 bg-white">
                <option value="iniciante">Iniciante (1x XP)</option>
                <option value="intermediario">Intermediário (2x XP)</option>
                <option value="avancado">Avançado (3x XP)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-fox/70 block mb-1.5">XP Bônus (Conclusão Completa)</label>
              <input type="number" required value={courseData.bonusXp} onChange={e => setCourseData({ ...courseData, bonusXp: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl border border-fox/20 text-sm focus:ring-2 focus:ring-fox/40 bg-white" placeholder="Ex: 500" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-fox/70 block mb-1.5">Chave da API do YouTube (v3) *</label>
              <input type="password" required value={courseData.apiKey} onChange={e => setCourseData({ ...courseData, apiKey: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-fox/20 text-sm focus:ring-2 focus:ring-fox/40 bg-white" placeholder="AIzaSy..." />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={isCreating} className="bg-fox text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-fox/90 transition-colors disabled:opacity-50">
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListVideo className="w-4 h-4" />}
              Importar Playlist
            </button>
          </div>
        </form>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-fox animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map(course => (
              <div key={course.id} className="border border-gray-100 rounded-2xl p-4 flex gap-4 items-center bg-gray-50/50 hover:bg-white hover:border-gray-200 transition-colors group">
                <div className="w-16 h-16 bg-fox/10 rounded-xl flex items-center justify-center shrink-0">
                  <ListVideo className="w-8 h-8 text-fox" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-navy truncate">{course.title}</h4>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] font-bold text-gray-500">{course.episodes?.length || 0} episódios</span>
                    <span className="text-[10px] font-bold text-gold">Bônus: {course.bonus_xp} XP</span>
                  </div>
                </div>
                <button onClick={() => handleDeleteCourse(course.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {courses.length === 0 && <p className="text-gray-400 text-sm py-4 md:col-span-2 text-center">Nenhum curso cadastrado.</p>}
          </div>
        )}
      </>
      )}

    </div>
  );
}
