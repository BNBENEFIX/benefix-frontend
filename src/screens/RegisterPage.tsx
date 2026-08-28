import React, { useState } from 'react';
import {
  Sparkles,
  UserPlus,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Building2,
  User,
  Mail,
  Lock,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from 'lucide-react';
import { onboardingService } from '../services/onboardingService';
import { useTheme } from '../contexts/ThemeContext';

interface RegisterPageProps {
  onBackToLogin: () => void;
  onRegisterSuccess: () => void;
}

// ── Helpers de máscara ────────────────────────────────────────────────────────

const onlyDigits = (v: string) => v.replace(/\D/g, '');

const displayCnpj = (digits: string): string => {
  const d = digits.slice(0, 14);
  if (d.length <= 2)  return d;
  if (d.length <= 5)  return `${d.slice(0,2)}.${d.slice(2)}`;
  if (d.length <= 8)  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
};

const displayCpf = (digits: string): string => {
  const d = digits.slice(0, 11);
  if (d.length <= 3)  return d;
  if (d.length <= 6)  return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9)  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
};

// ── Validação ─────────────────────────────────────────────────────────────────

const isValidCnpj  = (d: string) => d.length === 14;
const isValidCpf   = (d: string) => d.length === 11;
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// ── Sub-componentes definidos FORA do componente principal ────────────────────
// Definir componentes dentro do render body faz o React desmontar e remontar
// o DOM a cada render, destruindo o foco e a posição do cursor.

interface FieldProps {
  label: string;
  icon: React.ElementType;
  error?: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, icon: Icon, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">
      <Icon className="w-3 h-3" />
      {label}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-[11px] text-red-500">
        <AlertCircle className="w-3 h-3 shrink-0" />
        {error}
      </p>
    )}
  </div>
);

interface StepIndicatorProps {
  step: 1 | 2;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ step }) => (
  <div className="flex items-center justify-center gap-3 mb-6">
    {([1, 2] as const).map((s) => (
      <React.Fragment key={s}>
        <div
          className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all
            ${s === step
              ? 'bg-[var(--action)] text-[var(--action-ink)] shadow-md'
              : s < step
              ? 'bg-[var(--brand-soft)] text-[var(--brand-strong)]'
              : 'bg-[var(--surface-muted)] text-[var(--muted)]'
            }`}
        >
          {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
        </div>
        {s < 2 && (
          <div
            className={`h-0.5 w-10 rounded transition-all ${
              step > s ? 'bg-[var(--brand)]' : 'bg-[var(--line)]'
            }`}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

const inputCls = (hasError?: string) =>
  `p-3 bg-[var(--surface-muted)] border rounded-xl outline-none text-sm
   text-[var(--ink)] placeholder-[var(--muted)] focus:ring-1
   transition-all disabled:opacity-50 ${
     hasError
       ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
       : 'border-[var(--line)] focus:border-[var(--brand)] focus:ring-[var(--brand)]'
   }`;

// ── Indicador de força de senha ───────────────────────────────────────────────

const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
  const checks = [
    password.length >= 10,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;
  const colors   = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-[var(--brand)]'];
  const labels   = ['Muito fraca', 'Fraca', 'Razoável', 'Forte'];

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              i < strength ? colors[strength - 1] : 'bg-[var(--line)]'
            }`}
          />
        ))}
      </div>
      <p className={`text-[10px] font-medium ${strength >= 3 ? 'text-[var(--brand)]' : 'text-[var(--muted)]'}`}>
        {labels[strength - 1] ?? 'Digite uma senha'}
      </p>
    </div>
  );
};

// ── Tipos de estado ───────────────────────────────────────────────────────────

interface FormErrors {
  companyName?: string;
  cnpj?: string;
  managerName?: string;
  cpf?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

// ── Componente principal ──────────────────────────────────────────────────────

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onBackToLogin,
  onRegisterSuccess,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [step, setStep] = useState<1 | 2>(1);

