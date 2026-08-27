import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Check,
  ChevronDown,
  Loader2,
  LogOut,
  Moon,
  Plus,
  Sun,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { companyService } from '../services/companyService';
import { AnnouncementCenter } from './AnnouncementCenter';

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const formatCnpj = (value: string): string => {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

const getApiError = (error: unknown, fallback: string): string => {
  const candidate = error as {
    response?: { status?: number; data?: { message?: string; detail?: string } };
  };
  const backendMessage = candidate.response?.data?.message ?? candidate.response?.data?.detail ?? '';
  if (candidate.response?.status === 409 || backendMessage.toLowerCase().includes('cnpj already')) {
    return 'Este CNPJ já está cadastrado. Se a empresa já existe, selecione-a na sua lista.';
  }
  if (backendMessage.toLowerCase().includes('cnpj')) {
    return 'CNPJ inválido. Confira os números informados.';
  }
  return backendMessage || fallback;
};

export const Navbar: React.FC = () => {
  const {
    user,
    companies,
    companiesLoading,
    switchingCompany,
    logout,
    refreshCompanies,
    switchCompany,
  } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
  const [switchError, setSwitchError] = useState('');
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [cnpjDigits, setCnpjDigits] = useState('');
  const [createError, setCreateError] = useState('');
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [createdCompanyId, setCreatedCompanyId] = useState<number | null>(null);
  const companyMenuRef = useRef<HTMLDivElement>(null);

  const isManager = user?.role === 'COMPANY';
  const isEmployee = user?.role === 'EMPLOYEE';
  const currentCompany = companies.find((item) => String(item.id) === user?.companyId);
  const currentCompanyName = currentCompany?.name ?? user?.companyName ?? 'Empresa atual';

  useEffect(() => {
    if (!companyMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!companyMenuRef.current?.contains(event.target as Node)) {
        setCompanyMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCompanyMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [companyMenuOpen]);

  useEffect(() => {
    if (!addCompanyOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !creatingCompany) closeAddCompany();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [addCompanyOpen, creatingCompany]);

  const getRoleNamePT = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrador';
      case 'SUPPLIER': return 'Fornecedor';
      case 'COMPANY': return 'Gestor';
      default: return 'Colaborador';
    }
  };

  const closeAddCompany = () => {
    if (creatingCompany) return;
    setAddCompanyOpen(false);
    setCompanyName('');
    setCnpjDigits('');
    setCreateError('');
    setCreatedCompanyId(null);
  };

  const handleSwitchCompany = async (companyId: number) => {
    setSwitchError('');
    const result = await switchCompany(companyId);
    if (result.success) {
      setCompanyMenuOpen(false);
      return;
    }
    setSwitchError(result.message ?? 'Não foi possível trocar de empresa.');
  };

  const handleCreateCompany = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError('');

    if (createdCompanyId) {
      setCreatingCompany(true);
      const result = await switchCompany(createdCompanyId);
      setCreatingCompany(false);
      if (result.success) {
        setAddCompanyOpen(false);
        setCompanyName('');
        setCnpjDigits('');
        setCreateError('');
        setCreatedCompanyId(null);
      } else {
        setCreateError(result.message ?? 'A empresa foi criada, mas não foi possível abri-la.');
      }
      return;
    }

    const normalizedName = companyName.trim();
    if (!normalizedName) {
      setCreateError('Informe o nome da empresa.');
      return;
    }
    if (cnpjDigits.length !== 14) {
      setCreateError('Informe os 14 dígitos do CNPJ.');
      return;
    }

    setCreatingCompany(true);
    try {
      const created = await companyService.create({ name: normalizedName, cnpj: cnpjDigits });
      if (created?.id) setCreatedCompanyId(created.id);

      let updatedCompanies = companies;
      try {
        updatedCompanies = await refreshCompanies();
      } catch (refreshError) {
        if (!created?.id) throw refreshError;
      }

      const target = created?.id
        ? created
        : updatedCompanies.find((item) => onlyDigits(item.cnpj) === cnpjDigits);

      if (!target?.id) {
        throw new Error('A empresa foi criada, mas não apareceu na lista da conta.');
      }

      setCreatedCompanyId(target.id);
      const result = await switchCompany(target.id);
      if (!result.success) {
        setCreateError(`${result.message ?? 'Não foi possível abrir a empresa.'} Ela já foi adicionada à sua conta.`);
        return;
      }

      setAddCompanyOpen(false);
      setCompanyName('');
      setCnpjDigits('');
      setCreatedCompanyId(null);
    } catch (error) {
      setCreateError(getApiError(error, 'Não foi possível adicionar a empresa. Tente novamente.'));
    } finally {
      setCreatingCompany(false);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3 transition-colors sm:px-6">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex shrink-0 items-center gap-2.5">
              <img
                src="/favicon.png"
                alt="BNFix"
                className="h-10 w-10 rounded-lg object-contain"
              />
              <div className="hidden sm:block">
                <span className="block text-base font-semibold leading-none text-[var(--ink)]">BNFix</span>
                <span className="mt-1 block text-[11px] text-[var(--muted)]">
                  Benefícios corporativos
                </span>
              </div>
            </div>

            {isManager && (
              <div ref={companyMenuRef} className="relative min-w-0 border-l border-[var(--line)] pl-3">
                <button
                  type="button"
                  onClick={() => {
                    setSwitchError('');
                    setCompanyMenuOpen((open) => !open);
                  }}
                  aria-expanded={companyMenuOpen}
                  aria-haspopup="menu"
                  className="flex h-10 max-w-[142px] items-center gap-2 rounded-lg px-2 text-left hover:bg-[var(--surface-muted)] sm:max-w-[190px] sm:px-3 md:max-w-[260px]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                    {switchingCompany
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Building2 className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="hidden text-[9px] font-bold uppercase tracking-wider text-[var(--muted)] sm:block">
                      Mesa de trabalho
                    </span>
                    <span className="block truncate text-xs font-semibold text-[var(--ink)] sm:text-sm">
                      {currentCompanyName}
                    </span>
                  </span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform ${companyMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {companyMenuOpen && (
                  <div
                    role="menu"
                    aria-label="Trocar empresa"
                    className="fixed left-4 right-4 top-[68px] w-auto overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl sm:absolute sm:left-3 sm:right-auto sm:top-[calc(100%+10px)] sm:w-[340px]"
                  >
                    <div className="border-b border-[var(--line)] px-4 py-3">
                      <p className="text-xs font-semibold text-[var(--ink)]">Suas empresas</p>
                      <p className="mt-0.5 text-[11px] leading-4 text-[var(--muted)]">
                        Escolha qual empresa você quer gerenciar agora.
                      </p>
                    </div>

                    <div className="max-h-72 overflow-y-auto p-2">
                      {companiesLoading ? (
                        <div className="flex items-center justify-center gap-2 px-3 py-6 text-xs text-[var(--muted)]">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Carregando empresas...
                        </div>
                      ) : companies.length === 0 ? (
                        <p className="px-3 py-5 text-center text-xs leading-5 text-[var(--muted)]">
                          Nenhuma empresa ativa foi encontrada para esta conta.
                        </p>
                      ) : (
                        companies.map((item) => {
                          const isCurrent = String(item.id) === user?.companyId;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              role="menuitemradio"
                              aria-checked={isCurrent}
                              disabled={isCurrent || switchingCompany}
                              onClick={() => handleSwitchCompany(item.id)}
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[var(--surface-muted)] disabled:cursor-default disabled:opacity-80"
                            >
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--brand-strong)]">
                                <Building2 className="h-4 w-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-[var(--ink)]">{item.name}</span>
                                <span className="mt-0.5 block text-[10px] text-[var(--muted)]">
                                  CNPJ {formatCnpj(item.cnpj)} · Ativa
                                </span>
                              </span>
                              {isCurrent && (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-[var(--brand-strong)]">
                                  <Check className="h-3.5 w-3.5" /> Atual
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>

                    {switchError && (
                      <div role="alert" className="mx-3 mb-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-[11px] text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {switchError}
                      </div>
                    )}

                    <div className="border-t border-[var(--line)] p-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCompanyMenuOpen(false);
                          setAddCompanyOpen(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-[var(--brand-strong)] hover:bg-[var(--brand-soft)]"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar empresa
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            {isEmployee && <AnnouncementCenter />}

            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
              aria-label="Alternar tema"
            >
              {theme === 'light'
                ? <Moon className="h-5 w-5" />
                : <Sun className="h-5 w-5" />}
            </button>

            {user && (
              <div className="flex items-center gap-2 border-l border-[var(--line)] pl-2 sm:pl-3">
                <span className="hidden h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand-strong)] sm:flex">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
                <div className="hidden text-left lg:block">
                  <span className="block max-w-40 truncate text-sm font-semibold text-[var(--ink)]">
                    {user.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--muted)]">
                    {getRoleNamePT(user.role)}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="ml-0 flex h-9 items-center gap-2 rounded-lg px-2 text-[var(--muted)] hover:bg-[#fff1ef] hover:text-[#a33f35] dark:hover:bg-red-950/40 dark:hover:text-red-300 sm:ml-1"
                  aria-label="Encerrar sessão"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden text-sm font-medium md:inline">Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {addCompanyOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeAddCompany();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-company-title"
            aria-describedby="add-company-description"
            className="relative w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-left shadow-2xl"
          >
            <button
              type="button"
              onClick={closeAddCompany}
              disabled={creatingCompany}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] disabled:opacity-50"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
              <Building2 className="h-5 w-5" />
            </span>
            <h2 id="add-company-title" className="mt-4 text-xl font-semibold tracking-tight text-[var(--ink)]">
              Adicionar empresa
            </h2>
            <p id="add-company-description" className="mt-1.5 text-sm leading-6 text-[var(--muted)]">
              Você usará o mesmo CPF, e-mail e senha para gerenciar a nova empresa.
            </p>

            <form onSubmit={handleCreateCompany} className="mt-6 space-y-4">
              {createError && (
                <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="new-company-name" className="text-sm font-medium text-[var(--ink)]">
                  Nome da empresa
                </label>
                <input
                  id="new-company-name"
                  type="text"
                  required
                  autoFocus
                  disabled={creatingCompany || Boolean(createdCompanyId)}
                  value={companyName}
                  onChange={(event) => {
                    setCompanyName(event.target.value);
                    setCreateError('');
                  }}
                  placeholder="Nome empresarial"
                  className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/15 disabled:opacity-60"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="new-company-cnpj" className="text-sm font-medium text-[var(--ink)]">
                  CNPJ
                </label>
                <input
                  id="new-company-cnpj"
                  type="text"
                  inputMode="numeric"
                  required
                  disabled={creatingCompany || Boolean(createdCompanyId)}
                  value={formatCnpj(cnpjDigits)}
                  onChange={(event) => {
                    setCnpjDigits(onlyDigits(event.target.value).slice(0, 14));
                    setCreateError('');
                  }}
                  placeholder="00.000.000/0000-00"
                  className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/15 disabled:opacity-60"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeAddCompany}
                  disabled={creatingCompany}
                  className="h-10 rounded-lg border border-[var(--line)] px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingCompany}
                  className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--action)] px-5 text-sm font-semibold text-[var(--action-ink)] hover:bg-[var(--action-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingCompany && <Loader2 className="h-4 w-4 animate-spin" />}
                  {createdCompanyId ? 'Abrir empresa' : creatingCompany ? 'Adicionando...' : 'Adicionar empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
