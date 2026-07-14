import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle, XCircle, ExternalLink, Clock, RefreshCw, AlertTriangle, ChevronRight, Inbox, Loader2, Plus, Trash2, UserPlus, PieChart, CheckSquare, UserCircle, Link as LinkIcon, Calendar, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStartups } from '../hooks/useStartups';
import { getPendingDeliverables, reviewDeliverable, createStartup, upsertStartupMember, getInvites, createInvite, invalidateInvite, getLessons, createLesson, deleteLesson, getAvailableFounders, inviteUserToStartup, getFoundersByStartup, unlinkFounderFromStartup, linkFounderToStartup } from '../data/supabaseService';
import { mockStartups, deliverableTypes, MemberRole, Invite, Lesson } from '../data/mockData';
import { cn } from '../lib/utils';
import { supabase } from '../data/supabaseService';
import { BookOpen, Play, Edit, Users } from 'lucide-react';
import CreateStartupModal from '../components/admin/CreateStartupModal';
import InviteManager from '../components/admin/InviteManager';
import LessonsManager from '../components/admin/LessonsManager';
import SquadInviteManager from '../components/admin/SquadInviteManager';
import MeetingsManager from '../components/admin/MeetingsManager';
import OverviewManager from '../components/admin/OverviewManager';
import SquadsManager from '../components/admin/SquadsManager';
import MembersManager from '../components/admin/MembersManager';
import WhitelistManager from '../components/admin/WhitelistManager';

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface PendingItem {
  id: string;
  startupId: string;
  startupName: string;
  typeId: string;
  typeInfo: typeof deliverableTypes[string];
  evidenceUrl?: string;
  description?: string;
  submittedAt?: string;
}

// ─── Modal de Revisão ─────────────────────────────────────────────────────────
interface ReviewModalProps {
  item: PendingItem;
  action: 'approved' | 'rejected';
  onConfirm: (notes: string) => void;
  onClose: () => void;
  isProcessing: boolean;
}

function ReviewModal({ item, action, onConfirm, onClose, isProcessing }: ReviewModalProps) {
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        {/* Header */}
        <div className={cn(
          "p-6 rounded-t-2xl flex items-center gap-3",
          action === 'approved' ? 'bg-teal/5 border-b border-teal/10' : 'bg-red-50 border-b border-red-100'
        )}>
          {action === 'approved'
            ? <CheckCircle className="w-6 h-6 text-teal" />
            : <XCircle className="w-6 h-6 text-red-500" />}
          <div>
            <h3 className="font-bold text-graphite">
              {action === 'approved' ? 'Aprovar Entregável' : 'Rejeitar Entregável'}
            </h3>
            <p className="text-xs text-gray-500">
              {item.typeInfo?.title} — {item.startupName}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Evidência */}
          {item.evidenceUrl && (
            <a
              href={item.evidenceUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-navy font-medium hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              Ver evidência enviada
            </a>
          )}

          {/* Descrição do founder */}
          {item.description && (
            <div className="bg-gray-50 p-3 rounded-xl text-sm text-gray-600 border border-gray-100">
              <span className="font-bold text-xs text-gray-400 uppercase tracking-wider block mb-1">Descrição do Founder</span>
              {item.description}
            </div>
          )}

          {/* Campo de feedback */}
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-gray-400 block mb-2">
              {action === 'approved' ? 'Observação (opcional)' : 'Motivo da Rejeição *'}
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder={
                action === 'approved'
                  ? 'Ex: Ótima apresentação, parabéns!'
                  : 'Ex: Link quebrado, por favor reenvie com acesso público...'
              }
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-navy outline-none focus:ring-2 focus:ring-fox/20 focus:border-fox resize-none transition-all"
            />
          </div>
        </div>

        {/* Ações */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (action === 'rejected' && !notes.trim()) return;
              onConfirm(notes);
            }}
            disabled={isProcessing || (action === 'rejected' && !notes.trim())}
            className={cn(
              "flex-1 py-3 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50",
              action === 'approved' ? 'bg-teal hover:bg-teal/90' : 'bg-red-500 hover:bg-red-600'
            )}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : action === 'approved' ? 'Confirmar Aprovação' : 'Confirmar Rejeição'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Card de Entregável Pendente ──────────────────────────────────────────────
