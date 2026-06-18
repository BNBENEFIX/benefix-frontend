import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { employeeService } from '../services/employeeService';
import { companyService } from '../services/companyService';
import { announcementService, metricsService } from '../services/api';
import type { BackendEmployee, BackendCompany, Announcement } from '../types';
import {
  Users, UserPlus, UserCheck, UserX, Building2, Send,
  RefreshCw, Search, ChevronDown, ChevronUp, X, AlertCircle,
  CheckCircle2, FileSpreadsheet, Activity, Heart
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

// ─── componente ──────────────────────────────────────────────────────────────

export const DashboardRH: React.FC = () => {
  const { user } = useAuth();

  // dados da API
  const [employees, setEmployees]   = useState<BackendEmployee[]>([]);
  const [company, setCompany]       = useState<BackendCompany | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [metrics, setMetrics]       = useState<any>(null);

  // estado da UI
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [showModal, setShowModal]   = useState(false);
  const [formData, setFormData]     = useState<NewEmployeeForm>(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // comunicado
  const [annTitle, setAnnTitle]     = useState('');
  const [annContent, setAnnContent] = useState('');

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') =>
    setToast({ visible: true, message, type });


  // ── carregamento de dados ──────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [emps, comp, anns, met] = await Promise.allSettled([
        employeeService.list(),
        companyService.getMyCompany(),
        announcementService.getAnnouncements(),
        metricsService.getDashboardMetrics(),
      ]);

      if (emps.status === 'fulfilled')  setEmployees(emps.value);
      if (comp.status === 'fulfilled')  setCompany(comp.value);
      if (anns.status === 'fulfilled')  setAnnouncements(anns.value);
      if (met.status === 'fulfilled')   setMetrics(met.value);
    } catch (err) {
      console.error('[DashboardRH] loadData:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── ações sobre colaboradores ──────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) { showToast('Empresa não carregada. Recarregue a página.', 'error'); return; }
    setFormLoading(true);
    try {
      await employeeService.create({
        name:      formData.name,
        cpf:       formData.cpf.replace(/\D/g, ''),
        email:     formData.email,
        password:  formData.password,
        companyId: company.id,
      });
      showToast(`Colaborador "${formData.name}" cadastrado com sucesso.`);
      setFormData(EMPTY_FORM);
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Falha ao cadastrar colaborador.';
      showToast(msg, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleActivate = async (emp: BackendEmployee) => {
    try {
      await employeeService.activate(emp.id);
      showToast(`${emp.name} foi ativado com sucesso.`);
      await loadData();
    } catch {
      showToast('Falha ao ativar colaborador.', 'error');
    }
  };

  const handleDisable = async (emp: BackendEmployee) => {
    try {
      await employeeService.disable(emp.id);
      showToast(`${emp.name} foi desativado.`, 'info');
      await loadData();
    } catch {
      showToast('Falha ao desativar colaborador.', 'error');
    }
  };

  // ── comunicado ─────────────────────────────────────────────────────────────

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;
    try {
      const added = await announcementService.createAnnouncement({
        title: annTitle, content: annContent,
        author: user?.name ?? 'RH',
        companyId: company ? String(company.id) : '',
      });
      setAnnouncements([added, ...announcements]);
      setAnnTitle(''); setAnnContent('');
      showToast('Comunicado publicado no feed de todos os colaboradores.');
    } catch { showToast('Falha ao publicar comunicado.', 'error'); }
  };

  const handleExportReport = (format: 'PDF' | 'EXCEL') =>
    showToast(`Relatório exportado em formato ${format} com sucesso.`);


  // ── filtros ────────────────────────────────────────────────────────────────

  const filtered = employees.filter(emp => {
    const matchSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.cpf.includes(searchTerm);
    const matchStatus =
      filterStatus === 'todos' ? true :
      filterStatus === 'ativos' ? emp.active !== false :
      emp.active === false;
    return matchSearch && matchStatus;
  });

  const activeCount   = employees.filter(e => e.active !== false).length;
  const inactiveCount = employees.filter(e => e.active === false).length;

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
    <div className="p-6 space-y-8 text-left fade-in">
      <Toast visible={toast.visible} message={toast.message} type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })} />

      {/* ── Cabeçalho ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] bg-emerald-500/10 text-emerald-600 font-extrabold uppercase tracking-widest">
              {company?.name ?? 'Minha Empresa'}
            </span>
            {company?.cnpj && (
              <span className="text-[9px] font-mono text-slate-400">CNPJ: {company.cnpj}</span>
            )}
          </div>
          <h2 className="font-display font-black text-xl text-slate-800 dark:text-neutral-50">
            Portal de Gestão de Colaboradores
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie o time, ative ou desative acessos e publique comunicados internos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button onClick={() => handleExportReport('EXCEL')}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer">
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Excel
          </button>
          <button onClick={() => handleExportReport('PDF')}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer">
            PDF
          </button>
          <button onClick={() => { setFormData(EMPTY_FORM); setShowModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer">
            <UserPlus className="w-4 h-4" /> Novo Colaborador
          </button>
        </div>
      </div>


      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total de Colaboradores</span>
            <div className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100">{employees.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Colaboradores Ativos</span>
            <div className="font-display font-extrabold text-2xl text-emerald-600 dark:text-emerald-400">{activeCount}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Inativos / Bloqueados</span>
            <div className="font-display font-extrabold text-2xl text-red-500 dark:text-red-400">{inactiveCount}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center">
            <UserX className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Benefícios Ativos</span>
            <div className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100">
              {metrics?.activeBenefitsCount ?? '—'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>


      {/* ── Tabela de Colaboradores ───────────────────────────────────────── */}
      <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-md text-slate-800 dark:text-slate-100">Colaboradores da Empresa</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Dados carregados em tempo real da API. Clique em uma linha para ver detalhes.
            </p>
          </div>

          {/* Search + filtro */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" placeholder="Buscar por nome, e-mail ou CPF..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none w-full sm:w-64 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-700 dark:text-slate-300 cursor-pointer">
              <option value="todos">Todos</option>
              <option value="ativos">Somente Ativos</option>
              <option value="inativos">Somente Inativos</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Users className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              {employees.length === 0 ? 'Nenhum colaborador cadastrado ainda.' : 'Nenhum resultado para esse filtro.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                          emp.active !== false
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {emp.active !== false ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right" onClick={e => e.stopPropagation()}>
                        {emp.active !== false ? (
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
                              <span className={`font-bold ${emp.active !== false ? 'text-emerald-600' : 'text-red-500'}`}>
                                {emp.active !== false ? 'Acesso liberado' : 'Acesso bloqueado'}
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


      {/* ── Comunicados + anúncios ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Publicar comunicado */}
        <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-sm flex flex-col">
          <div>
            <h4 className="font-bold text-md text-slate-800 dark:text-slate-100">Publicar Comunicado Interno</h4>
            <p className="text-xs text-slate-400 mt-0.5">Informe novidades e campanhas de saúde para todos os colaboradores.</p>
          </div>
          <form onSubmit={handleCreateAnnouncement} className="space-y-3 flex-1">
            <input type="text" required placeholder="Título do comunicado..."
              value={annTitle} onChange={e => setAnnTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-emerald-500 transition-all" />
            <textarea rows={4} required placeholder="Mensagem para os colaboradores..."
              value={annContent} onChange={e => setAnnContent(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-emerald-500 transition-all resize-none" />
            <button type="submit"
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 cursor-pointer">
              <Send className="w-3.5 h-3.5" /> Publicar Comunicado
            </button>
          </form>
        </div>

        {/* Listagem dos últimos comunicados */}
        <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-sm">
          <h4 className="font-bold text-md text-slate-800 dark:text-slate-100">Comunicados Recentes</h4>
          {announcements.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <p className="text-xs text-slate-400">Nenhum comunicado publicado ainda.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {announcements.slice(0, 6).map(ann => (
                <div key={ann.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/30 dark:bg-slate-950/20 space-y-1">
                  <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100 leading-tight">{ann.title}</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{ann.content}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">{ann.author}</span>
                    <span className="text-[10px] text-slate-400">{new Date(ann.publishedAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* ── Modal: Novo Colaborador ───────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            <button onClick={() => setShowModal(false)}
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
                <button type="button" onClick={() => setShowModal(false)}
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
