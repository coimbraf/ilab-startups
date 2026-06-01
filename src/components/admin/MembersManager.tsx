import React, { useState, useEffect } from 'react';
import { useUI } from '../../contexts/UIContext';
import { supabase, getAllMembers, updateMemberStatus, unlinkFounderFromStartup, deleteMember } from '../../data/supabaseService';
import { Users, Loader2, Search, Filter, ShieldAlert, CheckCircle, XCircle, Trash2 } from 'lucide-react';

export default function MembersManager() {
  const { toast, confirm } = useUI();

  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterSquad, setFilterSquad] = useState('all');



  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const data = await getAllMembers();
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();

    if (supabase) {
      const channel = supabase.channel('members-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
          loadMembers();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'startup_members' }, () => {
          loadMembers();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'inactive' ? 'desativar' : 'ativar';
    if (!await confirm(`Tem certeza que deseja ${action} este membro? O histórico será preservado.`)) return;
    
    try {
      await updateMemberStatus(id, newStatus);
      loadMembers();
    } catch (err) {
      toast('Erro ao atualizar status.', 'error');
    }
  };

  const handleUnlink = async (id: string) => {
    if (!await confirm('Desvincular este membro do squad atual?')) return;
    try {
      await unlinkFounderFromStartup(id);
      loadMembers();
    } catch (err) {
      toast('Erro ao desvincular.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm('CUIDADO: Deseja excluir este membro permanentemente? O histórico não poderá ser recuperado.')) return;
    try {
      await deleteMember(id);
      loadMembers();
    } catch (err) {
      toast('Erro ao excluir membro.', 'error');
    }
  };

  // Extract unique squads and roles for filters
  const uniqueSquads = Array.from(new Set(members.map(m => m.startups?.name).filter(Boolean)));
  const uniqueRoles = Array.from(new Set(members.map(m => m.track).filter(Boolean)));

  const filteredMembers = members.filter(m => {
    const searchLower = search.toLowerCase();
    const matchesSearch = search === '' || 
      (m.name?.toLowerCase().includes(searchLower) || m.email?.toLowerCase().includes(searchLower));
    const matchesStatus = filterStatus === 'all' || (m.status || 'active') === filterStatus;
    const matchesRole = filterRole === 'all' || m.track === filterRole;
    const matchesSquad = filterSquad === 'all' || (m.startups?.name === filterSquad);
    return matchesSearch && matchesStatus && matchesRole && matchesSquad;
  });

  if (isLoading) {
    return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-fox animate-spin" /></div>;
  }

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-8 mb-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-3 rounded-2xl">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-playfair text-navy">Gestão de Membros</h2>
            <p className="text-sm text-gray-500">Acompanhe todos os founders, seus squads e XP.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-fox/20"
          />
        </div>
        <div className="flex gap-2">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white">
            <option value="all">Status: Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white">
            <option value="all">Trilha: Todas</option>
            {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filterSquad} onChange={e => setFilterSquad(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white">
            <option value="all">Squad: Todos</option>
            {uniqueSquads.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-3 font-black text-[10px] uppercase tracking-widest text-gray-400">Membro</th>
              <th className="pb-3 font-black text-[10px] uppercase tracking-widest text-gray-400">Trilha</th>
              <th className="pb-3 font-black text-[10px] uppercase tracking-widest text-gray-400">Squad</th>
              <th className="pb-3 font-black text-[10px] uppercase tracking-widest text-gray-400">XP</th>
              <th className="pb-3 font-black text-[10px] uppercase tracking-widest text-gray-400">Status</th>
              <th className="pb-3 font-black text-[10px] uppercase tracking-widest text-gray-400 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredMembers.map(m => {
              const status = m.status || 'active';
              return (
                <tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${status === 'inactive' ? 'opacity-50' : ''}`}>
                  <td className="py-4">
                    <div className="font-bold text-navy">{m.name || `Usuário (${m.id.substring(0,8)})`}</div>
                    <div className="text-xs text-gray-500">{m.email || 'Sem e-mail'}</div>
                  </td>
                  <td className="py-4 text-gray-600 capitalize">{m.track || '-'}</td>
                  <td className="py-4">
                    {m.startups?.name ? (
                      <span className="bg-purple-50 text-purple-600 font-bold px-2 py-1 rounded text-xs">
                        {m.startups.name}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Sem Squad</span>
                    )}
                  </td>
                  <td className="py-4 font-black text-gold">{m.academy_xp || 0} XP</td>
                  <td className="py-4">
                    {status === 'active' ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3" /> Ativo
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-fit">
                        <XCircle className="w-3 h-3" /> Inativo
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {m.startups?.name && status === 'active' && (
                        <button onClick={() => handleUnlink(m.id)} className="text-[10px] font-bold uppercase tracking-widest text-orange-500 hover:bg-orange-50 px-2 py-1 rounded transition-colors">
                          Desvincular
                        </button>
                      )}
                      <button onClick={() => handleToggleStatus(m.id, status)} className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded transition-colors ${status === 'active' ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                        {status === 'active' ? 'Desativar' : 'Reativar'}
                      </button>
                      <button onClick={() => handleDelete(m.id)} className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:bg-gray-100 hover:text-red-600 p-1.5 rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredMembers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">Nenhum membro encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