interface PendingCardProps extends React.Attributes {
  item: PendingItem;
  onApprove: (item: PendingItem) => void;
  onReject: (item: PendingItem) => void;
}

function PendingCard({ item, onApprove, onReject }: PendingCardProps) {
  const formattedDate = item.submittedAt
    ? new Date(item.submittedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Sem data';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-200 hover:shadow-sm transition-all"
    >
      {/* Header do card */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="bg-yellow-50 border border-yellow-100 p-2 rounded-xl shrink-0">
            <Clock className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-0.5">Em Análise</p>
            <h3 className="font-bold text-graphite text-base leading-tight">
              {item.typeInfo?.title || item.typeId}
            </h3>
            <Link
              to={`/startup/${item.startupId}`}
              className="inline-flex items-center gap-1 text-xs text-fox font-bold hover:underline mt-0.5"
            >
              {item.startupName}
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] font-bold text-gray-400 block">XP disponível</span>
          <span className="text-lg font-black text-gold">+{item.typeInfo?.xpValue || 0}</span>
        </div>
      </div>

      {/* Descrição do founder */}
      {item.description && (
        <div className="bg-gray-50 p-3 rounded-xl text-sm text-gray-600 mb-3 border border-gray-100">
          <span className="font-bold text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Relato do Founder</span>
          <p className="line-clamp-3">{item.description}</p>
        </div>
      )}

      {/* Link da evidência */}
      {item.evidenceUrl && (
        <a
          href={item.evidenceUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-sm text-navy font-medium hover:underline mb-4"
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{item.evidenceUrl}</span>
        </a>
      )}

      {/* Rodapé */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">{formattedDate}</span>
        <div className="flex gap-2">
          <button
            onClick={() => onReject(item)}
            className="flex items-center gap-1.5 text-xs font-bold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all"
          >
            <XCircle className="w-3.5 h-3.5" />
            Rejeitar
          </button>
          <button
            onClick={() => onApprove(item)}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-teal hover:bg-teal/90 px-3 py-1.5 rounded-lg transition-all shadow-sm"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Aprovar
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Painel Principal ─────────────────────────────────────────────────────────
function ApprovalsManager() {
  const { user } = useAuth();
  const { refetch: refetchStartups } = useStartups();
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalItem, setModalItem] = useState<PendingItem | null>(null);
  const [modalAction, setModalAction] = useState<'approved' | 'rejected'>('approved');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Mocks para desenvolvimento sem Supabase
  const mockPending: PendingItem[] = mockStartups.flatMap(s =>
    s.deliverables
      .filter(d => d.status === 'submitted')
      .map(d => ({
        id: d.id,
        startupId: s.id,
        startupName: s.name,
        typeId: d.typeId,
        typeInfo: deliverableTypes[d.typeId],
        evidenceUrl: d.evidenceUrl,
        description: (d as any).description,
        submittedAt: d.submittedAt
      }))
  );

  const loadPending = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (supabase) {
        const data = await getPendingDeliverables();
        setPending(data);
      } else {
        // Fallback mock
        setPending(mockPending);
      }
    } catch (err: any) {
      setError('Não foi possível carregar as submissões pendentes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const handleOpenModal = (item: PendingItem, action: 'approved' | 'rejected') => {
    setModalItem(item);
    setModalAction(action);
  };

  const handleConfirmReview = async (notes: string) => {
    if (!modalItem || !user) return;
    setIsProcessing(true);
    try {
      if (supabase) {
        await reviewDeliverable(
          modalItem.startupId,
          modalItem.typeId,
          modalAction,
          notes,
          modalItem.typeInfo?.xpValue || 0,
          user.name
        );
      }
      // Atualiza a lista local removendo o item revisado
      setPending(prev => prev.filter(p => p.id !== modalItem.id));
      setSuccessMsg(modalAction === 'approved' ? '✓ Entregável aprovado com sucesso!' : '✗ Entregável rejeitado.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      const errorMsg = err.message || err.toString();
      if (errorMsg.includes('row-level security policy') || errorMsg.includes('policy')) {
        setError('Erro: Falha ao processar a revisão. Verifique se a sua conta tem permissão de admin.');
      } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
        setError('Erro: Sua sessão expirou. Por favor, recarregue a página.');
      } else {
        setError('Erro ao processar: ' + errorMsg);
      }
      console.error("[AdminPanel] Review error:", err);
    } finally {
      setIsProcessing(false);
      setModalItem(null);
    }
  };

  return (
    <div className="pb-12">
      <div className="bg-white border-b border-gray-100 mb-8 pt-8 pb-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-navy/5 p-3 rounded-2xl">
                <Bell className="w-6 h-6 text-navy" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-playfair text-navy">Painel de Aprovações</h1>
                <p className="text-sm text-gray-500">Revise e valide os entregáveis enviados pelos founders.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadPending()}
                disabled={isLoading}
                className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-navy border border-gray-200 px-4 py-2 rounded-xl transition-all hover:border-gray-300"
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                Atualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Feedback messages */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 bg-teal/10 border border-teal/20 text-teal font-bold px-5 py-4 rounded-xl"
            >
              {successMsg}
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-6 bg-red-50 border border-red-100 text-red-600 font-bold px-5 py-4 rounded-xl"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-fox animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Carregando submissões...</p>
          </div>
        ) : pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="bg-gray-50 p-6 rounded-full">
              <Inbox className="w-10 h-10 text-gray-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-graphite mb-1">Nenhuma submissão pendente</h3>
              <p className="text-sm text-gray-400">Quando os founders enviarem entregáveis, eles aparecerão aqui.</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="bg-yellow-400 text-white text-xs font-black px-2.5 py-1 rounded-full">
                {pending.length}
              </span>
              <h2 className="font-bold text-graphite">submissão{pending.length !== 1 ? 'ões' : ''} aguardando revisão</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {pending.map(item => (
                  <PendingCard
                    key={item.id}
                    item={item}
                    onApprove={(i) => handleOpenModal(i, 'approved')}
                    onReject={(i) => handleOpenModal(i, 'rejected')}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Revisão */}
      <AnimatePresence>
        {modalItem && (
          <ReviewModal
            item={modalItem}
            action={modalAction}
            onConfirm={handleConfirmReview}
            onClose={() => setModalItem(null)}
            isProcessing={isProcessing}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'geral' | 'aprovacoes' | 'squads' | 'membros' | 'convites' | 'whitelist' | 'academy' | 'encontros'>('geral');

  // ⚠️ Este guard é apenas UX (esconde a tela). A autorização REAL é a RLS
  // no Supabase (supabase/policies.sql): toda escrita sensível é negada no
  // banco para quem não é admin, mesmo que burle este componente.
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen pt-[5rem] flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold font-playfair text-navy mb-2">Acesso Restrito</h2>
          <p className="text-gray-500">Apenas coordenadores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'geral': return <OverviewManager />;
      case 'aprovacoes': return <ApprovalsManager />;
      case 'squads': return <SquadsManager />;
      case 'membros': return <MembersManager />;
      case 'convites': return (
        <div className="space-y-8">
          <InviteManager />
        </div>
      );
      case 'academy': return <LessonsManager />;
      case 'whitelist': return <WhitelistManager />;
      case 'encontros':
        return <MeetingsManager />;
      default: return <ApprovalsManager />;
    }
  };

  const tabs = [
    { id: 'geral', label: 'Visão Geral', icon: PieChart },
    { id: 'aprovacoes', label: 'Aprovações', icon: CheckSquare },
    { id: 'squads', label: 'Squads', icon: Users },
    { id: 'membros', label: 'Membros', icon: UserCircle },
    { id: 'whitelist', label: 'Whitelist', icon: ShieldAlert },
    { id: 'convites', label: 'Convites', icon: LinkIcon },
    { id: 'academy', label: 'iLab Academy', icon: BookOpen },
    { id: 'encontros', label: 'Encontros', icon: Calendar }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 pt-[5rem] flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white border-r border-gray-100 flex-shrink-0 flex flex-col md:min-h-[calc(100vh-5rem)] p-4 md:p-6 sticky top-[5rem]">
        <h2 className="font-playfair font-bold text-navy text-xl mb-6 hidden md:block px-4">Admin Painel</h2>
        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap",
                  isActive 
                    ? "bg-fox text-white shadow-md" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-navy"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>
      
      <main className="flex-1 md:overflow-y-auto">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}


