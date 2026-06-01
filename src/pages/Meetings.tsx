import React, { useEffect, useState, useMemo } from 'react';
import { useUI } from '../contexts/UIContext';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarDays, Clock, MapPin, CheckCircle2, User, Plus, Pencil, Trash2, X, AlertCircle } from 'lucide-react';
import { getMeetings, createMeeting, updateMeeting, deleteMeeting } from '../data/supabaseService';
import { Meeting, MeetingStatus } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { GooeyFilter } from '../components/GooeyFilter';

export default function Meetings() {
  const { toast, confirm } = useUI();

  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Admin states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<MeetingStatus>('Em breve');
  const [guest, setGuest] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.role === 'admin';

  const loadMeetings = async () => {
    setIsLoading(true);
    try {
      const data = await getMeetings();
      setMeetings(data);
    } catch (err) {
      console.error('Error loading meetings', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadMeetings();
  }, []);

  const handleOpenModal = (meeting?: Meeting) => {
    if (meeting) {
      setEditingMeeting(meeting);
      setTitle(meeting.title);
      // Extrair YYYY-MM-DDThh:mm caso a data venha completa do banco
      const formattedDate = meeting.date.substring(0, 16);
      setDate(formattedDate);
      setDescription(meeting.description);
      setStatus(meeting.status);
      setGuest(meeting.guest || '');
    } else {
      setEditingMeeting(null);
      setTitle('');
      setDate('');
      setDescription('');
      setStatus('Em breve');
      setGuest('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMeeting(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !description) return;

    setIsSubmitting(true);
    try {
      const payload = { title, date: new Date(date).toISOString(), description, status, guest: guest.trim() || undefined };
      if (editingMeeting) {
        await updateMeeting(editingMeeting.id, payload);
      } else {
        await createMeeting(payload);
      }
      await loadMeetings();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving meeting', err);
      toast('Erro ao salvar o encontro.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm('Tem certeza que deseja deletar este encontro?')) return;
    try {
      await deleteMeeting(id);
      await loadMeetings();
    } catch (err) {
      console.error('Error deleting meeting', err);
      toast('Erro ao deletar encontro.', 'error');
    }
  };

  const getStatusConfig = (s: MeetingStatus) => {
    switch (s) {
      case 'Concluído': return { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2, ring: 'ring-emerald-500/30' };
      case 'Próximo': return { color: 'bg-fox text-white border-fox', icon: AlertCircle, ring: 'ring-fox/40 animate-pulse' };
      case 'Em breve': return { color: 'bg-brown/5 text-brown/60 border-brown/10', icon: Clock, ring: 'ring-brown/10' };
    }
  };

  return (
    <div className="w-full min-h-[calc(100dvh-5rem)] bg-[#FFFDF2] relative overflow-hidden">
      <GooeyFilter id="meetings-goo" strength={15} />
      
      {/* Background Decor */}
      <div className="absolute -left-32 top-0 w-[500px] h-[500px] bg-fox/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute right-0 bottom-0 w-[600px] h-[600px] bg-gold/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 py-16 relative z-10 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl sm:text-6xl font-bold font-playfair text-brown mb-4 tracking-tight leading-tight">
              Encontros <span className="text-fox italic">iLab</span>
            </h1>
            <p className="text-lg text-brown/65">
              Roadmap de mentorias, dinâmicas e avaliações do semestre.
            </p>
          </motion.div>
          
          {isAdmin && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => handleOpenModal()}
              className="group inline-flex items-center gap-2 bg-brown text-white px-6 py-3 rounded-full font-bold uppercase tracking-wider text-sm shadow-[0_8px_20px_rgba(42,22,23,0.3)] hover:shadow-[0_12px_28px_rgba(42,22,23,0.4)] hover:bg-brown/95 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              Novo Encontro
            </motion.button>
          )}
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-brown/10 via-brown/5 to-transparent -translate-x-1/2 rounded-full" />

          {isLoading ? (
            <div className="space-y-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/60 p-6 rounded-3xl border border-brown/5 skeleton h-40" />
              ))}
            </div>
          ) : meetings.length > 0 ? (
            <div className="space-y-8 md:space-y-16">
              {meetings.map((meeting, idx) => {
                const config = getStatusConfig(meeting.status);
                const Icon = config.icon;
                const isEven = idx % 2 === 0;
                
                return (
                  <motion.div
                    key={meeting.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "relative flex flex-col md:flex-row items-center gap-8 md:gap-16",
                      isEven ? "md:flex-row" : "md:flex-row-reverse"
                    )}
                  >
                    {/* Node central */}
                    <div className={cn("absolute left-6 md:left-1/2 top-8 md:top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-[6px] border-[#FFFDF2] shadow-[0_0_0_4px_var(--tw-ring-color)] flex items-center justify-center z-10", config.ring)}>
                      <div className={cn("w-3 h-3 rounded-full", meeting.status === 'Próximo' ? 'bg-fox' : meeting.status === 'Concluído' ? 'bg-emerald-500' : 'bg-brown/20')} />
                    </div>

                    {/* Content Card */}
                    <div className={cn(
                      "w-full md:w-1/2 pl-16 md:pl-0",
                      isEven ? "md:pr-16 md:text-right" : "md:pl-16 md:text-left"
                    )}>
                      <div className={cn(
                        "relative bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border shadow-lg transition-all",
                        meeting.status === 'Próximo' 
                          ? "border-fox/30 shadow-[0_16px_40px_rgba(255,107,0,0.15)] ring-1 ring-fox/20" 
                          : "border-white/60 shadow-[0_8px_32px_rgba(42,22,23,0.04)] hover:shadow-[0_12px_40px_rgba(42,22,23,0.08)]"
                      )}>
                        
                        <div className={cn("flex flex-wrap items-center gap-3 mb-4", isEven ? "md:justify-end" : "md:justify-start")}>
                          <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border", config.color)}>
                            <Icon className="w-3.5 h-3.5" />
                            {meeting.status}
                          </span>
                          <span className="text-sm font-bold text-brown/50 flex items-center gap-1.5">
                            <CalendarDays className="w-4 h-4" />
                            {new Date(meeting.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <h3 className={cn("text-2xl font-bold font-playfair mb-3 leading-tight", meeting.status === 'Próximo' ? "text-fox" : "text-brown")}>
                          {meeting.title}
                        </h3>
                        
                        <p className="text-brown/70 leading-relaxed mb-6">
                          {meeting.description}
                        </p>

                        <div className={cn("flex flex-wrap gap-3", isEven ? "md:justify-end" : "justify-start")}>
                          {meeting.location && (
                            <div className="inline-flex items-center gap-2 bg-brown/5 px-4 py-2 rounded-xl border border-brown/5">
                              <MapPin className="w-4 h-4 text-fox" />
                              <span className="text-sm font-bold text-brown">Local: <span className="font-medium text-brown/70">{meeting.location}</span></span>
                            </div>
                          )}
                          {meeting.guest && (
                            <div className="inline-flex items-center gap-2 bg-brown/5 px-4 py-2 rounded-xl border border-brown/5">
                              <User className="w-4 h-4 text-gold" />
                              <span className="text-sm font-bold text-brown">Convidado: <span className="font-medium text-brown/70">{meeting.guest}</span></span>
                            </div>
                          )}
                        </div>

                        {isAdmin && (
                          <div className={cn("flex items-center gap-2 mt-6 pt-6 border-t border-brown/5", isEven ? "md:justify-end" : "md:justify-start")}>
                            <button onClick={() => handleOpenModal(meeting)} className="p-2 text-brown/40 hover:text-fox hover:bg-fox/10 rounded-full transition-colors" title="Editar">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(meeting.id)} className="p-2 text-brown/40 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Deletar">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Empty space for the other side of timeline */}
                    <div className="hidden md:block md:w-1/2" />
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white/50 border border-brown/5 rounded-3xl p-16 text-center max-w-2xl mx-auto ml-16 md:ml-auto relative z-10">
              <CalendarDays className="w-12 h-12 text-brown/20 mx-auto mb-4" />
              <h3 className="text-xl font-playfair font-bold text-brown mb-2">Nenhum encontro programado</h3>
              <p className="text-brown/50">Os eventos do semestre aparecerão aqui em breve.</p>
            </div>
          )}
        </div>
      </div>

      {/* Admin Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brown/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#FFFDF2] rounded-3xl w-full max-w-2xl max-h-[90dvh] overflow-y-auto shadow-2xl border border-white/20"
            >
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-playfair font-bold text-brown">{editingMeeting ? 'Editar Encontro' : 'Novo Encontro'}</h2>
                  <button onClick={handleCloseModal} className="w-10 h-10 rounded-full bg-brown/5 flex items-center justify-center text-brown/50 hover:text-brown hover:bg-brown/10 transition-colors">
                    <X className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-brown/50 uppercase tracking-widest mb-1.5">Título do Encontro</label>
                      <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white border border-brown/10 rounded-xl px-4 py-3 text-brown focus:ring-2 focus:ring-brown/20 focus:border-brown outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brown/50 uppercase tracking-widest mb-1.5">Data e Hora</label>
                      <input type="datetime-local" required value={date} onChange={e => setDate(e.target.value)} className="w-full bg-white border border-brown/10 rounded-xl px-4 py-3 text-brown focus:ring-2 focus:ring-brown/20 focus:border-brown outline-none transition-all" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brown/50 uppercase tracking-widest mb-1.5">Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value as MeetingStatus)} className="w-full bg-white border border-brown/10 rounded-xl px-4 py-3 text-brown font-semibold focus:ring-2 focus:ring-brown/20 focus:border-brown outline-none transition-all cursor-pointer">
                      <option value="Em breve">Em breve</option>
                      <option value="Próximo">Próximo (Destaque)</option>
                      <option value="Concluído">Concluído</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brown/50 uppercase tracking-widest mb-1.5">Convidado (Opcional)</label>
                    <input type="text" value={guest} onChange={e => setGuest(e.target.value)} placeholder="Ex: João Silva - CEO da Empresa X" className="w-full bg-white border border-brown/10 rounded-xl px-4 py-3 text-brown focus:ring-2 focus:ring-brown/20 focus:border-brown outline-none transition-all" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brown/50 uppercase tracking-widest mb-1.5">Descrição</label>
                    <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full bg-white border border-brown/10 rounded-xl p-4 text-brown focus:ring-2 focus:ring-brown/20 focus:border-brown outline-none resize-none transition-all" />
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4 border-t border-brown/5 mt-6">
                    <button type="button" onClick={handleCloseModal} className="px-6 py-2.5 rounded-full font-bold uppercase tracking-wider text-xs text-brown/60 hover:text-brown hover:bg-brown/5 transition-all">Cancelar</button>
                    <button type="submit" disabled={isSubmitting || !title || !date || !description} className="bg-brown text-white px-8 py-2.5 rounded-full font-bold uppercase tracking-wider text-xs shadow-lg hover:shadow-[0_8px_20px_rgba(42,22,23,0.4)] hover:bg-brown/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      {isSubmitting ? 'Salvando...' : 'Salvar Encontro'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