  // Campos de texto simples
  const [companyName,     setCompanyName]     = useState('');
  const [managerName,     setManagerName]     = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Campos de máscara: armazenam apenas dígitos; exibição calculada no render
  const [cnpjDigits, setCnpjDigits] = useState('');
  const [cpfDigits,  setCpfDigits]  = useState('');

  const [errors,      setErrors]      = useState<FormErrors>({});
  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [apiError,    setApiError]    = useState('');
  const [success,     setSuccess]     = useState(false);

  // ── Handlers dos campos com máscara ───────────────────────────────────────

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpjDigits(onlyDigits(e.target.value).slice(0, 14));
    setErrors((prev) => ({ ...prev, cnpj: undefined }));
    setApiError('');
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpfDigits(onlyDigits(e.target.value).slice(0, 11));
    setErrors((prev) => ({ ...prev, cpf: undefined }));
    setApiError('');
  };

  // ── Validação ─────────────────────────────────────────────────────────────

  const validateStep1 = (): boolean => {
    const e: FormErrors = {};
    if (!companyName.trim())        e.companyName = 'Informe o nome da empresa.';
    if (!isValidCnpj(cnpjDigits))   e.cnpj = 'CNPJ inválido — informe os 14 dígitos.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: FormErrors = {};
    if (!managerName.trim())              e.managerName = 'Informe o nome completo.';
    if (!isValidCpf(cpfDigits))           e.cpf = 'CPF inválido — informe os 11 dígitos.';
    if (!isValidEmail(email))             e.email = 'E-mail inválido.';
    if (password.length < 10)             e.password = 'A senha deve ter pelo menos 10 caracteres.';
    if (password !== confirmPassword)     e.confirmPassword = 'As senhas não coincidem.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    setApiError('');

    try {
      await onboardingService.register({
        company: { name: companyName.trim(), cnpj: cnpjDigits },
        manager: {
          name:     managerName.trim(),
          cpf:      cpfDigits,
          email:    email.trim().toLowerCase(),
          password,
        },
      });
      setSuccess(true);
      setTimeout(() => onRegisterSuccess(), 3000);
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.message ?? err?.response?.data?.detail ?? '';
      const normalizedDetail = detail.toLowerCase();
      if (normalizedDetail.includes('manager identity or credentials')) {
        setApiError('Já existe uma conta com este CPF ou e-mail. Use os mesmos dados e a mesma senha para vincular outra empresa.');
      } else if (status === 409) {
        setApiError('Empresa ou e-mail já cadastrado. Verifique os dados ou faça login.');
      } else if (normalizedDetail.includes('cnpj already')) {
        setApiError('Este CNPJ já está cadastrado. Entre na conta existente para continuar.');
      } else if (status === 400) {
        setApiError(detail || 'Dados inválidos. Revise as informações e tente novamente.');
      } else {
        setApiError('Não foi possível concluir o cadastro. Tente novamente em instantes.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Tela de sucesso ───────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--canvas)] p-4 sm:p-6">
        <button
          type="button"
          onClick={toggleTheme}
          className="fixed top-4 right-4 z-50 rounded-lg p-2.5 text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] transition-colors"
          aria-label="Alternar tema"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
        <div className="w-full max-w-md bg-[var(--surface)] rounded-3xl shadow-2xl border border-[var(--line)] overflow-hidden p-8 sm:p-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--brand-soft)] rounded-2xl mb-5">
            <CheckCircle2 className="w-9 h-9 text-[var(--brand)]" />
          </div>
          <h2 className="font-black text-xl text-[var(--ink)] mb-2">
            Empresa vinculada com sucesso!
          </h2>
          <p className="text-sm text-[var(--muted)] mb-6">
            Você já pode entrar com seus dados de acesso. Redirecionando para o login...
          </p>
          <div className="flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--brand)]" />
          </div>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-[var(--canvas)] p-4 sm:p-6">
      <button
        type="button"
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 rounded-lg p-2.5 text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] transition-colors"
        aria-label="Alternar tema"
      >
        {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </button>
      <div className="w-full max-w-md bg-[var(--surface)] rounded-3xl shadow-2xl border border-[var(--line)] overflow-hidden max-h-[95dvh] overflow-y-auto">

        {/* Header */}
        <div className="p-6 sm:p-8 pb-5 sm:pb-6 text-center bg-[var(--action)] text-[var(--action-ink)]">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-2xl mb-3 sm:mb-4">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <h1 className="font-black text-xl sm:text-2xl tracking-tight">BNFix Benefícios</h1>
          <p className="text-white/80 text-xs mt-1">
            Cadastre sua empresa e comece a gerenciar benefícios
          </p>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-8 space-y-5">
          <div>
            <h2 className="font-bold text-lg text-[var(--ink)]">
              {step === 1 ? 'Dados da Empresa' : 'Acesso do Responsável (RH)'}
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {step === 1
                ? 'Informe o nome e CNPJ da empresa.'
                : 'Crie as credenciais de quem vai gerenciar os benefícios.'}
            </p>
          </div>

          <StepIndicator step={step} />

          {/* Erro da API */}
          {apiError && (
            <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {/* ── Etapa 1: Empresa ── */}
          {step === 1 && (
            <div className="space-y-4">
              <Field label="Nome da empresa" icon={Building2} error={errors.companyName}>
                <input
                  type="text"
                  placeholder="Acme Corporação Ltda"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    setErrors((p) => ({ ...p, companyName: undefined }));
                  }}
                  className={inputCls(errors.companyName)}
                  autoFocus
                />
              </Field>

              <Field label="CNPJ" icon={CreditCard} error={errors.cnpj}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="00.000.000/0000-00"
                  value={displayCnpj(cnpjDigits)}
                  onChange={handleCnpjChange}
                  className={inputCls(errors.cnpj)}
                />
              </Field>

              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3 bg-[var(--action)] hover:bg-[var(--action-hover)] text-[var(--action-ink)] font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Próximo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Etapa 2: Manager ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Nome completo" icon={User} error={errors.managerName}>
                <input
                  type="text"
                  placeholder="Maria Silva"
                  value={managerName}
                  onChange={(e) => {
                    setManagerName(e.target.value);
                    setErrors((p) => ({ ...p, managerName: undefined }));
                  }}
                  className={inputCls(errors.managerName)}
                  disabled={loading}
                  autoFocus
                />
              </Field>

              <Field label="CPF" icon={CreditCard} error={errors.cpf}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={displayCpf(cpfDigits)}
                  onChange={handleCpfChange}
                  className={inputCls(errors.cpf)}
                  disabled={loading}
                />
              </Field>

              <Field label="E-mail corporativo" icon={Mail} error={errors.email}>
                <input
                  type="email"
                  placeholder="maria@empresa.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((p) => ({ ...p, email: undefined }));
                  }}
                  className={inputCls(errors.email)}
                  autoComplete="email"
                  disabled={loading}
                />
              </Field>

              <Field label="Senha" icon={Lock} error={errors.password}>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Mínimo 10 caracteres"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((p) => ({ ...p, password: undefined }));
                    }}
                    className={`${inputCls(errors.password)} w-full pr-11`}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              <Field label="Confirmar senha" icon={Lock} error={errors.confirmPassword}>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors((p) => ({ ...p, confirmPassword: undefined }));
                    }}
                    className={`${inputCls(errors.confirmPassword)} w-full pr-11`}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              {password.length > 0 && <PasswordStrength password={password} />}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1 py-3 bg-[var(--surface-muted)] hover:bg-[var(--line)] text-[var(--ink)] font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-3 bg-[var(--action)] hover:bg-[var(--action-hover)] disabled:opacity-60 text-[var(--action-ink)] font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Cadastrando...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Criar conta</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-[11px] text-[var(--muted)]">
            Já tem uma conta?{' '}
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-[var(--brand)] font-bold hover:underline cursor-pointer"
            >
              Entrar
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
