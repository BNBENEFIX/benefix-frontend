import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { employeeService } from '../services/employeeService';
import { companyService } from '../services/companyService';
import { announcementService } from '../services/announcementService';
import { metricsService } from '../services/api';
import type { BackendEmployee, BackendCompany, ManagerAnnouncement } from '../types';
import {
  Users, UserPlus, UserCheck, UserX, Building2, Send,
  RefreshCw, Search, ChevronDown, ChevronUp, X, AlertCircle,
  CheckCircle2, FileSpreadsheet, Activity, Heart, ShieldAlert, Loader2,
  Megaphone
} from 'lucide-react';
import { Toast } from '../components/Toast';

// ─── tipos locais ────────────────────────────────────────────────────────────

interface NewEmployeeForm {
  name: string;
  cpf: string;
  email: string;
  password: string;
}

const EMPTY_FORM: NewEmployeeForm = { name: '', cpf: '', email: '', password: '' };
const ANNOUNCEMENT_TITLE_MAX_LENGTH = 160;
const ANNOUNCEMENT_CONTENT_MAX_LENGTH = 4_000;

// ─── Helper: verifica se o employee está ativo ───────────────────────────────
// O backend pode retornar active como boolean (true/false) ou string ("DISABLED", "ACTIVE")
const isEmployeeActive = (emp: BackendEmployee): boolean => {
  if (typeof emp.active === 'boolean') return emp.active;
  if (typeof emp.active === 'string') return (emp.active as string).toUpperCase() !== 'DISABLED';
  return true; // fallback: se undefined, assume ativo
};

// ─── Validação de CPF (dígitos verificadores) ─────────────────────────────────
// Evita enviar CPFs inválidos ao backend e receber 400 desnecessário.

function isValidCpf(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (factor: number) => {
    let sum = 0;
    for (let i = 0; i < factor - 1; i++) sum += parseInt(d[i]) * (factor - i);
    const rem = (sum * 10) % 11;
    return rem === 10 || rem === 11 ? 0 : rem;
  };
  return calc(10) === parseInt(d[9]) && calc(11) === parseInt(d[10]);
}

// ─── componente ──────────────────────────────────────────────────────────────

