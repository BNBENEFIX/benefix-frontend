import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Eye, EyeOff, AlertCircle, Loader2, Check, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onNavigateToRegister?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigateToRegister }) => {
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
    <main className="min-h-screen bg-[#f6f5f1] dark:bg-[#111713] lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,.92fr)]">
      <section className="relative hidden overflow-hidden bg-[#12372a] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-20 xl:py-14">
        <div className="absolute -bottom-24 -right-20 h-80 w-80 rounded-full border border-white/10" />
        <div className="absolute -bottom-8 -right-2 h-52 w-52 rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3">
          <img src="/favicon.png" alt="" className="h-10 w-10 rounded-lg bg-white object-contain p-1" />
          <div>
            <div className="text-lg font-semibold tracking-tight">BNFix</div>
            <div className="text-xs text-emerald-100/70">Benefícios corporativos</div>
          </div>
        </div>

        <div className="relative max-w-xl">
          <p className="mb-5 text-sm font-semibold text-emerald-200">Gestão de benefícios, sem ruído</p>
          <h1 className="font-display text-5xl leading-[1.08] tracking-[-0.025em] xl:text-6xl">
            Uma experiência melhor para quem cuida e para quem usa.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-emerald-50/70">
            Organize benefícios, acompanhe adesões e dê autonomia às pessoas em um único lugar.
          </p>
          <ul className="mt-9 grid gap-3 text-sm text-emerald-50/85">
            {['Catálogo centralizado', 'Gestão por perfil de acesso', 'Informações claras para o RH'].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-emerald-100/60">
          <ShieldCheck className="h-4 w-4" />
          Acesso protegido e individual
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <img src="/favicon.png" alt="" className="h-10 w-10 rounded-lg bg-white object-contain p-1 shadow-sm" />
            <div>
              <div className="font-semibold text-[#17201c] dark:text-white">BNFix</div>
              <div className="text-xs text-[#66716b]">Benefícios corporativos</div>
            </div>
          </div>

          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold text-[#23664e] dark:text-[#75b695]">Bem-vindo de volta</p>
            <h2 className="text-3xl font-semibold tracking-[-0.025em] text-[#17201c] dark:text-white">Entre na sua conta</h2>
            <p className="mt-2 text-sm leading-6 text-[#66716b] dark:text-[#a8b2ac]">
              Use o e-mail corporativo cadastrado pela sua empresa.
            </p>
          </div>

          {error && (
            <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-[#35413b] dark:text-[#dce4df]">
                E-mail corporativo
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="nome@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-12 rounded-lg border border-[#cfd5d0] bg-white px-3.5 text-sm text-[#17201c] outline-none placeholder:text-[#9aa39e] focus:border-[#23664e] focus:ring-2 focus:ring-[#23664e]/15 disabled:opacity-50 dark:border-[#344039] dark:bg-[#18201b] dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium text-[#35413b] dark:text-[#dce4df]">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-12 w-full rounded-lg border border-[#cfd5d0] bg-white px-3.5 pr-11 text-sm text-[#17201c] outline-none placeholder:text-[#9aa39e] focus:border-[#23664e] focus:ring-2 focus:ring-[#23664e]/15 disabled:opacity-50 dark:border-[#344039] dark:bg-[#18201b] dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#66716b] hover:text-[#17201c]"
                  tabIndex={-1}
                  aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#194b3a] text-sm font-semibold text-white hover:bg-[#12372a] disabled:cursor-not-allowed disabled:opacity-60"
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

          <p className="mt-7 text-center text-sm leading-relaxed text-[#66716b] dark:text-[#a8b2ac]">
            Sua empresa ainda não tem conta?{' '}
            {onNavigateToRegister ? (
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="cursor-pointer font-semibold text-[#23664e] hover:underline dark:text-[#75b695]"
              >
                Cadastre-se agora
              </button>
            ) : (
              <a
                href="mailto:contato@bnfix.com.br"
                className="font-semibold text-[#23664e] hover:underline dark:text-[#75b695]"
              >
                Solicite o cadastro
              </a>
            )}
          </p>
        </div>
      </section>
    </main>
  );
};
