import React, { useState, useEffect } from 'react';
import { useUI } from '../../contexts/UIContext';
import { supabase, getInvites, createInvite, invalidateInvite } from '../../data/supabaseService';
import { Invite } from '../../data/mockData';
import { LinkIcon, Copy, Trash2, Loader2, Plus, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function InviteManager() {
  const { toast, confirm } = useUI();

  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newInvite, setNewInvite] = useState<{ maxUses: number; daysValid: number }>({ maxUses: 1, daysValid: 7 });

  const loadInvites = async () => {
    setIsLoading(true);
    try {
      const data = await getInvites();
      setInvites(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await createInvite(newInvite.maxUses, newInvite.daysValid);
      loadInvites();
      toast('Convite gerado com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      toast('Erro ao gerar convite.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInvalidate = async (id: string) => {
    if (!await confirm('Invalidar este convite?')) return;
    try {
      await invalidateInvite(id);
      loadInvites();
    } catch (err) {
      console.error(err);
      toast('Erro ao invalidar convite.', 'error');
    }
  };

  const copyToClipboard = (code: string) => {
    const url = `${window.location.origin}/cadastro?code=${code}`;
    navigator.clipboard.writeText(url);
    toast('Link copiado!', 'info');
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-8 mb-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-gold/10 p-3 rounded-2xl">
            <LinkIcon className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-playfair text-navy">Links de Convite</h2>
            <p className="text-sm text-gray-500">Gere links para permitir que novos founders se cadastrem.</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Usos Máximos</label>
          <input type="number" min="1" value={newInvite.maxUses} onChange={e => setNewInvite({ ...newInvite, maxUses: parseInt(e.target.value) || 1 })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-gold/20" />
        </div>
        <div className="flex-1 w-full">
          <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Validade (dias)</label>
          <input type="number" min="1" value={newInvite.daysValid} onChange={e => setNewInvite({ ...newInvite, daysValid: parseInt(e.target.value) || 1 })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-gold/20" />
        </div>
        <button onClick={handleGenerate} disabled={isGenerating} className="bg-navy text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-navy/90 transition-colors disabled:opacity-50 w-full md:w-auto justify-center">
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Gerar Link
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 font-black text-[10px] uppercase tracking-widest text-gray-400">Código</th>
                <th className="pb-3 font-black text-[10px] uppercase tracking-widest text-gray-400">Status</th>
                <th className="pb-3 font-black text-[10px] uppercase tracking-widest text-gray-400">Usos</th>
                <th className="pb-3 font-black text-[10px] uppercase tracking-widest text-gray-400">Expiração</th>
                <th className="pb-3 font-black text-[10px] uppercase tracking-widest text-gray-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {invites.map(invite => {
                const isExpired = new Date(invite.expires_at) < new Date();
                const isExhausted = invite.used_count >= invite.max_uses;
                const isActive = invite.active && !isExpired && !isExhausted;
                
                return (
                  <tr key={invite.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4">
                      <code className="bg-gray-100 text-navy font-mono px-2 py-1 rounded-md text-xs font-bold">{invite.code}</code>
                    </td>
                    <td className="py-4">
                      {isActive ? (
                        <span className="text-[10px] font-bold text-teal bg-teal/10 px-2 py-1 rounded-md uppercase">Ativo</span>
                      ) : (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md uppercase">
                          {!invite.active ? 'Revogado' : isExpired ? 'Expirado' : 'Esgotado'}
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-gray-600 font-medium">
                      {invite.used_count} / {invite.max_uses}
                    </td>
                    <td className="py-4 text-gray-500 text-xs">
                      {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-4 text-right flex justify-end gap-2">
                      <button onClick={() => copyToClipboard(invite.code)} disabled={!isActive} className="p-2 text-gray-400 hover:text-navy hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30 disabled:hover:bg-transparent">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleInvalidate(invite.id)} disabled={!isActive} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-30 disabled:hover:bg-transparent">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {invites.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">Nenhum convite gerado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
