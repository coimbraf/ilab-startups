import React, { useState, useEffect } from 'react';
import { useUI } from '../../contexts/UIContext';
import { getWhitelist, addWhitelistEmails, removeWhitelistEmail, getAllUserEmails } from '../../data/supabaseService';
import { CheckCircle, Clock, Trash2, Mail, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface WhitelistedEmail {
  email: string;
  added_at: string;
}

export default function WhitelistManager() {
  const { toast, confirm } = useUI();
  
  const [whitelist, setWhitelist] = useState<WhitelistedEmail[]>([]);
  const [registeredEmails, setRegisteredEmails] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [list, users] = await Promise.all([
        getWhitelist(),
        getAllUserEmails()
      ]);
      setWhitelist(list);
      setRegisteredEmails(new Set(users));
    } catch (err: any) {
      console.error(err);
      toast('Erro ao carregar whitelist.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async () => {
    if (!inputText.trim()) return;
    
    // Extract emails using regex
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const matches = inputText.match(emailRegex) || [];
    const validEmails = Array.from(new Set(matches.map(e => e.toLowerCase())));

    if (validEmails.length === 0) {
      return toast('Nenhum e-mail válido encontrado.', 'info');
    }

    setIsSubmitting(true);
    try {
      await addWhitelistEmails(validEmails);
      toast(`${validEmails.length} e-mail(s) adicionado(s) à whitelist.`, 'success');
      setInputText('');
      await loadData();
    } catch (err: any) {
      toast('Erro ao adicionar e-mails.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (email: string) => {
    if (await confirm('Tem certeza que deseja remover este e-mail da whitelist?', { title: 'Remover Autorização', danger: true })) {
      try {
        await removeWhitelistEmail(email);
        setWhitelist(prev => prev.filter(item => item.email !== email));
        toast('E-mail removido.', 'success');
      } catch (err) {
        toast('Erro ao remover e-mail.', 'error');
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-3xl font-playfair font-bold text-brown mb-2">Whitelist de Cadastro</h1>
        <p className="text-brown/60">Controle estrito de quais e-mails têm permissão para se cadastrar na plataforma.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-brown/10">
        <h2 className="text-lg font-bold text-brown mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-gold" />
          Adicionar E-mails
        </h2>
        <p className="text-sm text-brown/60 mb-4">
          Cole uma lista de e-mails (separados por vírgula, espaço ou quebra de linha). O sistema identificará automaticamente os e-mails válidos.
        </p>
        
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="exemplo@email.com, founder@startup.com..."
          className="w-full h-32 bg-cream/50 border border-brown/10 rounded-xl p-4 text-brown focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none resize-none transition-all mb-4"
        />

        <div className="flex justify-end">
          <button
            onClick={handleAdd}
            disabled={isSubmitting || !inputText.trim()}
            className="flex items-center gap-2 bg-brown text-white px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-brown/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Adicionar à Whitelist
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-brown/10">
        <div className="p-6 border-b border-brown/5 flex items-center justify-between">
          <h3 className="font-bold text-brown">E-mails Autorizados ({whitelist.length})</h3>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-fox border-t-transparent rounded-full animate-spin" />
          </div>
        ) : whitelist.length === 0 ? (
          <div className="p-12 text-center text-brown/50">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Nenhum e-mail na whitelist.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-cream/50">
                  <th className="px-6 py-4 text-xs font-bold text-brown/50 uppercase tracking-widest border-b border-brown/5">E-mail</th>
                  <th className="px-6 py-4 text-xs font-bold text-brown/50 uppercase tracking-widest border-b border-brown/5">Data de Inclusão</th>
                  <th className="px-6 py-4 text-xs font-bold text-brown/50 uppercase tracking-widest border-b border-brown/5">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-brown/50 uppercase tracking-widest border-b border-brown/5">Ações</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {whitelist.map((item) => {
                    const hasAccount = registeredEmails.has(item.email);
                    return (
                      <motion.tr 
                        key={item.email}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group hover:bg-cream/30 transition-colors border-b border-brown/5 last:border-0"
                      >
                        <td className="px-6 py-4 font-medium text-brown">
                          {item.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-brown/60">
                          {new Date(item.added_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4">
                          {hasAccount ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Cadastrado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fox/10 text-fox text-xs font-bold">
                              <Clock className="w-3.5 h-3.5" />
                              Pendente
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleRemove(item.email)}
                            className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover autorização"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
