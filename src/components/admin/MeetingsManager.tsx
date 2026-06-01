import React, { useState, useEffect } from 'react';
import { useUI } from '../../contexts/UIContext';
import { supabase, getMeetings, createMeeting, updateMeeting, deleteMeeting, getFounders, getMeetingPresences, markMeetingPresence } from '../../data/supabaseService';
import { Meeting } from '../../data/mockData';
import { Calendar, Plus, Edit, Trash2, Loader2, CheckCircle, Clock, Users, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export default function MeetingsManager() {
  const { toast, confirm } = useUI();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [presenceModalId, setPresenceModalId] = useState<string | null>(null);
  const [founders, setFounders] = useState<any[]>([]);
  const [presences, setPresences] = useState<Set<string>>(new Set());
  const [isPresenceLoading, setIsPresenceLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    description: '',
    guest: '',
    location: '',
    status: 'Próximo' as Meeting['status']
  });

  const loadMeetings = async () => {
    setIsLoading(true);
    try {
      const data = await getMeetings();
      setMeetings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      if (editingId) {
        await updateMeeting(editingId, formData);
        toast('Encontro atualizado!', 'info');
      } else {
        await createMeeting(formData);
        toast('Encontro criado com sucesso!', 'success');
      }
      setFormData({ title: '', date: '', description: '', guest: '', location: '', status: 'Próximo' });
      setEditingId(null);
      loadMeetings();
    } catch (err) {
      console.error(err);
      toast('Erro ao salvar encontro.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (m: Meeting) => {
    // A data format depends on input type datetime-local, need slice to format properly if it's ISO
    // Convert UTC ISO to local datetime-local format: YYYY-MM-DDThh:mm
    let localDate = m.date;
    try {
        const d = new Date(m.date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        localDate = d.toISOString().slice(0, 16);
    } catch(e) {}
    
    setFormData({
      title: m.title,
      date: localDate,
      description: m.description,
      guest: m.guest || '',
      location: m.location || '',
      status: m.status
    });
    setEditingId(m.id);
  };

  const handleDelete = async (id: string) => {
    if (!await confirm('Excluir este encontro?')) return;
    try {
      await deleteMeeting(id);
      loadMeetings();
    } catch (err) {
      console.error(err);
      toast('Erro ao excluir.', 'error');
    }
  };

  
  const handleOpenPresence = async (meetingId: string) => {
    setPresenceModalId(meetingId);
    setIsPresenceLoading(true);
    try {
      const [f, p] = await Promise.all([getFounders(), getMeetingPresences(meetingId)]);
      setFounders(f);
      setPresences(new Set(p));
    } catch (err) {
      console.error(err);
      toast('Erro ao carregar presenças.', 'error');
    } finally {
      setIsPresenceLoading(false);
    }
  };

  const handleTogglePresence = async (userId: string) => {
    if (!presenceModalId) return;
    const isPresent = presences.has(userId);
    
    // Optimistic update
    setPresences(prev => {
      const n = new Set(prev);
      if (isPresent) n.delete(userId);
      else n.add(userId);
      return n;
    });

    try {
      await markMeetingPresence(presenceModalId, userId, !isPresent);
    } catch (err) {
      console.error(err);
      toast('Erro ao registrar presença.', 'error');
      // Revert
      setPresences(prev => {
        const n = new Set(prev);
        if (isPresent) n.add(userId);
        else n.delete(userId);
        return n;
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ title: '', date: '', description: '', guest: '', location: '', status: 'Próximo' });
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-8 mb-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-fox/10 p-3 rounded-2xl">
            <Calendar className="w-6 h-6 text-fox" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-playfair text-navy">Gestão de Encontros</h2>
            <p className="text-sm text-gray-500">Agende e gerencie os encontros e eventos da turma.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 flex flex-col gap-4">
        <h3 className="font-bold text-navy mb-2">{editingId ? 'Editar Encontro' : 'Novo Encontro'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Título *</label>
            <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-fox/20" placeholder="Ex: Onboarding iLab" />
          </div>
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Data e Hora *</label>
            <input required type="datetime-local" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-fox/20" />
          </div>
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Status *</label>
            <select required value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as Meeting['status'] })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-fox/20 bg-white">
              <option value="Próximo">Agendado</option>
              <option value="Em breve">Em andamento</option>
              <option value="Concluído">Concluído</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Descrição</label>
            <input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-fox/20" placeholder="Breve descritivo..." />
          </div>
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Local</label>
            <input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-fox/20" placeholder="Ex: Sala 101 ou Link Zoom" />
          </div>
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Convidado Especial</label>
            <input value={formData.guest} onChange={e => setFormData({ ...formData, guest: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-fox/20" placeholder="Ex: João Silva (VC)" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          {editingId && (
            <button type="button" onClick={handleCancelEdit} disabled={isCreating} className="px-6 py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-200 transition-colors">
              Cancelar
            </button>
          )}
          <button type="submit" disabled={isCreating} className="bg-fox text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-fox/90 transition-colors disabled:opacity-50">
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
            {editingId ? 'Salvar Alterações' : 'Cadastrar Encontro'}
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-fox animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 font-black text-[10px] uppercase tracking-widest text-gray-400">Data</th>
                <th className="pb-3 font-black text-[10px] uppercase tracking-widest text-gray-400">Título / Descrição</th>
                <th className="pb-3 font-black text-[10px] uppercase tracking-widest text-gray-400">Convidado</th>
                <th className="pb-3 font-black text-[10px] uppercase tracking-widest text-gray-400">Local</th>
                <th className="pb-3 font-black text-[10px] uppercase tracking-widest text-gray-400">Status</th>
                <th className="pb-3 font-black text-[10px] uppercase tracking-widest text-gray-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {meetings.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 text-gray-600">
                    {new Date(m.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="py-4">
                    <div className="font-bold text-navy">{m.title}</div>
                    <div className="text-xs text-gray-500 line-clamp-1">{m.description}</div>
                  </td>
                  <td className="py-4 text-gray-600">{m.guest || '-'}</td>
                  <td className="py-4 text-gray-600 truncate max-w-[150px]">{m.location || '-'}</td>
                  <td className="py-4">
                    {m.status === 'Próximo' && <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-[10px] font-bold uppercase">Agendado</span>}
                    {m.status === 'Em breve' && <span className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded text-[10px] font-bold uppercase">Em andamento</span>}
                    {m.status === 'Concluído' && <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-[10px] font-bold uppercase">Concluído</span>}
                    {m.status === 'Cancelado' && <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-bold uppercase">Cancelado</span>}
                  </td>
                  <td className="py-4 text-right flex justify-end gap-2">
                    <button onClick={() => handleOpenPresence(m.id)} className="p-2 text-gray-400 hover:text-navy hover:bg-gray-100 rounded-xl transition-colors" title="Registrar Presenças">
                      <Users className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEdit(m)} className="p-2 text-gray-400 hover:text-fox hover:bg-fox/10 rounded-xl transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(m.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {meetings.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">Nenhum encontro cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {presenceModalId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="font-bold text-navy text-lg">Registrar Presenças</h3>
                  <p className="text-xs text-gray-500">Membros ganham +100 XP por encontro.</p>
                </div>
                <button onClick={() => setPresenceModalId(null)} className="p-2 text-gray-400 hover:text-navy rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {isPresenceLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-fox animate-spin" /></div>
                ) : (
                  <div className="space-y-1">
                    {founders.map(f => {
                      const isPresent = presences.has(f.id);
                      return (
                        <div key={f.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden">
                              {f.avatar_url ? <img src={f.avatar_url} className="w-full h-full object-cover" /> : f.name?.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-navy">{f.name}</p>
                              <p className="text-[10px] text-gray-500">{f.startups?.name || 'Sem Squad'}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleTogglePresence(f.id)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isPresent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                          >
                            {isPresent ? 'Presente' : 'Ausente'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
