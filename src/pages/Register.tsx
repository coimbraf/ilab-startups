import React, { useState, useEffect } from 'react';
import { useUI } from '../contexts/UIContext';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { UserPlus, ArrowRight, ShieldCheck, Mail, Lock, User, Briefcase } from 'lucide-react';
import { validateInviteCode, registerWithInvitePayload, checkEmailWhitelisted } from '../data/supabaseService';
import { GooeyFilter } from '../components/GooeyFilter';

export default function Register() {
  const { toast, confirm } = useUI();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code') || '';

  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [track, setTrack] = useState('Negócios');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function checkCode() {
      if (!code) {
        setIsValid(false);
        setErrorMsg('Nenhum código de convite fornecido.');
        setIsValidating(false);
        return;
      }
      try {
        const result = await validateInviteCode(code);
        if (result.valid) {
          setIsValid(true);
        } else {
          setIsValid(false);
          setErrorMsg(result.reason || 'Convite inválido.');
        }
      } catch (err) {
        console.error('Validation error', err);
        setIsValid(false);
        setErrorMsg('Erro ao validar convite. Tente novamente.');
      } finally {
        setIsValidating(false);
      }
    }
    checkCode();
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !track) return;
    
    if (password.length < 8) {
      toast('A senha deve ter no mínimo 8 caracteres por segurança.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const isWhitelisted = await checkEmailWhitelisted(email);
      if (!isWhitelisted) {
        toast('Seu e-mail não está autorizado. Entre em contato com a coordenação do iLab.', 'error');
        setIsSubmitting(false);
        return;
      }

      await registerWithInvitePayload({ code, email, password, name, track });
      // Redirect to login or home
      toast('Conta criada com sucesso! Faça login para continuar.', 'success');
      navigate('/login');
    } catch (err: any) {
      console.error('Registration error', err);
      toast(err.message || 'Erro ao criar conta.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-[#FFFDF2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-fox/20 border-t-fox rounded-full animate-spin" />
          <p className="text-brown/50 font-bold uppercase tracking-widest text-sm">Validando convite...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-[#FFFDF2] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-red-100 text-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-red-500" />
          <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-50" />
          <h2 className="text-3xl font-playfair font-bold text-brown mb-2">Convite Inválido</h2>
          <p className="text-brown/60 mb-8">{errorMsg}</p>
          <Link to="/login" className="inline-flex items-center gap-2 bg-brown text-white px-6 py-3 rounded-full font-bold uppercase tracking-wider text-sm hover:bg-brown/90 transition-colors">
            Voltar para o Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF2] flex items-center justify-center p-4 relative overflow-hidden">
      <GooeyFilter id="register-goo" strength={15} />
      <div className="absolute -left-32 top-0 w-[500px] h-[500px] bg-fox/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute right-0 bottom-0 w-[600px] h-[600px] bg-gold/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_32px_rgba(42,22,23,0.04)] border border-white/60 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-fox/10 text-fox mb-4">
            <UserPlus className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-playfair font-bold text-brown mb-2">Crie sua Conta</h1>
          <p className="text-brown/50 text-sm">Você foi convidado para o ecossistema Sanfran iLab.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brown/50 uppercase tracking-widest mb-1.5">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brown/30" />
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-white border border-brown/10 rounded-xl pl-12 pr-4 py-3 text-brown focus:ring-2 focus:ring-fox/20 focus:border-fox outline-none transition-all" placeholder="Seu nome" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brown/50 uppercase tracking-widest mb-1.5">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brown/30" />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white border border-brown/10 rounded-xl pl-12 pr-4 py-3 text-brown focus:ring-2 focus:ring-fox/20 focus:border-fox outline-none transition-all" placeholder="seu@email.com" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brown/50 uppercase tracking-widest mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brown/30" />
              <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white border border-brown/10 rounded-xl pl-12 pr-4 py-3 text-brown focus:ring-2 focus:ring-fox/20 focus:border-fox outline-none transition-all" placeholder="Mínimo 6 caracteres" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brown/50 uppercase tracking-widest mb-1.5">Trilha</label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brown/30" />
              <select value={track} onChange={e => setTrack(e.target.value)} className="w-full bg-white border border-brown/10 rounded-xl pl-12 pr-4 py-3 text-brown font-semibold focus:ring-2 focus:ring-fox/20 focus:border-fox outline-none transition-all cursor-pointer appearance-none">
                <option value="Negócios">Negócios</option>
                <option value="Tech">Tech</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !name || !email || !password}
            className="w-full flex items-center justify-center gap-2 bg-fox text-white px-6 py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm shadow-[0_8px_20px_rgba(255,107,0,0.3)] hover:shadow-[0_12px_28px_rgba(255,107,0,0.4)] hover:bg-fox/90 active:scale-95 transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Cadastrando...' : 'Finalizar Cadastro'}
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
