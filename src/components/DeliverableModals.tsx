// Modais compartilhados de entregáveis — usados por FounderPanel e
// StartupDetail (substituem os antigos prompt()/alert() nativos).
import { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { deliverableTypes } from '../data/mockData';
import { submitDeliverable, reviewDeliverable } from '../data/supabaseService';
import { cn } from '../lib/utils';

// ─── Modal de Submissão (founder) ─────────────────────────────────────────────
interface SubmitProps {
  typeId: string;
  startupId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function SubmitDeliverableModal({ typeId, startupId, onClose, onSaved }: SubmitProps) {
  const { isSessionValid } = useAuth();
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const type = deliverableTypes[typeId];

  const handleSubmit = async () => {
    if (type.requiresLink && !url) {
      setError('Link da evidência é obrigatório.');
      return;
    }

    // Check session validity before submission
    const sessionValid = await isSessionValid();
    if (!sessionValid) {
      setError('Sua sessão expirou. Por favor, faça login novamente.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await submitDeliverable(startupId, typeId, url, description);
      onSaved();
      onClose();
    } catch (err: any) {
      const errorMsg = err.message || err.toString();

      // Handle RLS/Auth specific errors
      if (errorMsg.includes('row-level security policy') || errorMsg.includes('policy')) {
        setError('Erro: Sua conta não tem permissão para enviar entregáveis. Verifique se você está vinculado como founder da startup.');
      } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
        setError('Erro: Sua sessão expirou. Por favor, faça login novamente.');
      } else {
        setError(`Erro ao enviar: ${errorMsg}`);
      }
      console.error('[SubmitDeliverableModal] Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl"
      >
        <h3 className="font-bold text-xl text-navy mb-1">Submeter: {type.title}</h3>
        <p className="text-sm text-gray-500 mb-6">{type.description}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Link da Evidência {type.requiresLink ? '*' : '(Opcional)'}</label>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Descrição Breve (Opcional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Explique o que foi feito..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold bg-gray-50 hover:bg-gray-100 rounded-xl text-sm">Cancelar</button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-3 text-white font-bold bg-navy hover:bg-navy/90 rounded-xl text-sm flex items-center justify-center gap-2">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Enviar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal de Revisão (admin — aprovar/rejeitar) ──────────────────────────────
interface ReviewProps {
  typeId: string;
  startupId: string;
  startupName?: string;
  action: 'approved' | 'rejected';
  adminName: string;
  onClose: () => void;
  onSaved: () => void;
}

export function ReviewDeliverableModal({ typeId, startupId, startupName, action, adminName, onClose, onSaved }: ReviewProps) {
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const type = deliverableTypes[typeId];

  const handleConfirm = async () => {
    if (action === 'rejected' && !notes.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      await reviewDeliverable(startupId, typeId, action, notes, type?.xpValue || 0, adminName);
      onSaved();
      onClose();
    } catch (err: any) {
      const errorMsg = err.message || err.toString();
      if (errorMsg.includes('row-level security policy') || errorMsg.includes('policy')) {
        setError('Erro: Falha ao processar a revisão. Verifique se a sua conta tem permissão de admin.');
      } else {
        setError('Erro ao processar: ' + errorMsg);
      }
      console.error('[ReviewDeliverableModal] Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

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
          'p-6 rounded-t-2xl flex items-center gap-3',
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
              {type?.title}{startupName ? ` — ${startupName}` : ''}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
              {error}
            </div>
          )}
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
            onClick={handleConfirm}
            disabled={isProcessing || (action === 'rejected' && !notes.trim())}
            className={cn(
              'flex-1 py-3 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50',
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
