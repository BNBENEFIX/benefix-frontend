import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  Check,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  Pencil,
  Save,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Toast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { companyService } from '../services/companyService';
import { managerService } from '../services/managerService';
import type { BackendCompany, BackendManager } from '../types';

const formatCnpj = (value = '') => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length !== 14) return value || 'Não informado';
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};

const getApiError = (error: unknown, fallback: string) => {
  const candidate = error as { response?: { status?: number; data?: { message?: string } } };
  const message = candidate.response?.data?.message ?? '';
  const normalized = message.toLowerCase();

  if (normalized.includes('password is incorrect')) return 'A senha atual está incorreta.';
  if (normalized.includes('email already in use')) return 'Este e-mail já está vinculado a outra conta.';
  if (candidate.response?.status === 401) return 'Sua sessão expirou. Entre novamente para continuar.';
  return message || fallback;
};

const fieldClass = 'h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3.5 text-sm text-[var(--ink)] shadow-sm placeholder:text-[var(--muted)] disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)] disabled:text-[var(--muted)]';
const primaryButton = 'inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--action)] px-4 text-sm font-semibold text-[var(--action-ink)] hover:bg-[var(--action-hover)] disabled:cursor-not-allowed disabled:opacity-60';
const secondaryButton = 'inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60';

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const PasswordField: React.FC<PasswordFieldProps> = ({ label, id, ...props }) => {
  const [visible, setVisible] = useState(false);
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-sm font-medium text-[var(--ink)]">{label}</span>
      <span className="relative block">
        <input id={id} type={visible ? 'text' : 'password'} className={`${fieldClass} pr-11`} {...props} />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
};

