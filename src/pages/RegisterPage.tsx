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
} from 'lucide-react';
import { onboardingService } from '../services/onboardingService';

interface RegisterPageProps {
  onBackToLogin: () => void;
  onRegisterSuccess: () => void;
}

// ── Helpers de validação ─────────────────────────────────────────────────────

const cleanDigits = (value: string) => value.replace(/\D/g, '');

const formatCnpj = (value: string) => {
  const d = cleanDigits(value).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

const formatCpf = (value: string) => {
  const d = cleanDigits(value).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
};

const isValidCnpj = (cnpj: string) => cleanDigits(cnpj).length === 14;
const isValidCpf  = (cpf: string)  => cleanDigits(cpf).length === 11;
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ── Tipos de estado do formulário ────────────────────────────────────────────

interface FormState {
  // Empresa
  companyName: string;
  cnpj: string;
  // Manager (responsável RH)
  managerName: string;
  cpf: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  companyName?: string;
  cnpj?: string;
  managerName?: string;
  cpf?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

// ── Componente principal ─────────────────────────────────────────────────────

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onBackToLogin,
  onRegisterSuccess,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormState>({
    companyName:     '',
    cnpj:            '',
    managerName:     '',
    cpf:             '',
    email:           '',
    password:        '',
    confirmPassword: '',
  });
  const [errors, setErrors]         = useState<FormErrors>({});
  const [showPwd, setShowPwd]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [apiError, setApiError]     = useState('');
  const [success, setSuccess]       = useState(false);

  // ── Atualização genérica de campos ────────────────────────────────────────

  const set = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setApiError('');
  };

  // ── Validação por etapa ───────────────────────────────────────────────────

  const validateStep1 = (): boolean => {
    const e: FormErrors = {};
    if (!form.companyName.trim())       e.companyName = 'Informe o nome da empresa.';
    if (!isValidCnpj(form.cnpj))        e.cnpj = 'CNPJ inválido — informe os 14 dígitos.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: FormErrors = {};
    if (!form.managerName.trim())           e.managerName = 'Informe o nome completo.';
    if (!isValidCpf(form.cpf))              e.cpf = 'CPF inválido — informe os 11 dígitos.';
    if (!isValidEmail(form.email))          e.email = 'E-mail inválido.';
    if (form.password.length < 8)           e.password = 'A senha deve ter pelo menos 8 caracteres.';
    if (form.password !== form.confirmPassword)
                                            e.confirmPassword = 'As senhas não coincidem.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Avançar etapa ─────────────────────────────────────────────────────────

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  // ── Submissão final ───────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    setApiError('');

    try {
      await onboardingService.register({
        company: {
          name: form.companyName.trim(),
          cnpj: cleanDigits(form.cnpj),
        },
        manager: {
          name:     form.managerName.trim(),
          cpf:      cleanDigits(form.cpf),
          email:    form.email.trim().toLowerCase(),
          password: form.password,
        },
      });

      setSuccess(true);
      // Redireciona para o login após 3 segundos
      setTimeout(() => onRegisterSuccess(), 3000);
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.message ?? err?.response?.data?.detail ?? '';

      if (status === 409) {
        setApiError('Empresa ou e-mail já cadastrado. Verifique os dados ou faça login.');
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl mb-5">
            <CheckCircle2 className="w-9 h-9 text-emerald-500" />
          </div>
          <h2 className="font-black text-xl text-slate-800 dark:text-slate-100 mb-2">
            Cadastro realizado!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Empresa e conta de acesso criados com sucesso. Redirecionando para o login...
          </p>
          <div className="flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
          </div>
        </div>
      </div>
    );
  }

  // ── Indicador de progresso ────────────────────────────────────────────────

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-3 mb-6">
      {([1, 2] as const).map((s) => (
        <React.Fragment key={s}>
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all
              ${s === step
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                : s < step
                ? 'bg-emerald-200 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
          >
            {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
          </div>
          {s < 2 && (
            <div
              className={`h-0.5 w-10 rounded transition-all ${
                step > s ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // ── Campo reutilizável ────────────────────────────────────────────────────

  const Field = ({
    label,
    icon: Icon,
    error,
    children,
  }: {
    label: string;
    icon: React.ElementType;
    error?: string;
    children: React.ReactNode;
  }) => (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
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

  const inputClass = (hasError?: string) =>
    `p-3 bg-slate-50 dark:bg-slate-950 border rounded-xl outline-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400
     focus:ring-1 transition-all disabled:opacity-50
     ${hasError
       ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
       : 'border-slate-200 dark:border-slate-800 focus:border-emerald-500 focus:ring-emerald-500'
     }`;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">

        {/* Header */}
        <div className="p-8 pb-6 text-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-black text-2xl tracking-tight">BNFix Benefícios</h1>
          <p className="text-emerald-100 text-xs mt-1">
            Cadastre sua empresa e comece a gerenciar benefícios
          </p>
        </div>

        {/* Body */}
        <div className="p-8 space-y-5">
          <div>
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">
              {step === 1 ? 'Dados da Empresa' : 'Acesso do Responsável (RH)'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {step === 1
                ? 'Informe o nome e CNPJ da empresa.'
                : 'Crie as credenciais de quem vai gerenciar os benefícios.'}
            </p>
          </div>

          <StepIndicator />

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
                  value={form.companyName}
                  onChange={(e) => set('companyName', e.target.value)}
                  className={inputClass(errors.companyName)}
                  autoFocus
                />
              </Field>

              <Field label="CNPJ" icon={CreditCard} error={errors.cnpj}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="00.000.000/0000-00"
                  value={form.cnpj}
                  onChange={(e) => set('cnpj', formatCnpj(e.target.value))}
                  className={inputClass(errors.cnpj)}
                  maxLength={18}
                />
              </Field>

              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
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
                  value={form.managerName}
                  onChange={(e) => set('managerName', e.target.value)}
                  className={inputClass(errors.managerName)}
                  disabled={loading}
                  autoFocus
                />
              </Field>

              <Field label="CPF" icon={CreditCard} error={errors.cpf}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={(e) => set('cpf', formatCpf(e.target.value))}
                  className={inputClass(errors.cpf)}
                  maxLength={14}
                  disabled={loading}
                />
              </Field>

              <Field label="E-mail corporativo" icon={Mail} error={errors.email}>
                <input
                  type="email"
                  placeholder="maria@empresa.com"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className={inputClass(errors.email)}
                  autoComplete="email"
                  disabled={loading}
                />
              </Field>

              <Field label="Senha" icon={Lock} error={errors.password}>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    className={`${inputClass(errors.password)} w-full pr-11`}
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
                    value={form.confirmPassword}
                    onChange={(e) => set('confirmPassword', e.target.value)}
                    className={`${inputClass(errors.confirmPassword)} w-full pr-11`}
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

              {/* Indicador de força da senha */}
              {form.password.length > 0 && (
                <PasswordStrength password={form.password} />
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
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

          {/* Link de volta ao login */}
          <p className="text-center text-[11px] text-slate-400">
            Já tem uma conta?{' '}
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-emerald-500 font-bold hover:underline cursor-pointer"
            >
              Entrar
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Indicador de força de senha ───────────────────────────────────────────────

const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;

  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400'];
  const labels = ['Muito fraca', 'Fraca', 'Razoável', 'Forte'];

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              i < strength ? colors[strength - 1] : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>
      <p className={`text-[10px] font-medium ${strength >= 3 ? 'text-emerald-500' : 'text-slate-400'}`}>
        {labels[strength - 1] ?? 'Digite uma senha'}
      </p>
    </div>
  );
};
