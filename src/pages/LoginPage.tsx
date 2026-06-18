import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, LogIn, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha.');
      return;
    }

    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);

    if (result.success) {
      onLoginSuccess();
    } else {
      setError(result.message ?? 'E-mail ou senha incorretos.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
      {/* Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">

        {/* Header */}
        <div className="p-8 pb-6 text-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-black text-2xl tracking-tight">BNFix Benefícios</h1>
          <p className="text-emerald-100 text-xs mt-1">
            Plataforma corporativa de gestão de benefícios
          </p>
        </div>

        {/* Form */}
        <div className="p-8 space-y-5">
          <div>
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Entrar na plataforma</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Use as credenciais fornecidas pelo administrador da sua empresa.
            </p>
          </div>

          {/* Alerta de erro */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-mail */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                E-mail corporativo
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
              />
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full p-3 pr-11 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botão submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrar</span>
                </>
              )}
            </button>
          </form>

          {/* Onboarding hint */}
          <p className="text-center text-[10px] text-slate-400 leading-relaxed">
            Sua empresa ainda não tem conta?{' '}
            <a
              href="mailto:contato@bnfix.com.br"
              className="text-emerald-500 font-bold hover:underline"
            >
              Solicite o cadastro
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
