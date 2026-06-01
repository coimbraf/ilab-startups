import React, { useState } from 'react';
import { useUI } from '../../contexts/UIContext';
import { useStartups } from '../../hooks/useStartups';
import { updateStartup, deleteStartup } from '../../data/supabaseService';
import { Rocket, Edit, Archive, Users, Loader2, Play, Trash2 } from 'lucide-react';
import SquadInviteManager from './SquadInviteManager';
import { motion } from 'motion/react';
import { Startup } from '../../data/mockData';
import CreateStartupModal from './CreateStartupModal';

export default function SquadsManager() {
  const { toast, confirm } = useUI();

  const { startups, isLoading, refetch } = useStartups();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSquad, setEditingSquad] = useState<Startup | null>(null);
  
  // Local state for edit form
  const [editForm, setEditForm] = useState({ name: '', cohort: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Group by archived
  const activeSquads = startups.filter(s => !s.archived);
  const archivedSquads = startups.filter(s => s.archived);

  const handleEdit = (squad: Startup) => {
    setEditingSquad(squad);
    setEditForm({ name: squad.name, cohort: squad.cohort || '' });
  };

  const handleSaveEdit = async () => {
    if (!editingSquad) return;
    setIsSaving(true);
    try {
      await updateStartup(editingSquad.id, {
        name: editForm.name,
        cohort: editForm.cohort
      });
      toast('Squad atualizado com sucesso!', 'success');
      setEditingSquad(null);
      refetch();
    } catch (err) {
      console.error(err);
      toast('Erro ao atualizar squad.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async (id: string, isArchiving: boolean) => {
    if (!await confirm(isArchiving ? 'Deseja arquivar este squad? Ele sairá da visão principal, mas os dados serão mantidos.' : 'Deseja restaurar este squad para os ativos?')) return;
    
    try {
      await updateStartup(id, { archived: isArchiving });
      toast(isArchiving ? 'Squad arquivado.' : 'Squad restaurado.', 'info');
      refetch();
    } catch (err) {
      console.error(err);
      toast('Erro ao arquivar/restaurar. Verifique se a coluna "archived" existe no banco de dados.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm('CUIDADO: Tem certeza que deseja excluir esta startup PERMANENTEMENTE? Isso apagará todos os dados associados a ela.')) return;
    try {
      await deleteStartup(id);
      toast('Startup excluída permanentemente.', 'info');
      refetch();
    } catch (err) {
      console.error(err);
      toast('Erro ao excluir startup. Verifique as dependências.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 text-fox animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Active Squads */}
      <div className="bg-white border border-gray-100 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 p-3 rounded-2xl">
              <Rocket className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-playfair text-navy">Squads Ativos</h2>
              <p className="text-sm text-gray-500">Gerencie os squads da turma atual.</p>
            </div>
          </div>
          <button onClick={() => setIsCreateOpen(true)} className="bg-fox text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-fox/90 transition-colors">
            Novo Squad
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeSquads.map((squad) => {
            const totalXP = squad.startup_members?.reduce((sum, m) => sum + (m.xp || 0), 0) || 0;
            const approvedDeliv = squad.startup_deliverables?.filter(d => d.status === 'approved').length || 0;
            
            return (
            <motion.div key={squad.id} layout className="border border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                    {squad.logoUrl ? (
                      <img src={squad.logoUrl} alt={squad.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-gray-400">{squad.name.substring(0, 2).toUpperCase()}</div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-navy leading-tight">{squad.name}</h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{squad.cohort || 'Ciclo Atual'}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(squad)} className="p-1.5 text-gray-400 hover:text-navy hover:bg-gray-100 rounded-lg" title="Editar">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleArchive(squad.id, true)} className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg" title="Arquivar">
                    <Archive className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(squad.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Excluir Permanentemente">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mt-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{squad.startup_members?.length || 0} membros</span>
                </div>
                <div className="flex gap-4">
                  <span className="font-bold text-gold">{totalXP} XP</span>
                  <span className="font-bold text-teal">{approvedDeliv} Entregues</span>
                </div>
              </div>
            </motion.div>
            );
          })}
          {activeSquads.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-100 rounded-2xl">
              <p className="text-gray-400 font-medium">Nenhum squad ativo no momento.</p>
            </div>
          )}
        </div>
      </div>

      {/* Archived Squads */}
      {archivedSquads.length > 0 && (
        <div className="bg-gray-50 border border-gray-200/50 rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Archive className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-bold font-playfair text-gray-600">Histórico de Semestres (Arquivados)</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 opacity-75 hover:opacity-100 transition-opacity">
            {archivedSquads.map((squad) => (
              <div key={squad.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-gray-500">{squad.name}</h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded-md">{squad.cohort || 'Antigo'}</span>
                  </div>
                <button onClick={() => handleArchive(squad.id, false)} className="text-[10px] font-bold uppercase tracking-widest text-fox hover:underline">
                  Restaurar
                </button>
                <button onClick={() => handleDelete(squad.id)} className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:underline ml-3">
                  Excluir
                </button>
              </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {isCreateOpen && (
        <CreateStartupModal onClose={() => setIsCreateOpen(false)} onCreated={refetch} />
      )}

      {/* Edit Modal */}
      {editingSquad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-navy mb-4">Editar Squad</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Nome</label>
                <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm" />
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Semestre / Ciclo</label>
                <input value={editForm.cohort} onChange={e => setEditForm({...editForm, cohort: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm" placeholder="Ex: 2024.1" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setEditingSquad(null)} className="flex-1 py-3 text-gray-500 font-bold text-sm border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
                <button onClick={handleSaveEdit} disabled={isSaving} className="flex-1 py-3 text-white bg-fox font-bold text-sm rounded-xl hover:bg-fox/90 flex justify-center">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Include SquadInviteManager here */}
      <SquadInviteManager />

    </div>
  );
}
