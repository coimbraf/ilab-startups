import React, { useState, useEffect, useCallback } from 'react';
import { useUI } from '../../contexts/UIContext';
import { supabase, getAvailableFounders, inviteUserToStartup, getFoundersByStartup, unlinkFounderFromStartup, linkFounderToStartup } from '../../data/supabaseService';
import { useStartups } from '../../hooks/useStartups';
import { UserPlus, Loader2, Users } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function SquadInviteManager() {
  const { toast, confirm } = useUI();

  const [founders, setFounders] = useState<any[]>([]);
  // Use global startups context
  const { startups } = useStartups();
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedStartup, setSelectedStartup] = useState('');
  
  // Unlink state
  const [unlinkStartup, setUnlinkStartup] = useState('');
  const [linkedFounders, setLinkedFounders] = useState<any[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const availFounders = await getAvailableFounders();
      setFounders(availFounders);
    } catch (err) {
      console.error('Failed to load data for squad invites', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    loadData();

    if (supabase) {
      const channel = supabase.channel('squads-invite-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
          loadData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'startups' }, () => {
          loadData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [loadData]);
  
  // Load linked founders when startup changes
  useEffect(() => {
    if (unlinkStartup) {
      getFoundersByStartup(unlinkStartup).then(setLinkedFounders);
    } else {
      setLinkedFounders([]);
    }
  }, [unlinkStartup]);
  const handleInvite = async () => {
    if (!selectedUser || !selectedStartup) {
      toast('Selecione um founder e uma startup.', 'info');
      return;
    }
    setIsSubmitting(true);
    try {
      const startup = startups.find(s => s.id === selectedStartup);
      await inviteUserToStartup(selectedUser, selectedStartup, startup?.name || 'Startup');
      toast('Convite enviado com sucesso! O founder receberá uma notificação.', 'success');
      setSelectedUser('');
      setSelectedStartup('');
      await loadData();
    } catch (err) {
      console.error('Error sending invite', err);
      toast('Erro ao enviar convite.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-8 mb-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-fox/10 p-3 rounded-2xl">
          <Users className="w-6 h-6 text-fox" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-playfair text-navy">Convidar para Squad</h2>
          <p className="text-sm text-gray-500">Convide founders disponíveis para ingressar em uma startup existente.</p>
        </div>
      </div>
      {isLoading ? (
        <p className="text-sm text-gray-500">Carregando dados...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Founder (Disponível)</label>
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-fox/20 outline-none"
            >
              <option value="">Selecione o usuário...</option>
              {founders.map(f => (
                <option key={f.id} value={f.id}>{f.name || f.email || f.id.substring(0,8)}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Startup (Squad)</label>
            <select
              value={selectedStartup}
              onChange={e => setSelectedStartup(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-fox/20 outline-none"
            >
              <option value="">Selecione a startup...</option>
              {startups.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <button
              onClick={handleInvite}
              disabled={isSubmitting || !selectedUser || !selectedStartup}
              className="w-full bg-navy text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-navy/90 active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Convite'}
            </button>
          </div>
        </div>
      )}
      
      {/* ── Desvincular ── */}
      <div className="mt-12 pt-8 border-t border-gray-100">
        <h3 className="text-sm font-bold text-navy mb-4">Desvincular Membro</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Selecione o Squad</label>
            <select
              value={unlinkStartup}
              onChange={e => setUnlinkStartup(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
            >
              <option value="">Selecione a startup...</option>
              {startups.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Founders Vinculados</label>
            {unlinkStartup ? (
              linkedFounders.length > 0 ? (
                <div className="space-y-2">
                  {linkedFounders.map(lf => (
                    <div key={lf.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl">
                      <span className="text-xs font-bold text-gray-700 truncate mr-2">{lf.name || lf.id.substring(0,12)}</span>
                      <button 
                        onClick={async () => {
                          if (await confirm('Tem certeza que deseja desvincular este usuário?')) {
                            await unlinkFounderFromStartup(lf.id);
                            toast('Desvinculado com sucesso!', 'success');
                            getFoundersByStartup(unlinkStartup).then(setLinkedFounders);
                            loadData();
                          }
                        }}
                        className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200 font-bold transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-3">Nenhum founder vinculado a este squad via plataforma.</p>
              )
            ) : (
              <p className="text-sm text-gray-400 py-3">Selecione uma startup ao lado.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
