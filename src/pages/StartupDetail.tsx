import { useParams, Link } from "react-router-dom";
import { useUI } from '../contexts/UIContext';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Users,
  LayoutDashboard,
  Lock,
  ExternalLink,
  Award,
  Sparkles,
  TrendingUp,
  Clock,
  XCircle,
  Phone
} from "lucide-react";
import { useStartups } from "../hooks/useStartups";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import StartupIcon from "../components/StartupIcon";
import { deliverableTypes } from "../data/mockData";
import { SubmitDeliverableModal, ReviewDeliverableModal } from "../components/DeliverableModals";

/* ─── Skeleton do perfil ─────────────────────────────────── */
function ProfileSkeleton() {
  return (
    <div className="bg-white border-b border-gray-100 pt-6 md:pt-10 pb-10 md:pb-16">
      <div className="container mx-auto px-4">
        <div className="skeleton h-4 w-20 rounded mb-8" />
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          <div className="skeleton w-32 h-32 md:w-40 md:h-40 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-4 w-full">
            <div className="skeleton h-10 w-64 rounded-xl" />
            <div className="skeleton h-4 w-full max-w-lg rounded" />
            <div className="skeleton h-4 w-4/5 max-w-md rounded" />
            <div className="flex gap-4 mt-2">
              <div className="skeleton h-14 w-32 rounded-lg" />
              <div className="skeleton h-14 w-32 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="container mx-auto px-4 mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
            <div className="skeleton h-7 w-48 rounded" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-12 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-8">
          <div className="skeleton rounded-2xl h-48 w-full" />
          <div className="skeleton rounded-2xl h-48 w-full" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function StartupDetail() {
  const { toast, confirm } = useUI();

  const { id } = useParams();
  const { startups, isLoading, refetch } = useStartups();
  const { user } = useAuth();

  // Modais de entregável (substituem os antigos prompt() nativos)
  const [submitTypeId, setSubmitTypeId] = useState<string | null>(null);
  const [reviewState, setReviewState] = useState<{ typeId: string; action: 'approved' | 'rejected' } | null>(null);

  const startup = startups.find((s) => s.id === id);

  useEffect(() => {
    if (startup && startup.status === "Concluído") {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;

      const interval: ReturnType<typeof setInterval> = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [startup?.status]);

  // Controle de Acesso: 1=Público, 2=Founder da startup, 3=Admin
  let authLevel = 1;
  if (user?.role === "admin") authLevel = 3;
  if (user?.role === "founder" && user?.startupId === startup?.id) authLevel = 2;

  /* ── Loading State ───────────────────────────────────────── */
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-[#FFFDF2] min-h-screen pb-20"
        aria-label="Carregando dados da startup"
        aria-busy="true"
      >
        <ProfileSkeleton />
        <ContentSkeleton />
      </motion.div>
    );
  }

  /* ── Not Found ───────────────────────────────────────────── */
  if (!startup) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-playfair font-bold text-brown mb-4">
          Startup não encontrada
        </h2>
        <p className="text-brown/60 mb-6">
          Não conseguimos encontrar essa startup no portfólio.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-fox hover:text-fox/80 font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Voltar para o portal
        </Link>
      </div>
    );
  }

  // Lógica Gamificada do Progresso
  const totalDeliverables = Object.keys(deliverableTypes).length;
  const approvedDeliverables = startup.deliverables.filter(d => d.status === 'approved').length;
  const progressPercent = Math.round((approvedDeliverables / totalDeliverables) * 100) || 0;

  // Renderização de um Badge
  let badgeRank = "Novato";
  if (startup.totalScore >= 1000) badgeRank = "Mestre (1000+ XP)";
  else if (startup.totalScore >= 700) badgeRank = "Destaque (700+ XP)";
  else if (startup.totalScore >= 400) badgeRank = "Ativo (400+ XP)";
  else if (startup.totalScore >= 100) badgeRank = "Iniciante (100+ XP)";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-[#FFFDF2] min-h-screen pb-20"
    >
      {/* ── Header Hero ──────────────────────────────────────── */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative bg-white border-b border-gray-100 pt-6 md:pt-10 pb-12 md:pb-20 overflow-hidden"
      >
        {/* Gradiente decorativo de fundo */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-fox/5 rounded-full blur-3xl -mr-40 -mt-40" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -ml-20 -mb-20" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <Link
            to="/#startups"
            className="inline-flex items-center gap-2 text-sm font-medium text-graphite/50 hover:text-fox mb-8 transition-colors group"
          >
            <ArrowLeft
              className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
              aria-hidden="true"
            />
            Voltar ao portfólio
          </Link>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-2xl border-4 border-white ring-1 ring-black/5">
                <StartupIcon
                  name={startup.name}
                  className="w-full h-full"
                  iconClassName="w-12 h-12 sm:w-16 sm:h-16 opacity-80"
                />
              </div>
              {startup.status === "Concluído" && (
                <div
                  className="absolute -bottom-2 -right-2 bg-teal text-white p-2 rounded-full shadow-lg border-2 border-white"
                  title="Startup concluída"
                >
                  <Award className="w-4 h-4" aria-hidden="true" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 w-full">
              <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-3">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-playfair text-graphite leading-tight">
                  {startup.name}
                </h1>
                <div
                  className={cn(
                    "px-3 py-1 text-[10px] sm:text-xs font-bold rounded-full uppercase tracking-widest shrink-0",
                    startup.status === "Concluído"
                      ? "bg-teal/10 text-teal"
                      : "bg-fox/10 text-fox"
                  )}
                  role="status"
                >
                  {startup.status}
                </div>
              </div>

              <p className="text-base sm:text-lg text-graphite/70 max-w-3xl mb-6 leading-relaxed">
                {startup.description}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap items-stretch gap-3 md:gap-4">
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex-1 sm:flex-none min-w-[130px]">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Pontuação Total (XP)
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-fox tracking-tight tabular">
                    {startup.totalScore}{" "}
                    <span className="text-sm font-bold opacity-60">XP</span>
                  </span>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex-1 sm:flex-none min-w-[130px]">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Rank
                  </span>
                  <span className="text-base sm:text-lg font-black text-navy flex items-center gap-1.5 mt-1">
                    <Sparkles className="w-4 h-4 text-gold" />
                    {badgeRank}
                  </span>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex-1 sm:flex-none min-w-[130px]">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Progresso Oficial
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-teal tabular">
                    {progressPercent}
                    <span className="text-sm font-bold opacity-60">%</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Conteúdo Principal ───────────────────────────────── */}
      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ─── Coluna principal ───────────────────────────── */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Gamificação / Jornada de Entregáveis */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-gray-100 pb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-teal/10 p-2 rounded-lg">
                    <LayoutDashboard
                      className="w-5 h-5 text-teal"
                      aria-hidden="true"
                    />
                  </div>
                  <h2 className="text-2xl font-playfair font-bold text-graphite">
                    Jornada de Aceleração
                  </h2>
                </div>
                
                <div className="text-right">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">XP Conquistado</span>
                  <div className="flex items-baseline justify-end gap-1 text-teal">
                    <span className="text-2xl font-black">{startup.totalScore}</span>
                    <span className="text-sm font-bold">/ 1040 XP</span>
                  </div>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="mb-10">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-sm text-graphite/60">
                    Entregáveis concluídos
                  </span>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp
                      className="w-4 h-4 text-teal"
                      aria-hidden="true"
                    />
                    <span className="text-xl font-black text-teal tabular">
                      {progressPercent}%
                    </span>
                  </div>
                </div>
                <div
                  className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className="bg-gradient-to-r from-teal to-teal/80 h-2.5 rounded-full"
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[11px] text-gray-400 font-medium">
                  <span>
                    {approvedDeliverables} de {totalDeliverables} entregues
                  </span>
                  <span>{totalDeliverables - approvedDeliverables} pendentes</span>
                </div>
              </div>

              {/* Lista Gamificada de Entregáveis */}
              <div className="space-y-4">
                {Object.values(deliverableTypes).sort((a, b) => a.sortOrder - b.sortOrder).map((type, i) => {
                  const submission = startup.deliverables.find(d => d.typeId === type.id) || { status: 'pending', xpEarned: 0 };
                  const isApproved = submission.status === 'approved';
                  const isSubmitted = submission.status === 'submitted';
                  const isRejected = submission.status === 'rejected';
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      key={type.id}
                      className={cn(
                        "border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all",
                        isApproved ? "border-teal/20 bg-teal/5" : 
                        isRejected ? "border-red-200 bg-red-50" :
                        "border-gray-100 bg-white hover:border-gray-200"
                      )}
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2",
                          isApproved ? "bg-teal text-white border-teal shadow-md shadow-teal/20" : 
                          isSubmitted ? "bg-yellow-100 text-yellow-600 border-yellow-200" :
                          isRejected ? "bg-red-100 text-red-500 border-red-200" :
                          "bg-gray-50 text-gray-400 border-gray-100"
                        )}>
                          {isApproved ? <CheckCircle2 className="w-5 h-5" /> :
                           isSubmitted ? <Clock className="w-5 h-5" /> :
                           isRejected ? <XCircle className="w-5 h-5" /> :
                           <Circle className="w-5 h-5" />}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "font-bold text-sm sm:text-base",
                              isApproved ? "text-teal-900" : "text-graphite"
                            )}>
                              {type.title}
                            </span>
                            <span className="flex items-center gap-1 bg-gold/10 text-gold px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-gold/20">
                              +{type.xpValue} XP
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mb-2">
                            {type.description}
                          </p>
                          
                          {/* Notas ou Feedback */}
                          {(submission as any).evidenceNotes && (
                            <div className="mt-2 text-xs bg-white/50 p-2 rounded border border-gray-100 italic text-gray-600">
                              <span className="font-bold not-italic">Feedback:</span> {(submission as any).evidenceNotes}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
                        {/* Status Label */}
                        <div className="mb-2">
                          {isApproved ? (
                             <span className="text-xs font-bold text-teal flex items-center gap-1">Concluído</span>
                          ) : isSubmitted ? (
                             <span className="text-xs font-bold text-yellow-600 flex items-center gap-1">Em Análise</span>
                          ) : isRejected ? (
                             <span className="text-xs font-bold text-red-500 flex items-center gap-1">Refazer</span>
                          ) : (
                             <span className="text-xs font-bold text-gray-400">Pendente</span>
                          )}
                        </div>

                        {/* Botões de Ação / Evidência */}
                        {isApproved || isSubmitted ? (
                          <div className="flex flex-col gap-2 items-end">
                            {(submission as any).evidenceUrl && (authLevel >= 2) ? (
                              <a
                                href={(submission as any).evidenceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={cn(
                                  "flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors w-full sm:w-auto justify-center",
                                  isApproved ? "bg-white text-teal hover:bg-teal-50 shadow-sm border border-teal/10" : "bg-white text-navy hover:bg-navy/5 shadow-sm border border-gray-100"
                                )}
                              >
                                Ver Evidência
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400 px-3 py-1.5 bg-gray-50 rounded-lg w-full sm:w-auto justify-center">
                                <Lock className="w-3 h-3" /> Privado
                              </span>
                            )}
                            
                            {/* Admin Controls */}
                            {authLevel === 3 && isSubmitted && (
                              <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                  onClick={() => setReviewState({ typeId: type.id, action: 'approved' })}
                                  className="flex-1 sm:flex-none text-[10px] font-bold text-white bg-teal hover:bg-teal/90 px-3 py-1.5 rounded-md transition-all uppercase tracking-wider"
                                >
                                  Aprovar
                                </button>
                                <button
                                  onClick={() => setReviewState({ typeId: type.id, action: 'rejected' })}
                                  className="flex-1 sm:flex-none text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-md transition-all uppercase tracking-wider"
                                >
                                  Rejeitar
                                </button>
                              </div>
                            )}
                          </div>
                        ) : authLevel >= 2 ? (
                          <button
                            onClick={() => setSubmitTypeId(type.id)}
                            className="flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-navy hover:bg-navy/90 px-4 py-2 rounded-lg shadow-md transition-all active:scale-95 w-full sm:w-auto"
                          >
                            Enviar Entrega
                          </button>
                        ) : (
                          <span className="text-xs font-medium text-gray-300">Aguarda fundador</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* ─── Sidebar ────────────────────────────────────── */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="space-y-6"
          >
            {/* Contato Principal */}
            {startup.leaderPhone && (
              <div className="bg-fox/5 rounded-2xl border border-fox/10 p-5 flex items-start gap-4">
                <div className="bg-fox text-white p-2.5 rounded-xl shadow-md shadow-fox/20">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-fox/60 mb-1">Líder Responsável</h4>
                  <a href={`https://wa.me/${startup.leaderPhone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-brown font-bold hover:text-fox transition-colors block text-sm">
                    {startup.leaderPhone}
                  </a>
                </div>
              </div>
            )}

            {/* Time / Squad */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-playfair font-bold text-graphite mb-5 flex items-center gap-2">
                <Users
                  className="w-4 h-4 text-gray-400"
                  aria-hidden="true"
                />
                Squad Atual
              </h3>
              <div className="space-y-4">
                {startup.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3.5">
                    <img
                      src={member.avatarUrl}
                      alt={`Foto de ${member.name}`}
                      className="w-11 h-11 rounded-full object-cover border border-gray-100 shadow-sm"
                    />
                    <div>
                      <span className="flex items-center gap-1.5 font-bold text-graphite text-sm leading-tight">
                        {member.name}
                        {member.isLeader && <span title="Responsável principal"><Award className="w-3.5 h-3.5 text-fox" /></span>}
                      </span>
                      <span className="block text-xs font-medium text-fox mt-0.5">
                        {member.role === 'Outro' && member.customRole ? member.customRole : member.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Modais de Entregável ─────────────────────────────── */}
      <AnimatePresence>
        {submitTypeId && (
          <SubmitDeliverableModal
            typeId={submitTypeId}
            startupId={startup.id}
            onClose={() => setSubmitTypeId(null)}
            onSaved={async () => {
              toast('Entregável enviado para análise com sucesso!', 'success');
              await refetch();
            }}
          />
        )}
        {reviewState && (
          <ReviewDeliverableModal
            typeId={reviewState.typeId}
            startupId={startup.id}
            startupName={startup.name}
            action={reviewState.action}
            adminName={user?.name || 'Admin'}
            onClose={() => setReviewState(null)}
            onSaved={async () => {
              toast(
                reviewState.action === 'approved'
                  ? 'Entregável aprovado com sucesso!'
                  : 'Entregável rejeitado.',
                reviewState.action === 'approved' ? 'success' : 'info'
              );
              await refetch();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
