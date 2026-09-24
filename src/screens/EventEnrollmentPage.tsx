'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  User,
  UserPlus,
} from 'lucide-react';
import { enrollmentService } from '../services/enrollmentService';
import { useTheme } from '../contexts/ThemeContext';

// ── Helpers de máscara (CPF sempre enviado sem máscara) ───────────────────────

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const displayCpf = (digits: string): string => {
  const d = digits.slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const PASSWORD_MIN = 10;
const PASSWORD_MAX = 72;
const AUTH_NOTICE_KEY = 'bnfix_auth_notice';

// ── Sub-componentes (definidos fora do render para preservar foco/cursor) ─────

interface FieldProps {
  label: string;
  htmlFor: string;
  icon: React.ElementType;
  error?: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, htmlFor, icon: Icon, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]"
    >
      <Icon className="h-3 w-3" />
      {label}
    </label>
    {children}
    {error && (
      <p role="alert" className="flex items-center gap-1 text-[11px] text-red-500">
        <AlertCircle className="h-3 w-3 shrink-0" />
        {error}
      </p>
    )}
  </div>
);

const inputCls = (hasError?: string) =>
  `h-12 w-full rounded-xl border bg-[var(--surface-muted)] px-3.5 text-sm text-[var(--ink)] outline-none
   placeholder:text-[var(--muted)] transition-all focus:ring-1 disabled:opacity-50 ${
     hasError
       ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
       : 'border-[var(--line)] focus:border-[var(--brand)] focus:ring-[var(--brand)]'
   }`;

interface FormErrors {
  name?: string;
  cpf?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  consent?: string;
}

// ── Componente principal ──────────────────────────────────────────────────────

