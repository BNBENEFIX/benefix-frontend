import React, { useState, useRef, useCallback } from 'react';
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

// ── Helpers de máscara ────────────────────────────────────────────────────────
// Recebem APENAS dígitos e retornam a string formatada para exibição.

const cleanDigits = (value: string) => value.replace(/\D/g, '');

const applyMaskCnpj = (digits: string): string => {
  const d = digits.slice(0, 14);
  if (d.length <= 2)  return d;
  if (d.length <= 5)  return `${d.slice(0,2)}.${d.slice(2)}`;
  if (d.length <= 8)  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
};

const applyMaskCpf = (digits: string): string => {
  const d = digits.slice(0, 11);
  if (d.length <= 3)  return d;
  if (d.length <= 6)  return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9)  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
};

// ── Validação ─────────────────────────────────────────────────────────────────

const isValidCnpj  = (digits: string) => digits.length === 14;
const isValidCpf   = (digits: string) => digits.length === 11;
const isValidEmail = (email: string)  => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ── Hook para input com máscara sem salto de cursor ───────────────────────────
// Armazena os dígitos brutos no estado e usa uma ref para restaurar a posição
// correta do cursor após a re-renderização do React.

function useMaskedInput(
  applyMask: (digits: string) => string,
  maxDigits: number,
) {
  const [digits, setDigits] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  // Guarda a posição desejada do cursor para restaurar depois do render
  const cursorPos = useRef<number | null>(null);

  // Após cada render, restaura a posição do cursor se há uma pendente
  const syncCursor = useCallback(() => {
    if (cursorPos.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(cursorPos.current, cursorPos.current);
      cursorPos.current = null;
    }
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const el = e.currentTarget;
      const selEnd = el.selectionEnd ?? el.value.length;

      // Conta quantos dígitos existem antes do cursor na string formatada atual
      const charsBeforeCursor = el.value.slice(0, selEnd);
      const digitsBeforeCursor = charsBeforeCursor.replace(/\D/g, '').length;

      // Novos dígitos brutos
      const newDigits = cleanDigits(el.value).slice(0, maxDigits);
      setDigits(newDigits);

      // Calcula onde o cursor deve ficar na nova string formatada:
      // avança pela string formatada contando dígitos até bater o alvo
      const newFormatted = applyMask(newDigits);
      let count = 0;
      let newPos = newFormatted.length;
      for (let i = 0; i < newFormatted.length; i++) {
        if (/\d/.test(newFormatted[i])) {
          count++;
          if (count === digitsBeforeCursor) {
            newPos = i + 1;
            break;
          }
        }
      }

      cursorPos.current = newPos;
    },
    [applyMask, maxDigits],
  );

  return {
    digits,
    inputRef,
    displayValue: applyMask(digits),
    handleChange,
    syncCursor,
    reset: () => setDigits(''),
  };
}

// ── Tipos de estado do formulário ────────────────────────────────────────────

interface FormState {
  // Empresa
  companyName: string;
  // Manager (responsável RH)
  managerName: string;
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
    managerName:     '',
    email:           '',
    password:        '',
    confirmPassword: '',
  });
  const [errors, setErrors]           = useState<FormErrors>({});
  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [apiError, setApiError]       = useState('');
  const [success, setSuccess]         = useState(false);

  // Campos com máscara (gerenciados separadamente para evitar salto de cursor)
  const cnpj = useMaskedInput(applyMaskCnpj, 14);
  const cpf  = useMaskedInput(applyMaskCpf, 11);

  // ── Atualização genérica de campos ────────────────────────────────────────

  const set = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setApiError('');
  };

  const clearFieldError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setApiError('');
  };

  // ── Validação por etapa ───────────────────────────────────────────────────

  const validateStep1 = (): boolean => {
    const e: FormErrors = {};
    if (!form.companyName.trim())    e.companyName = 'Informe o nome da empresa.';
    if (!isValidCnpj(cnpj.digits))   e.cnpj = 'CNPJ inválido — informe os 14 dígitos.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: FormErrors = {};
    if (!form.managerName.trim())            e.managerName = 'Informe o nome completo.';
    if (!isValidCpf(cpf.digits))             e.cpf = 'CPF inválido — informe os 11 dígitos.';
    if (!isValidEmail(form.email))           e.email = 'E-mail inválido.';
    if (form.password.length < 8)            e.password = 'A senha deve ter pelo menos 8 caracteres.';
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
          cnpj: cnpj.digits,
        },
        manager: {
          name:     form.managerName.trim(),
          cpf:      cpf.digits,
          email:    form.email.trim().toLowerCase(),
          password: form.password,
        },
      });

      setSuccess(true);
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
                  ref={cnpj.inputRef}
                  type="text"
                  inputMode="numeric"
                  placeholder="00.000.000/0000-00"
                  value={cnpj.displayValue}
                  onChange={(e) => { cnpj.handleChange(e); clearFieldError('cnpj'); }}
                  onKeyUp={cnpj.syncCursor}
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
                  ref={cpf.inputRef}
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={cpf.displayValue}
                  onChange={(e) => { cpf.handleChange(e); clearFieldError('cpf'); }}
                  onKeyUp={cpf.syncCursor}
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