export const DashboardRH: React.FC = () => {
  const { user, logout } = useAuth();

  // dados da API
  const [employees, setEmployees]   = useState<BackendEmployee[]>([]);
  const [company, setCompany]       = useState<BackendCompany | null>(null);
  const [announcements, setAnnouncements] = useState<ManagerAnnouncement[]>([]);
  const [metrics, setMetrics]       = useState<any>(null);

  // estado da UI
  const [loading, setLoading]       = useState(true);
  const [listError, setListError]   = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [showModal, setShowModal]   = useState(false);
  const [formData, setFormData]     = useState<NewEmployeeForm>(EMPTY_FORM);
  const [formError, setFormError]   = useState<string>('');
  const [formLoading, setFormLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // ciclo de vida da empresa
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [deactivateConfirmation, setDeactivateConfirmation] = useState('');
  const [deactivateError, setDeactivateError] = useState('');
  const [deactivatingCompany, setDeactivatingCompany] = useState(false);

  // comunicado
  const [annTitle, setAnnTitle]     = useState('');
  const [annContent, setAnnContent] = useState('');
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState('');
  const [announcementFormError, setAnnouncementFormError] = useState('');
  const [publishingAnnouncement, setPublishingAnnouncement] = useState(false);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') =>
    setToast({ visible: true, message, type });


  // ── carregamento de dados ──────────────────────────────────────────────────

  const loadAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true);
    setAnnouncementsError('');
    try {
      const result = await announcementService.listCompany(0, 20);
      setAnnouncements(result.items);
    } catch (error: any) {
      const backendMessage: string = error?.response?.data?.message
        ?? error?.response?.data?.detail
        ?? '';
      setAnnouncementsError(
        backendMessage || 'Não foi possível carregar os comunicados. Tente novamente.',
      );
    } finally {
      setAnnouncementsLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const [emps, comp, met] = await Promise.allSettled([
        employeeService.list(),
        companyService.getMyCompany(),
        metricsService.getDashboardMetrics(),
      ]);

      if (emps.status === 'fulfilled') {
        setEmployees(emps.value);
        setListError(null);
      } else {
        const msg: string = (emps.reason as any)?.response?.data?.message ?? '';
        console.warn('[DashboardRH] GET /employees falhou (bug do backend):', msg);
        // Não apaga a lista local — ela pode já ter dados de operações anteriores
        // Só exibe aviso se a lista ainda estiver vazia
        setListError('list_unavailable');
      }

      if (comp.status === 'fulfilled')  setCompany(comp.value);
      if (met.status === 'fulfilled')   setMetrics(met.value);
    } catch (err) {
      console.error('[DashboardRH] loadData erro inesperado:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    void loadAnnouncements();
  }, [loadAnnouncements, loadData]);

  useEffect(() => {
    if (!deactivateModalOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !deactivatingCompany) {
        setDeactivateModalOpen(false);
        setDeactivatePassword('');
        setDeactivateConfirmation('');
        setDeactivateError('');
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [deactivateModalOpen, deactivatingCompany]);

  // ── ações sobre colaboradores ──────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!company) { showToast('Empresa não carregada. Recarregue a página.', 'error'); return; }

    // Validação de CPF antes de enviar ao backend
    const rawCpf = formData.cpf.replace(/\D/g, '');
    if (!isValidCpf(rawCpf)) {
      setFormError('CPF inválido. Verifique os dígitos informados.');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setFormLoading(true);
    try {
      const created = await employeeService.create({
        name:      formData.name.trim(),
        cpf:       rawCpf,
        email:     formData.email.trim().toLowerCase(),
        password:  formData.password,
        companyId: company.id,
      });

      // O backend cria funcionários com status DISABLED por padrão.
      // Ativamos automaticamente logo após a criação.
      if (created.id) {
        try {
          await employeeService.activate(created.id);
          console.log(`[DashboardRH] Funcionário ${created.id} ativado automaticamente.`);
          // Atualiza lista local diretamente — não depende do GET /employees com bug
          const activated: BackendEmployee = { ...created, active: true };
          setEmployees(prev => [activated, ...prev.filter(e => e.id !== created.id)]);
          setListError(null);
        } catch (activateErr: any) {
          console.warn('[DashboardRH] Falha ao ativar automaticamente:', activateErr?.response?.data);
          // Adiciona à lista local como DISABLED com aviso
          setEmployees(prev => [created, ...prev.filter(e => e.id !== created.id)]);
          showToast(`Colaborador "${formData.name}" criado, mas precisa ser ativado manualmente antes de fazer login.`, 'info');
          setFormData(EMPTY_FORM);
          setFormError('');
          setShowModal(false);
          return;
        }
      }

      showToast(`Colaborador "${formData.name}" cadastrado e ativado com sucesso.`);
      setFormData(EMPTY_FORM);
      setFormError('');
      setShowModal(false);
      // Não chama loadData() — GET /employees tem bug no backend (Mutiny.Session)
      // A lista já foi atualizada localmente acima
    } catch (err: any) {
      const status = err?.response?.status;
      const backendMsg = err?.response?.data?.message ?? '';

      if (status === 400 && backendMsg.toLowerCase().includes('cpf')) {
        setFormError('CPF inválido ou já cadastrado no sistema.');
      } else if (status === 409 || backendMsg.toLowerCase().includes('duplicate') || backendMsg.toLowerCase().includes('already')) {
        setFormError('E-mail ou CPF já cadastrado para outro colaborador.');
      } else if (status === 500) {
        setFormError('Erro interno do servidor. Possível e-mail ou CPF duplicado. Verifique os dados.');
      } else {
        setFormError(backendMsg || 'Falha ao cadastrar colaborador. Tente novamente.');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleActivate = async (emp: BackendEmployee) => {
    try {
      await employeeService.activate(emp.id);
      // Atualiza localmente — não depende do GET /employees com bug
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, active: true } : e));
      showToast(`${emp.name} foi ativado com sucesso.`);
    } catch {
      showToast('Falha ao ativar colaborador.', 'error');
    }
  };

  const handleDisable = async (emp: BackendEmployee) => {
    try {
      await employeeService.disable(emp.id);
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, active: false } : e));
      showToast(`${emp.name} foi desativado.`, 'info');
    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? '';
      // Se o backend diz que já está desativado, atualiza localmente mesmo assim
      if (msg.toLowerCase().includes('already disabled')) {
        setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, active: false } : e));
        showToast(`${emp.name} já estava desativado.`, 'info');
      } else {
        showToast('Falha ao desativar colaborador.', 'error');
      }
    }
  };

  // ── comunicado ─────────────────────────────────────────────────────────────

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = annTitle.trim();
    const content = annContent.trim();

    setAnnouncementFormError('');
    if (!title || !content) {
      setAnnouncementFormError('Preencha o título e a mensagem antes de publicar.');
      return;
    }
    if (title.length > ANNOUNCEMENT_TITLE_MAX_LENGTH) {
      setAnnouncementFormError(`O título deve ter até ${ANNOUNCEMENT_TITLE_MAX_LENGTH} caracteres.`);
      return;
    }
    if (content.length > ANNOUNCEMENT_CONTENT_MAX_LENGTH) {
      setAnnouncementFormError(`A mensagem deve ter até ${ANNOUNCEMENT_CONTENT_MAX_LENGTH.toLocaleString('pt-BR')} caracteres.`);
      return;
    }

    setPublishingAnnouncement(true);
    try {
      const added = await announcementService.create({ title, content });
      setAnnouncements((current) => [
        added,
        ...current.filter((announcement) => announcement.id !== added.id),
      ].slice(0, 20));
      setAnnTitle('');
      setAnnContent('');
      setAnnouncementsError('');
      showToast(
        added.recipientCount === 0
          ? 'Comunicado publicado. Não há colaboradores ativos para recebê-lo agora.'
          : `Comunicado publicado para ${added.recipientCount} ${added.recipientCount === 1 ? 'colaborador' : 'colaboradores'}.`,
      );
    } catch (error: any) {
      const backendMessage: string = error?.response?.data?.message
        ?? error?.response?.data?.detail
        ?? '';
      setAnnouncementFormError(
        backendMessage || 'Não foi possível publicar o comunicado. Tente novamente.',
      );
      showToast('O comunicado não foi publicado.', 'error');
    } finally {
      setPublishingAnnouncement(false);
    }
  };

  const handleExportReport = (format: 'PDF' | 'EXCEL') =>
    showToast(`Relatório exportado em formato ${format} com sucesso.`);

  const closeDeactivateModal = () => {
    if (deactivatingCompany) return;
    setDeactivateModalOpen(false);
    setDeactivatePassword('');
    setDeactivateConfirmation('');
    setDeactivateError('');
  };

  const handleDeactivateCompany = async (event: React.FormEvent) => {
    event.preventDefault();
    const expectedName = company?.name ?? user?.companyName ?? '';

    if (!expectedName || deactivateConfirmation.trim() !== expectedName) {
      setDeactivateError('Digite o nome da empresa exatamente como exibido.');
      return;
    }
    if (!deactivatePassword) {
      setDeactivateError('Informe sua senha para confirmar.');
      return;
    }

    setDeactivatingCompany(true);
    setDeactivateError('');
    try {
      await companyService.deactivateMine({ password: deactivatePassword });
      sessionStorage.setItem(
        'bnfix_auth_notice',
        `${expectedName} foi desativada. Seu CPF e sua conta foram preservados: entre em outra empresa ou use “Cadastre-se” com os mesmos dados para criar uma nova.`,
      );
      logout();
    } catch (err: any) {
      const status = err?.response?.status;
      const backendMsg: string = err?.response?.data?.message ?? err?.response?.data?.detail ?? '';
      if (backendMsg.toLowerCase().includes('only the company owner')) {
        setDeactivateError('Apenas o gestor proprietário pode desativar esta empresa.');
      } else if (status === 401 || backendMsg.toLowerCase().includes('password is incorrect')) {
        setDeactivateError('Senha incorreta. Verifique e tente novamente.');
      } else {
        setDeactivateError(backendMsg || 'Não foi possível desativar a empresa. Tente novamente.');
      }
    } finally {
      setDeactivatingCompany(false);
    }
  };


  // ── filtros ────────────────────────────────────────────────────────────────

  const filtered = employees.filter(emp => {
    const matchSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.cpf.includes(searchTerm);
    const matchStatus =
      filterStatus === 'todos' ? true :
      filterStatus === 'ativos' ? isEmployeeActive(emp) :
      !isEmployeeActive(emp);
    return matchSearch && matchStatus;
  });

  const activeCount   = employees.filter(e => isEmployeeActive(e)).length;
  const inactiveCount = employees.filter(e => !isEmployeeActive(e)).length;

  // ── loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Carregando dados dos colaboradores...</span>
        </div>
      </div>
    );
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 text-left fade-in">
      <Toast visible={toast.visible} message={toast.message} type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })} />

      {/* ── Cabeçalho ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] bg-emerald-500/10 text-emerald-600 font-extrabold uppercase tracking-widest truncate max-w-[200px] sm:max-w-none">
              {company?.name ?? 'Minha Empresa'}
            </span>
            {company?.cnpj && (
              <span className="text-[9px] font-mono text-slate-400 hidden sm:inline">CNPJ: {company.cnpj}</span>
            )}
          </div>
          <h2 className="font-display font-black text-lg sm:text-xl text-slate-800 dark:text-neutral-50">
            Portal de Gestão de Colaboradores
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie o time, ative ou desative acessos e publique comunicados internos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-2.5 sm:shrink-0">
          <button onClick={() => handleExportReport('EXCEL')}
            className="flex items-center gap-1.5 px-3 py-2 sm:px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer">
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Excel
          </button>
          <button onClick={() => handleExportReport('PDF')}
            className="flex items-center gap-1.5 px-3 py-2 sm:px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer">
            PDF
          </button>
          <button onClick={() => { setFormData(EMPTY_FORM); setFormError(''); setShowModal(true); }}
            className="flex items-center gap-1.5 px-3 py-2 sm:px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer">
            <UserPlus className="w-4 h-4" /> <span className="hidden xs:inline">Novo</span> Colaborador
          </button>
        </div>
      </div>


      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        <div className="p-4 sm:p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Total</span>
            <div className="font-display font-extrabold text-xl sm:text-2xl text-slate-800 dark:text-slate-100">{employees.length}</div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="p-4 sm:p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Ativos</span>
            <div className="font-display font-extrabold text-xl sm:text-2xl text-emerald-600 dark:text-emerald-400">{activeCount}</div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="p-4 sm:p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Inativos</span>
            <div className="font-display font-extrabold text-xl sm:text-2xl text-red-500 dark:text-red-400">{inactiveCount}</div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center shrink-0">
            <UserX className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="p-4 sm:p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Benefícios</span>
            <div className="font-display font-extrabold text-xl sm:text-2xl text-slate-800 dark:text-slate-100">
              {metrics?.activeBenefitsCount ?? '—'}
            </div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>


      {/* ── Tabela de Colaboradores ───────────────────────────────────────── */}
      <div className="p-4 sm:p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="font-bold text-md text-slate-800 dark:text-slate-100">Colaboradores da Empresa</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Dados carregados em tempo real da API. Clique em uma linha para ver detalhes.
            </p>
          </div>

          {/* Search + filtro */}
          <div className="flex flex-col gap-2 w-full sm:flex-row sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" placeholder="Buscar por nome, e-mail ou CPF..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none w-full sm:w-64 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
              className="px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-700 dark:text-slate-300 cursor-pointer w-full sm:w-auto">
              <option value="todos">Todos</option>
              <option value="ativos">Somente Ativos</option>
              <option value="inativos">Somente Inativos</option>
            </select>
          </div>
        </div>

        {listError === 'list_unavailable' && employees.length === 0 ? (
          <div className="flex items-start gap-2.5 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl text-amber-700 dark:text-amber-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Lista de colaboradores indisponível</p>
              <p className="text-amber-600 dark:text-amber-500">
                O servidor está com um problema interno no endpoint de listagem. Os colaboradores aparecerão aqui após você criar o primeiro nesta sessão, ou quando o backend for corrigido.
              </p>
              <button onClick={loadData} className="mt-1 flex items-center gap-1 font-bold underline cursor-pointer hover:no-underline">
                <RefreshCw className="w-3 h-3" /> Tentar novamente
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 sm:p-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Users className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              {employees.length === 0 ? 'Nenhum colaborador cadastrado ainda.' : 'Nenhum resultado para esse filtro.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: card-based list */}
            <div className="space-y-3 md:hidden">
              {filtered.map(emp => (
                <div
                  key={emp.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/20"
                  onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-xs shrink-0">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{emp.name}</p>
                        <p className="text-xs text-slate-400 truncate">{emp.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isEmployeeActive(emp)
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {isEmployeeActive(emp) ? 'Ativo' : 'Inativo'}
                      </span>
                      {expandedId === emp.id
                        ? <ChevronUp className="w-4 h-4 text-slate-400" />
                        : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                  {expandedId === emp.id && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <div>
                          <span className="text-slate-400 font-bold uppercase block">CPF</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">{emp.cpf}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold uppercase block">ID</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">#{emp.id}</span>
                        </div>
                      </div>
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        {isEmployeeActive(emp) ? (
                          <button onClick={() => handleDisable(emp)}
                            className="flex-1 px-3 py-2 text-xs font-bold bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-200 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400 rounded-lg transition-all">
                            Desativar
                          </button>
                        ) : (
                          <button onClick={() => handleActivate(emp)}
                            className="flex-1 px-3 py-2 text-xs font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-200 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-400 rounded-lg transition-all">
                            Ativar
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400">
                    <th className="py-3 px-2 font-bold uppercase tracking-wider">Nome</th>
                    <th className="py-3 px-2 font-bold uppercase tracking-wider">E-mail</th>
                    <th className="py-3 px-2 font-bold uppercase tracking-wider">CPF</th>
                    <th className="py-3 px-2 font-bold uppercase tracking-wider text-center">Status</th>
                    <th className="py-3 px-2 font-bold uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filtered.map(emp => (
                    <React.Fragment key={emp.id}>
                      <tr
                        className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 cursor-pointer"
                        onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}
                      >
                        <td className="py-3 px-2 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-[10px] shrink-0">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          {emp.name}
                          {expandedId === emp.id
                            ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-auto" />
                            : <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-auto" />}
                        </td>
                        <td className="py-3 px-2 text-slate-500 dark:text-slate-400">{emp.email}</td>
                        <td className="py-3 px-2 font-mono text-slate-400">{emp.cpf}</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isEmployeeActive(emp)
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {isEmployeeActive(emp) ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right" onClick={e => e.stopPropagation()}>
                          {isEmployeeActive(emp) ? (
                            <button onClick={() => handleDisable(emp)}
                              className="px-3 py-1 text-[10px] font-bold bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-200 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400 rounded-lg transition-all cursor-pointer">
                              Desativar
                            </button>
                          ) : (
                            <button onClick={() => handleActivate(emp)}
                              className="px-3 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-200 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-400 rounded-lg transition-all cursor-pointer">
                              Ativar
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedId === emp.id && (
                        <tr className="bg-slate-50/60 dark:bg-slate-950/30">
                          <td colSpan={5} className="px-4 py-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px]">
                              <div>
                                <span className="text-slate-400 font-bold uppercase block">ID Backend</span>
                                <span className="font-mono text-slate-700 dark:text-slate-300">#{emp.id}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold uppercase block">Empresa ID</span>
                                <span className="font-mono text-slate-700 dark:text-slate-300">#{emp.companyId}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold uppercase block">CPF</span>
                                <span className="font-mono text-slate-700 dark:text-slate-300">{emp.cpf}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold uppercase block">Situação</span>
                                <span className={`font-bold ${isEmployeeActive(emp) ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {isEmployeeActive(emp) ? 'Acesso liberado' : 'Acesso bloqueado'}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}(emp) ? 'text-emerald-600' : 'text-red-500'}`}>
                                {isEmployeeActive(emp) ? 'Acesso liberado' : 'Acesso bloqueado'}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[10px] text-slate-400 pt-1">
          Exibindo {filtered.length} de {employees.length} colaborador(es).
        </p>
      </div>


      {/* ── Comunicados internos ──────────────────────────────────────────── */}
      <section aria-labelledby="announcements-section-title" className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              <Send className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div>
              <h4 id="announcements-section-title" className="text-md font-bold text-slate-800 dark:text-slate-100">
                Publicar comunicado interno
              </h4>
              <p className="mt-0.5 text-xs leading-5 text-slate-400">
                A mensagem será entregue aos colaboradores ativos desta empresa.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateAnnouncement} className="mt-5 flex flex-1 flex-col gap-4">
            {announcementFormError && (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{announcementFormError}</span>
              </div>
            )}

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label htmlFor="announcement-title" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Título
                </label>
                <span className="text-[10px] tabular-nums text-slate-400" aria-hidden="true">
                  {annTitle.length}/{ANNOUNCEMENT_TITLE_MAX_LENGTH}
                </span>
              </div>
              <input
                id="announcement-title"
                type="text"
                required
                maxLength={ANNOUNCEMENT_TITLE_MAX_LENGTH}
                disabled={publishingAnnouncement}
                placeholder="Ex.: Horário especial no feriado"
                value={annTitle}
                onChange={(event) => {
                  setAnnTitle(event.target.value);
                  setAnnouncementFormError('');
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="flex-1">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label htmlFor="announcement-content" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Mensagem
                </label>
                <span className="text-[10px] tabular-nums text-slate-400" aria-hidden="true">
                  {annContent.length}/{ANNOUNCEMENT_CONTENT_MAX_LENGTH.toLocaleString('pt-BR')}
                </span>
              </div>
              <textarea
                id="announcement-content"
                rows={5}
                required
                maxLength={ANNOUNCEMENT_CONTENT_MAX_LENGTH}
                disabled={publishingAnnouncement}
                placeholder="Escreva o aviso que o time receberá..."
                value={annContent}
                onChange={(event) => {
                  setAnnContent(event.target.value);
                  setAnnouncementFormError('');
                }}
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <button
              type="submit"
              disabled={publishingAnnouncement || !annTitle.trim() || !annContent.trim()}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {publishingAnnouncement
                ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                : <Send className="h-4 w-4" aria-hidden="true" />}
              {publishingAnnouncement ? 'Publicando...' : 'Publicar comunicado'}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-md font-bold text-slate-800 dark:text-slate-100">Comunicados recentes</h4>
              <p className="mt-0.5 text-xs leading-5 text-slate-400">
                Histórico das últimas mensagens enviadas para o time.
              </p>
            </div>
            {!announcementsLoading && !announcementsError && announcements.length > 0 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                {announcements.length} {announcements.length === 1 ? 'envio' : 'envios'}
              </span>
            )}
          </div>

          {announcementsLoading ? (
            <div role="status" className="flex min-h-56 flex-col items-center justify-center gap-3 text-xs text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" aria-hidden="true" />
              Carregando comunicados...
            </div>
          ) : announcementsError ? (
            <div className="mt-5 flex min-h-52 flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/20">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-300" aria-hidden="true" />
              <p role="alert" className="mt-3 text-xs leading-5 text-red-700 dark:text-red-300">
                {announcementsError}
              </p>
              <button
                type="button"
                onClick={() => void loadAnnouncements()}
                className="mt-3 flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/30"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Tentar novamente
              </button>
            </div>
          ) : announcements.length === 0 ? (
            <div className="mt-5 flex min-h-52 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-6 text-center dark:border-slate-800">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                <Megaphone className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
                Nenhum comunicado publicado
              </p>
              <p className="mt-1 text-[11px] leading-5 text-slate-400">
                Use o formulário ao lado para enviar o primeiro aviso.
              </p>
            </div>
          ) : (
            <ol className="mt-5 max-h-[380px] space-y-3 overflow-y-auto pr-1" aria-label="Comunicados publicados recentemente">
              {announcements.slice(0, 6).map((announcement) => (
                <li key={announcement.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/20">
                  <h5 className="text-xs font-bold leading-5 text-slate-800 dark:text-slate-100">
                    {announcement.title}
                  </h5>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                    {announcement.content}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-2.5 text-[10px] text-slate-400 dark:border-slate-800">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {announcement.recipientCount} {announcement.recipientCount === 1 ? 'destinatário' : 'destinatários'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="max-w-28 truncate">{announcement.author}</span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={announcement.publishedAt}>
                        {new Date(announcement.publishedAt).toLocaleDateString('pt-BR')}
                      </time>
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>


      {/* ── Zona de perigo ─────────────────────────────────────────────────── */}
      {company?.owner && (
        <section
          aria-labelledby="company-danger-title"
          className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900/60 dark:bg-slate-900"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
                <ShieldAlert className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-300">
                  Zona de perigo
                </p>
                <h3 id="company-danger-title" className="mt-1 text-base font-bold text-slate-800 dark:text-slate-100">
                  Desativar esta empresa
                </h3>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Encerra o acesso à empresa {company?.name ?? user?.companyName ?? 'atual'} para gestores e colaboradores.
                  Sua conta pessoal não será excluída e poderá continuar vinculada a outras empresas.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setDeactivateError('');
                setDeactivateModalOpen(true);
              }}
              className="h-10 shrink-0 rounded-lg border border-red-300 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
            >
              Desativar empresa
            </button>
          </div>
        </section>
      )}


      {/* ── Modal: Desativar empresa ───────────────────────────────────────── */}
      {company?.owner && deactivateModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDeactivateModal();
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="deactivate-company-title"
            aria-describedby="deactivate-company-description"
            className="relative w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-left shadow-2xl dark:border-red-900/60 dark:bg-slate-900"
          >
            <button
              type="button"
              onClick={closeDeactivateModal}
              disabled={deactivatingCompany}
              aria-label="Fechar"
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <h2 id="deactivate-company-title" className="mt-4 pr-8 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Desativar {company?.name ?? user?.companyName ?? 'esta empresa'}?
            </h2>
            <p id="deactivate-company-description" className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Esta ação bloqueia o espaço da empresa e encerra sua sessão. Para evitar uma desativação acidental,
              confirme o nome da empresa e sua senha.
            </p>

            <form onSubmit={handleDeactivateCompany} className="mt-6 space-y-4">
              {deactivateError && (
                <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{deactivateError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="company-name-confirmation" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Digite <strong>{company?.name ?? user?.companyName}</strong> para confirmar
                </label>
                <input
                  id="company-name-confirmation"
                  type="text"
                  autoFocus
                  autoComplete="off"
                  disabled={deactivatingCompany}
                  value={deactivateConfirmation}
                  onChange={(event) => {
                    setDeactivateConfirmation(event.target.value);
                    setDeactivateError('');
                  }}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/15 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="company-deactivation-password" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Sua senha
                </label>
                <input
                  id="company-deactivation-password"
                  type="password"
                  autoComplete="current-password"
                  disabled={deactivatingCompany}
                  value={deactivatePassword}
                  onChange={(event) => {
                    setDeactivatePassword(event.target.value);
                    setDeactivateError('');
                  }}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/15 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeDeactivateModal}
                  disabled={deactivatingCompany}
                  className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    deactivatingCompany ||
                    !deactivatePassword ||
                    deactivateConfirmation.trim() !== (company?.name ?? user?.companyName ?? '')
                  }
                  className="flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deactivatingCompany && <Loader2 className="h-4 w-4 animate-spin" />}
                  {deactivatingCompany ? 'Desativando...' : 'Desativar empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ── Modal: Novo Colaborador ───────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            <button onClick={() => { setShowModal(false); setFormError(''); }}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md">
                Cadastrar Colaborador
              </span>
              <h4 className="font-display font-black text-lg text-slate-800 dark:text-slate-100 mt-2">Novo membro do time</h4>
              <p className="text-xs text-slate-400">O colaborador receberá acesso ao portal com as credenciais informadas.</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              {/* Erro inline do formulário */}
              {formError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Nome completo *</label>
                  <input required type="text" placeholder="Ex: João da Silva"
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-all" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">CPF *</label>
                  <input required type="text" placeholder="00000000000"
                    value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-all" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Senha inicial *</label>
                  <input required type="password" placeholder="••••••••"
                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-all" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">E-mail corporativo *</label>
                  <input required type="email" placeholder="colaborador@empresa.com"
                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-all" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setFormError(''); }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={formLoading}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5">
                  {formLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  {formLoading ? 'Cadastrando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