export const EventEnrollmentPage: React.FC = () => {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState('');
  const [cpfDigits, setCpfDigits] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consent, setConsent] = useState(false);

  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setApiError('');
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!name.trim()) next.name = 'Informe seu nome completo.';
    if (cpfDigits.length !== 11) next.cpf = 'CPF inválido — informe os 11 dígitos.';
    if (!isValidEmail(email.trim())) next.email = 'E-mail inválido.';
    if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
      next.password = `A senha deve ter entre ${PASSWORD_MIN} e ${PASSWORD_MAX} caracteres.`;
    }
    if (password !== confirmPassword) next.confirmPassword = 'As senhas não coincidem.';
    if (!consent) next.consent = 'É necessário aceitar o tratamento de dados para continuar.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setApiError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await enrollmentService.enroll({
        name: name.trim(),
        cpf: cpfDigits,
        email: email.trim().toLowerCase(),
        password,
      });
      sessionStorage.setItem(
        AUTH_NOTICE_KEY,
        'Cadastro concluído! Entre com seu e-mail e senha para acessar.',
      );
      setSuccess(true);
      window.setTimeout(() => router.replace('/entrar'), 1600);
    } catch (err: any) {
      const status: number | undefined = err?.response?.status;
      const message: string = err?.response?.data?.message ?? '';
      const lower = message.toLowerCase();

      if (status === 404) {
        setUnavailable(true);
        return;
      }
      if (status === 429) {
        setApiError('Muitas tentativas. Aguarde alguns segundos e tente novamente.');
        return;
      }
      if (status === 409) {
        if (lower.includes('email')) setErrors({ email: 'Este e-mail já está cadastrado.' });
        else if (lower.includes('cpf')) setErrors({ cpf: 'Este CPF já está cadastrado.' });
        else setApiError(message || 'Estes dados já estão cadastrados.');
        return;
      }
      if (status === 400) {
        if (lower.includes('cpf')) setErrors({ cpf: 'CPF inválido.' });
        else if (lower.includes('password')) {
          setErrors({ password: `A senha deve ter entre ${PASSWORD_MIN} e ${PASSWORD_MAX} caracteres.` });
        } else if (lower.includes('email')) setErrors({ email: 'E-mail inválido.' });
        else if (lower.includes('name')) setErrors({ name: 'Informe seu nome completo.' });
        else setApiError(message || 'Dados inválidos. Revise as informações e tente novamente.');
        return;
      }
      setApiError('Não foi possível concluir o cadastro. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  };

  const themeToggle = (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Alternar tema"
      className="fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-50 rounded-lg p-2.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
    >
      {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );

  // ── Evento indisponível (404) ──────────────────────────────────────────────
  if (unavailable) {
    return (
      <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-[var(--canvas)] p-4 sm:p-6">
        {themeToggle}
        <div className="w-full max-w-md rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center shadow-2xl sm:p-10">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
            <AlertCircle className="h-9 w-9 text-[var(--accent)]" />
          </div>
          <h1 className="text-xl font-black text-[var(--ink)]">Inscrição indisponível</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            O cadastro do evento não está disponível no momento. Procure a organização para
            mais informações.
          </p>
        </div>
      </div>
    );
  }

  // ── Sucesso ────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-[var(--canvas)] p-4 sm:p-6">
        {themeToggle}
        <div className="w-full max-w-md rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center shadow-2xl sm:p-10">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-soft)]">
            <CheckCircle2 className="h-9 w-9 text-[var(--brand)]" />
          </div>
          <h1 className="text-xl font-black text-[var(--ink)]">Cadastro concluído!</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Agora é só entrar com seu e-mail e senha. Redirecionando para o login...
          </p>
          <div className="mt-6 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--brand)]" />
          </div>
        </div>
      </div>
    );
  }

  // ── Formulário ─────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-[var(--canvas)] p-4 sm:p-6">
      {themeToggle}
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl">
        <div className="bg-[var(--action)] p-6 pb-5 text-center text-[var(--action-ink)] sm:p-8 sm:pb-6">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 sm:h-14 sm:w-14">
            <BadgeCheck className="h-6 w-6 text-white sm:h-7 sm:w-7" />
          </div>
          <h1 className="text-xl font-black tracking-tight sm:text-2xl">Inscrição no evento</h1>
          <p className="mt-1 text-xs text-white/80">
            Preencha seus dados para participar e acessar os benefícios
          </p>
        </div>

        <div className="space-y-5 p-5 sm:p-8">
          {apiError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-400"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field label="Nome completo" htmlFor="event-name" icon={User} error={errors.name}>
              <input
                id="event-name"
                type="text"
                placeholder="Maria Silva"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearError('name');
                }}
                className={inputCls(errors.name)}
                autoComplete="name"
                autoFocus
                disabled={loading}
              />
            </Field>

            <Field label="CPF" htmlFor="event-cpf" icon={CreditCard} error={errors.cpf}>
              <input
                id="event-cpf"
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={displayCpf(cpfDigits)}
                onChange={(e) => {
                  setCpfDigits(onlyDigits(e.target.value).slice(0, 11));
                  clearError('cpf');
                }}
                className={inputCls(errors.cpf)}
                autoComplete="off"
                disabled={loading}
              />
            </Field>

            <Field label="E-mail" htmlFor="event-email" icon={Mail} error={errors.email}>
              <input
                id="event-email"
                type="email"
                placeholder="maria@exemplo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError('email');
                }}
                className={inputCls(errors.email)}
                autoComplete="email"
                disabled={loading}
              />
            </Field>

            <Field label="Senha" htmlFor="event-password" icon={Lock} error={errors.password}>
              <div className="relative">
                <input
                  id="event-password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Entre 10 e 72 caracteres"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError('password');
                  }}
                  className={`${inputCls(errors.password)} pr-11`}
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <Field
              label="Confirmar senha"
              htmlFor="event-confirm"
              icon={Lock}
              error={errors.confirmPassword}
            >
              <div className="relative">
                <input
                  id="event-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearError('confirmPassword');
                  }}
                  className={`${inputCls(errors.confirmPassword)} pr-11`}
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <div>
              <label
                htmlFor="event-consent"
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 ${
                  errors.consent ? 'border-red-400' : 'border-[var(--line)]'
                }`}
              >
                <input
                  id="event-consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    clearError('consent');
                  }}
                  disabled={loading}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--brand)]"
                />
                <span className="text-xs leading-5 text-[var(--muted)]">
                  Autorizo o tratamento dos meus dados pessoais para fins de participação no
                  evento e acesso aos benefícios, conforme a LGPD.
                </span>
              </label>
              {errors.consent && (
                <p role="alert" className="mt-1.5 flex items-center gap-1 text-[11px] text-red-500">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.consent}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--action)] text-sm font-bold text-[var(--action-ink)] shadow-md transition-all hover:bg-[var(--action-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Criar cadastro</span>
                </>
              )}
            </button>
          </form>

          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-[var(--muted)]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Seus dados são usados apenas para o cadastro no evento.
          </p>
        </div>
      </div>
    </div>
  );
};