export const CompanyProfile: React.FC = () => {
  const { user, logout, refreshCompanies } = useAuth();
  const [company, setCompany] = useState<BackendCompany | null>(null);
  const [manager, setManager] = useState<BackendManager | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [editingCompany, setEditingCompany] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [savingCompany, setSavingCompany] = useState(false);
  const [companyError, setCompanyError] = useState('');

  const [editingEmail, setEditingEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [endingSession, setEndingSession] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') =>
    setToast({ visible: true, message, type });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [companyData, managerData] = await Promise.all([
        companyService.getMyCompany(),
        managerService.getMe(),
      ]);
      setCompany(companyData);
      setManager(managerData);
      setCompanyName(companyData.name);
      setEmail(managerData.email || user?.email || '');
    } catch (error) {
      setLoadError(getApiError(error, 'Não foi possível carregar os dados da empresa.'));
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const initials = useMemo(() => {
    const source = company?.name ?? user?.companyName ?? 'Empresa';
    return source.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }, [company?.name, user?.companyName]);

  const passwordChecks = useMemo(() => [
    { label: '10 caracteres', valid: newPassword.length >= 10 },
    { label: 'uma letra maiúscula', valid: /[A-Z]/.test(newPassword) },
    { label: 'um número', valid: /\d/.test(newPassword) },
    { label: 'um símbolo', valid: /[^A-Za-z0-9]/.test(newPassword) },
  ], [newPassword]);

  const cancelCompanyEdit = () => {
    setEditingCompany(false);
    setCompanyName(company?.name ?? '');
    setCompanyError('');
  };

  const handleCompanySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedName = companyName.trim();
    setCompanyError('');
    if (normalizedName.length < 2) {
      setCompanyError('Informe um nome de empresa válido.');
      return;
    }

    setSavingCompany(true);
    try {
      const updated = await companyService.updateMine({ name: normalizedName });
      setCompany(updated);
      setCompanyName(updated.name);
      setEditingCompany(false);
      await refreshCompanies();
      showToast('Nome da empresa atualizado.');
    } catch (error) {
      setCompanyError(getApiError(error, 'Não foi possível atualizar o nome da empresa.'));
    } finally {
      setSavingCompany(false);
    }
  };

  const cancelEmailEdit = () => {
    setEditingEmail(false);
    setEmail(manager?.email ?? user?.email ?? '');
    setEmailPassword('');
    setEmailError('');
  };

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setEmailError('');
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setEmailError('Informe um e-mail válido.');
      return;
    }
    if (!emailPassword) {
      setEmailError('Informe sua senha atual para confirmar.');
      return;
    }

    setSavingEmail(true);
    try {
      await managerService.updateEmail({ email: normalizedEmail, currentPassword: emailPassword });
      setEndingSession(true);
      window.setTimeout(logout, 1600);
    } catch (error) {
      setEmailError(getApiError(error, 'Não foi possível atualizar o e-mail.'));
      setSavingEmail(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    if (!currentPassword) {
      setPasswordError('Informe sua senha atual.');
      return;
    }
    if (!passwordChecks.every((check) => check.valid)) {
      setPasswordError('A nova senha ainda não atende a todos os requisitos.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As novas senhas não coincidem.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('A nova senha deve ser diferente da senha atual.');
      return;
    }

    setSavingPassword(true);
    try {
      await managerService.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Senha atualizada com segurança.');
    } catch (error) {
      setPasswordError(getApiError(error, 'Não foi possível atualizar a senha.'));
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-[var(--muted)]">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--brand)]" />
          Carregando cadastro da empresa...
        </div>
      </div>
    );
  }

  if (loadError || !company) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-xl items-center px-4">
        <div className="w-full rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/60 dark:bg-red-950/30">
          <AlertCircle className="mx-auto h-7 w-7 text-red-600" />
          <p className="mt-3 text-sm font-semibold text-red-900 dark:text-red-200">{loadError || 'Empresa não encontrada.'}</p>
          <button type="button" onClick={loadProfile} className={`${secondaryButton} mt-5`}>Tentar novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[var(--canvas)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-[1080px]">
        <header className="overflow-hidden rounded-2xl bg-[var(--brand-strong)] text-white shadow-[0_20px_60px_-42px_rgba(18,55,42,0.9)]">
          <div className="relative px-5 py-7 sm:px-8 sm:py-9">
            <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-2 -top-12 h-40 w-40 rounded-full border border-white/10" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-xl font-bold tracking-tight sm:h-20 sm:w-20 sm:text-2xl">
                  {initials}
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-100/80">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Área do gestor
                  </div>
                  <h1 className="max-w-2xl text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">{company.name}</h1>
                  <p className="mt-1.5 text-sm text-emerald-50/70">Cadastro, identidade fiscal e segurança da conta.</p>
                </div>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200/20 bg-emerald-200/10 px-3 py-1.5 text-xs font-semibold text-emerald-50">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Empresa ativa
              </span>
            </div>
          </div>
        </header>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-5 sm:px-6">
              <div>
                <div className="flex items-center gap-2 text-[var(--ink)]">
                  <Building2 className="h-5 w-5 text-[var(--brand)]" />
                  <h2 className="text-base font-semibold">Dados da empresa</h2>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">Informações que identificam esta empresa na BNFix.</p>
              </div>
              {!editingCompany && (
                <button type="button" onClick={() => setEditingCompany(true)} className={secondaryButton}>
                  <Pencil className="h-4 w-4" />
                  <span className="hidden sm:inline">Editar nome</span>
                  <span className="sm:hidden">Editar</span>
                </button>
              )}
            </div>

            <form onSubmit={handleCompanySubmit} className="px-5 py-6 sm:px-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <label htmlFor="company-name" className="block sm:col-span-2">
                  <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-[var(--ink)]">
                    Nome da empresa
                    {editingCompany && <span className="text-xs font-normal text-[var(--muted)]">Editável</span>}
                  </span>
                  <input
                    id="company-name"
                    value={companyName}
                    disabled={!editingCompany || savingCompany}
                    onChange={(event) => setCompanyName(event.target.value)}
                    maxLength={160}
                    autoFocus={editingCompany}
                    className={fieldClass}
                  />
                </label>

                <div>
                  <span className="mb-1.5 block text-sm font-medium text-[var(--ink)]">CNPJ</span>
                  <div className="flex h-11 items-center gap-2.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-3.5 text-sm text-[var(--muted)]">
                    <Fingerprint className="h-4 w-4 shrink-0" />
                    <span className="font-mono tracking-tight">{formatCnpj(company.cnpj)}</span>
                    <LockKeyhole className="ml-auto h-3.5 w-3.5 shrink-0" />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[var(--muted)]">O CNPJ não pode ser alterado após o cadastro.</p>
                </div>

                <div>
                  <span className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Responsável pela conta</span>
                  <div className="flex h-11 items-center gap-2.5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-3.5 text-sm text-[var(--muted)]">
                    <BadgeCheck className="h-4 w-4 shrink-0 text-[var(--brand)]" />
                    <span className="truncate">{manager?.name ?? user?.name ?? 'Gestor'}</span>
                  </div>
                </div>
              </div>

              {companyError && (
                <p role="alert" className="mt-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />{companyError}
                </p>
              )}

              {editingCompany && (
                <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[var(--line)] pt-5 sm:flex-row sm:justify-end">
                  <button type="button" onClick={cancelCompanyEdit} disabled={savingCompany} className={secondaryButton}>
                    <X className="h-4 w-4" />Cancelar
                  </button>
                  <button type="submit" disabled={savingCompany || companyName.trim() === company.name} className={primaryButton}>
                    {savingCompany ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar nome
                  </button>
                </div>
              )}
            </form>
          </section>

          <aside className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2 text-[var(--ink)]">
              <ShieldCheck className="h-5 w-5 text-[var(--brand)]" />
              <h2 className="text-base font-semibold">Permissões</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Esta área é exclusiva para contas com perfil Gestor.</p>
            <div className="mt-5 space-y-3 border-t border-[var(--line)] pt-5">
              {['Editar o nome da empresa', 'Gerenciar o e-mail de acesso', 'Atualizar a própria senha'].map((permission) => (
                <div key={permission} className="flex items-start gap-2.5 text-sm text-[var(--ink)]">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                    <Check className="h-3 w-3" />
                  </span>
                  {permission}
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Identificador da empresa</p>
              <p className="mt-2 font-mono text-sm font-semibold text-[var(--ink)]">#{company.id}</p>
            </div>
          </aside>
        </div>

        <section className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-sm">
          <div className="border-b border-[var(--line)] px-5 py-5 sm:px-6">
            <div className="flex items-center gap-2 text-[var(--ink)]">
              <KeyRound className="h-5 w-5 text-[var(--brand)]" />
              <h2 className="text-base font-semibold">Acesso e segurança</h2>
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">Proteja a conta usada para administrar suas empresas.</p>
          </div>

          <div className="divide-y divide-[var(--line)]">
            <div className="grid gap-5 px-5 py-6 sm:px-6 lg:grid-cols-[220px_1fr]">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]"><Mail className="h-4 w-4 text-[var(--brand)]" />E-mail de acesso</div>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">É compartilhado entre todas as empresas desta conta.</p>
              </div>
              <form onSubmit={handleEmailSubmit} className="max-w-xl">
                <label htmlFor="manager-email" className="block">
                  <span className="mb-1.5 block text-sm font-medium text-[var(--ink)]">E-mail</span>
                  <input
                    id="manager-email"
                    type="email"
                    value={email}
                    disabled={!editingEmail || savingEmail}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    className={fieldClass}
                  />
                </label>
                {editingEmail && (
                  <div className="mt-4">
                    <PasswordField
                      id="email-current-password"
                      label="Senha atual para confirmar"
                      value={emailPassword}
                      onChange={(event) => setEmailPassword(event.target.value)}
                      autoComplete="current-password"
                      disabled={savingEmail}
                    />
                    <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Após salvar o novo e-mail, você entrará novamente na conta.</p>
                  </div>
                )}
                {emailError && <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400"><AlertCircle className="h-4 w-4 shrink-0" />{emailError}</p>}
                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  {editingEmail ? (
                    <>
                      <button type="button" onClick={cancelEmailEdit} disabled={savingEmail} className={secondaryButton}>Cancelar</button>
                      <button type="submit" disabled={savingEmail || !emailPassword || email.trim().toLowerCase() === (manager?.email ?? user?.email ?? '').toLowerCase()} className={primaryButton}>
                        {savingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Salvar e-mail
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => setEditingEmail(true)} className={secondaryButton}><Pencil className="h-4 w-4" />Alterar e-mail</button>
                  )}
                </div>
              </form>
            </div>

            <div className="grid gap-5 px-5 py-6 sm:px-6 lg:grid-cols-[220px_1fr]">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]"><LockKeyhole className="h-4 w-4 text-[var(--brand)]" />Atualizar senha</div>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Use uma senha exclusiva para a BNFix.</p>
              </div>
              <form onSubmit={handlePasswordSubmit} className="max-w-xl">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <PasswordField id="current-password" label="Senha atual" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" disabled={savingPassword} />
                  </div>
                  <PasswordField id="new-password" label="Nova senha" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" disabled={savingPassword} />
                  <PasswordField id="confirm-password" label="Confirmar nova senha" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" disabled={savingPassword} />
                </div>

                {newPassword && (
                  <div className="mt-4 grid gap-2 rounded-xl bg-[var(--surface-muted)] p-4 sm:grid-cols-2">
                    {passwordChecks.map((check) => (
                      <span key={check.label} className={`flex items-center gap-2 text-xs ${check.valid ? 'text-[var(--brand-strong)] dark:text-emerald-300' : 'text-[var(--muted)]'}`}>
                        <span className={`flex h-4 w-4 items-center justify-center rounded-full ${check.valid ? 'bg-[var(--brand-soft)]' : 'border border-[var(--line)]'}`}>
                          {check.valid && <Check className="h-2.5 w-2.5" />}
                        </span>
                        {check.label}
                      </span>
                    ))}
                  </div>
                )}
                {passwordError && <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400"><AlertCircle className="h-4 w-4 shrink-0" />{passwordError}</p>}
                <div className="mt-5 flex justify-end">
                  <button type="submit" disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword} className={primaryButton}>
                    {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}Atualizar senha
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>

      {endingSession && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div role="status" className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-7 text-center shadow-2xl">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-strong)]"><Check className="h-6 w-6" /></span>
            <h2 className="mt-4 text-lg font-semibold text-[var(--ink)]">E-mail atualizado</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Redirecionando para você entrar com o novo e-mail.</p>
            <Loader2 className="mx-auto mt-5 h-5 w-5 animate-spin text-[var(--brand)]" />
          </div>
        </div>
      )}

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast((current) => ({ ...current, visible: false }))} />
    </div>
  );
};
