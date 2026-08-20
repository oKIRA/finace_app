import React, { useState } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  CreditCard,
  PieChart,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  User,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInAsGuest,
    signInAnonymously,
    errorMessage,
    clearError,
  } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const displayedError = errorMsg || errorMessage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setErrorMsg('Email ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Este email já está em uso.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
      } else if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
        setErrorMsg('No Firebase Console do seu projeto, ative "Email/Password" em Authentication > Sign-in method.');
      } else {
        setErrorMsg(err.message || 'Erro ao autenticar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    clearError();
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      // Message already captured in context
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setErrorMsg(null);
    clearError();
    setLoading(true);
    try {
      await signInAsGuest();
    } catch (err: any) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-emerald-500 selection:text-white">
      {/* Background Glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-emerald-900/40 mb-3">
            <img src="/assets/finance-app-logo.svg" alt="Finance App" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Controle Financeiro
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs mx-auto">
            Gestão completa de contas bancárias, cartões de crédito, orçamentos e metas
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
          {displayedError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-between gap-2">
              <span>{displayedError}</span>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  clearError();
                }}
                className="text-rose-400 hover:text-white text-xs underline font-bold"
              >
                fechar
              </button>
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            id="btn-google-login"
            className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-xs disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Entrar com Conta Google
          </button>

          {isIframe && (
            <div className="mt-2 text-center">
              <a
                href={window.location.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                <span>Abrir app em nova aba para login Google</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ou</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Seu Nome
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como prefere ser chamado?"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="btn-submit-auth"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-900/30 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>Carregando...</span>
              ) : isSignUp ? (
                <>Criar Minha Conta Gratuita <ArrowRight className="w-3.5 h-3.5" /></>
              ) : (
                <>Acessar Meu Painel <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </form>

          {/* Toggle Login / SignUp */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
              }}
              className="text-xs text-slate-400 hover:text-emerald-400 font-semibold"
            >
              {isSignUp
                ? 'Já possui uma conta? Faça login'
                : 'Não tem uma conta? Crie gratuitamente'}
            </button>
          </div>

          {/* Guest / Demo Access Button */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={handleGuestSignIn}
              disabled={loading}
              id="btn-guest-mode"
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Explorar como Convidado (Modo Demonstração)
            </button>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 mt-6 text-slate-500 text-[11px]">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Banco de dados seguro e isolado com Firestore</span>
        </div>
      </div>
    </div>
  );
};
