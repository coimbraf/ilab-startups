import React, { useState } from 'react';
import { useUI } from '../../contexts/UIContext';
import { createStartup } from '../../data/supabaseService';
import { Loader2, Rocket, X } from 'lucide-react';
import { motion } from 'motion/react';

interface CreateStartupModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateStartupModal({ onClose, onCreated }: CreateStartupModalProps) {
  const { toast, confirm } = useUI();

  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortPitch: '',
    sector: '',
    cohort: new Date().getFullYear().toString() + '.' + (new Date().getMonth() > 5 ? '2' : '1'),
    leaderPhone: '',
    instagramUrl: '',
    linkedinUrl: '',
    websiteUrl: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await createStartup(formData);
      onCreated();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast('Erro ao criar startup: ' + (err.message || '', 'error'));
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="bg-fox/10 p-2 rounded-xl">
              <Rocket className="w-5 h-5 text-fox" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-graphite">Cadastrar Nova Startup</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Nome da Startup *</label>
              <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-fox/20" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Short Pitch</label>
              <input value={formData.shortPitch} onChange={e => setFormData({ ...formData, shortPitch: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-fox/20" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Descrição / Problema resolvido</label>
              <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-fox/20 resize-none" rows={3} />
            </div>
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Setor</label>
              <input value={formData.sector} onChange={e => setFormData({ ...formData, sector: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-fox/20" />
            </div>
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Ciclo (Cohort)</label>
              <input value={formData.cohort} onChange={e => setFormData({ ...formData, cohort: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-fox/20" />
            </div>
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">WhatsApp Líder</label>
              <input value={formData.leaderPhone} onChange={e => setFormData({ ...formData, leaderPhone: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-fox/20" />
            </div>
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Website</label>
              <input value={formData.websiteUrl} onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-fox/20" />
            </div>
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Instagram (URL)</label>
              <input value={formData.instagramUrl} onChange={e => setFormData({ ...formData, instagramUrl: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-fox/20" />
            </div>
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">LinkedIn (URL)</label>
              <input value={formData.linkedinUrl} onChange={e => setFormData({ ...formData, linkedinUrl: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-fox/20" />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={isProcessing} className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={isProcessing} className="flex-1 py-3 bg-fox text-white rounded-xl font-bold text-sm hover:bg-fox/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Startup'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
