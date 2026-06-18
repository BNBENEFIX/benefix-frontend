import React, { useState, useEffect } from 'react';
import { metricsService, userService, surveyService } from '../services/api';
import { partnershipService } from '../services/partnershipService';
import { SurveyCampaign, SurveyResponse } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { 
  Building2, Users, ShoppingBag, ShieldCheck, HelpCircle, ArrowUpRight, 
  Settings, CheckCircle2, AlertCircle, Ban, RefreshCw, Sparkles, MessageSquare, Plus, Trash2, Star, Check
} from 'lucide-react';
import { Toast } from '../components/Toast';

export const DashboardAdmin: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', cnpj: '', employeesCount: 50 });
  const [loading, setLoading] = useState(true);

  // Survey states and sub tabs
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'surveys'>('dashboard');
  const [campaigns, setCampaigns] = useState<SurveyCampaign[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ title: '', description: '', period: '' });
  const [partnershipId, setPartnershipId] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  const syncData = async () => {
    setLoading(true);
    try {
      const data = await metricsService.getDashboardMetrics();
      const allUsers = await userService.getUsers();
      const allCamps = await surveyService.getCampaigns();
      const allResps = await surveyService.getResponses();
      setMetrics(data);
      setUsers(allUsers);
      setCampaigns(allCamps);
      setResponses(allResps);
    } catch (error) {
      console.error('Error fetching admin metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.title) return;
    try {
      await surveyService.createCampaign({
        title: newCampaign.title,
        description: newCampaign.description,
        period: newCampaign.period || 'Q2 2026',
        sentBy: 'Mariana Silva (RH)',
      });
      setNewCampaign({ title: '', description: '', period: '' });
      setShowSurveyModal(false);
      await syncData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseCampaign = async (id: string) => {
    try {
      await surveyService.closeCampaign(id);
      await syncData();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    syncData();
  }, []);

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.name || !newCompany.cnpj) return;
    setCompanies([
      ...companies,
      {
        id: (companies.length + 1).toString(),
        name: newCompany.name,
        cnpj: newCompany.cnpj,
        status: 'Pendente',
        employeesCount: Number(newCompany.employeesCount),
        hiredBenefitsCount: 0
      }
    ]);
    setNewCompany({ name: '', cnpj: '', employeesCount: 50 });
    setShowCompanyModal(false);
  };

  const toggleCompanyStatus = (id: string, newStatus: 'Ativo' | 'Suspenso') => {
    setCompanies(companies.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  const handlePartnershipAction = async (action: 'accept' | 'reject' | 'disable') => {
    const parsedId = Number(partnershipId);
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      setToast({ visible: true, message: 'Informe um partnershipId válido.', type: 'error' });
      return;
    }

    try {
      if (action === 'accept') {
        await partnershipService.accept(parsedId);
      } else if (action === 'reject') {
        await partnershipService.reject(parsedId);
      } else {
        await partnershipService.disable(parsedId);
      }

      setToast({
        visible: true,
        message: `Parceria ${action === 'accept' ? 'aceita' : action === 'reject' ? 'rejeitada' : 'desabilitada'} com sucesso.`,
        type: 'success',
      });
      setPartnershipId('');
    } catch (error) {
      console.error(error);
      setToast({ visible: true, message: 'Falha ao executar a ação da parceria.', type: 'error' });
    }
  };

  const COLORS = ['#22c55e', '#0ea5e9', '#ec4899', '#f59e0b'];

  if (loading || !metrics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Carregando Painel Administrativo...</span>
        </div>
      </div>
    );
  }

  // Map topBenefits to PieChart friendly structure
  const pieData = metrics.topBenefits.map((b: any, index: number) => ({
    name: b.name,
    value: b.utilizadores,
  }));

  // Aggregated NPS and platform satisfaction stats for the surveys sub-tab
  const surveyMetrics = metrics.surveysMetrics || {
    totalResponses: responses.length,
    promCount: responses.filter((r: any) => r.nps >= 9).length,
    neutCount: responses.filter((r: any) => r.nps >= 7 && r.nps <= 8).length,
    detrCount: responses.filter((r: any) => r.nps <= 6).length,
    npsScore: 75,
    platformSatisfactionAvg: 4.6
  };

  const calculateNPSTone = (score: number) => {
    if (score >= 76) return { text: 'Zona de Excelência', color: 'text-emerald-500 border-emerald-500 bg-emerald-500/10' };
    if (score >= 50) return { text: 'Zona de Qualidade', color: 'text-indigo-505 border-indigo-550 bg-indigo-500/10' };
    if (score >= 0) return { text: 'Zona de Aperfeiçoamento', color: 'text-amber-500 border-amber-500 bg-amber-500/10' };
    return { text: 'Zona Crítica', color: 'text-red-500 border-red-500 bg-red-500/10' };
  };

  return (
    <div className="p-6 space-y-8 text-left fade-in">
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, visible: false })} />
      
      {/* Sub-Layout Navigation and Corporate Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] bg-indigo-500/15 text-indigo-500 font-extrabold uppercase tracking-widest leading-none">
              Administração de Benefícios
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/10 text-emerald-500 font-bold uppercase tracking-wide leading-none font-sans">
              SaaS Multitenant
            </span>
          </div>
          <h2 className="font-display font-black text-2xl tracking-tight text-slate-800 dark:text-slate-100">
            Painel de Operações Administrativas
          </h2>
          <p className="text-xs text-slate-400 font-sans">
            Monitore a utilização dos tenants, faturamento operacional e gerencie as campanhas de satisfação geral e clima corporativo.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-150 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-250 dark:border-slate-850 self-start md:self-center font-sans">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'dashboard'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Métricas Gerais</span>
          </button>
          <button
            onClick={() => setActiveSubTab('surveys')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'surveys'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Pesquisas &amp; NPS</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'dashboard' ? (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Empresas Contratantes</span>
            <div className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100">{companies.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Usuários Totais</span>
            <div className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100">{metrics.usersCount}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Benefícios Globais</span>
            <div className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100">{metrics.activeBenefitsCount}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Solicitações Pendentes</span>
            <div className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100">{metrics.pendingRequestsCount}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visual Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Growing user stats */}
        <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Utilização de Vouchers e Vendas Ativas</h4>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase">Consolidação</span>
          </div>
          <div className="h-60 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.monthlyVoucherUsage}>
                <defs>
                  <linearGradient id="colorUtil" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="utilizacoes" stroke="#22c55e" fillOpacity={1} fill="url(#colorUtil)" strokeWidth={2} name="Vouchers Utilizados" />
                <Area type="monotone" dataKey="cadastros" stroke="#0ea5e9" fillOpacity={0} strokeWidth={2} name="Novas Empresas" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Benefits Popularity */}
        <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Distribuição de Matrículas Ativas</h4>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold uppercase">Preferências</span>
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            <div className="w-1/2 h-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-1/2 space-y-2 text-xs">
              {metrics.topBenefits.map((b: any, index: number) => (
                <div key={b.name} className="flex items-start gap-2.5">
                  <span className="w-3 h-3 rounded-md mt-0.5 shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <div className="leading-tight">
                    <span className="font-bold text-slate-700 dark:text-slate-350 block">{b.name}</span>
                    <span className="text-[10px] text-slate-400">{b.utilizadores} colaboradores ativos</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Corporate Tenants Operations section */}
      <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-md text-slate-800 dark:text-slate-100">Empresas Contratantes Parceiras (Multitenant)</h4>
            <p className="text-xs text-slate-400 mt-0.5">Autorize, suspenda ou gerencie isolamento de dados das empresas ativas.</p>
          </div>
          <button
            onClick={() => setShowCompanyModal(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer shrink-0"
          >
            Cadastrar Nova Empresa
          </button>
        </div>

        {/* Multi-Tenant Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400">
                <th className="py-3 px-1 font-bold uppercase tracking-wider">Empresa</th>
                <th className="py-3 px-1 font-bold uppercase tracking-wider">CNPJ / Tenant ID</th>
                <th className="py-3 px-1 font-bold uppercase tracking-wider text-center">Colaboradores</th>
                <th className="py-3 px-1 font-bold uppercase tracking-wider text-center">Benefícios Contratados</th>
                <th className="py-3 px-1 font-bold uppercase tracking-wider">Status</th>
                <th className="py-3 px-1 font-bold uppercase tracking-wider text-right">Ações de Conformidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10">
                  <td className="py-3.5 px-1 font-bold text-slate-800 dark:text-slate-100">{c.name}</td>
                  <td className="py-3.5 px-1 font-mono text-[10px] text-slate-400">{c.cnpj}</td>
                  <td className="py-3.5 px-1 text-center font-semibold">{c.employeesCount}</td>
                  <td className="py-3.5 px-1 text-center">{c.hiredBenefitsCount}</td>
                  <td className="py-3.5 px-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-450' : 
                      c.status === 'Pendente' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-450' :
                      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-450'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-1 text-right space-x-1">
                    {c.status === 'Pendente' && (
                      <button 
                        onClick={() => toggleCompanyStatus(c.id, 'Ativo')}
                        className="px-2 py-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 hover:bg-emerald-500 hover:text-white rounded transition-colors cursor-pointer"
                      >
                        Aprovar Conta
                      </button>
                    )}
                    {c.status === 'Ativo' ? (
                      <button 
                        onClick={() => toggleCompanyStatus(c.id, 'Suspenso')}
                        className="px-2 py-1 text-[10px] font-semibold bg-red-500/10 text-red-600 dark:text-red-450 hover:bg-red-500 hover:text-white rounded transition-colors cursor-pointer"
                      >
                        Suspender
                      </button>
                    ) : c.status !== 'Pendente' && (
                      <button 
                        onClick={() => toggleCompanyStatus(c.id, 'Ativo')}
                        className="px-2 py-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 hover:bg-emerald-500 hover:text-white rounded transition-colors cursor-pointer"
                      >
                        Ativar Conta
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Partnerships management */}
      <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-sm">
        <div>
          <h4 className="font-bold text-md text-slate-800 dark:text-slate-100">Gestão de Parcerias</h4>
          <p className="text-xs text-slate-400 mt-0.5">Informe o <span className="font-mono font-bold">partnershipId</span> para aceitar, rejeitar ou desabilitar uma parceria.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          <input
            type="number"
            min="1"
            placeholder="partnershipId"
            value={partnershipId}
            onChange={(e) => setPartnershipId(e.target.value)}
            className="w-full md:w-72 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-emerald-500 transition-all"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handlePartnershipAction('accept')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
            >
              Aceitar
            </button>
            <button
              type="button"
              onClick={() => handlePartnershipAction('reject')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors"
            >
              Rejeitar
            </button>
            <button
              type="button"
              onClick={() => handlePartnershipAction('disable')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              Desabilitar
            </button>
          </div>
        </div>
      </div>
        </>
      ) : (
        <>
          {/* Survey KPI aggregated layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border border-indigo-500/20 bg-indigo-500/[0.02] dark:bg-slate-900 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="space-y-1">
                <span className="text-[10px] text-indigo-500 dark:text-indigo-400 uppercase font-black tracking-widest block leading-none pt-1">Índice NPS Acumulado</span>
                <div className="flex items-center gap-4 pt-2.5">
                  <span className="font-display font-black text-4xl text-slate-805 dark:text-white">
                    {surveyMetrics.npsScore > 0 ? `+${surveyMetrics.npsScore}` : surveyMetrics.npsScore}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${calculateNPSTone(surveyMetrics.npsScore).color}`}>
                    {calculateNPSTone(surveyMetrics.npsScore).text}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed pt-4 font-sans">
                Calculado de forma padrão de mercado: % Promotores (notas 9-10) menos % Detratores (notas 0-6).
              </p>
            </div>

            <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex flex-col justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block font-bold leading-none pt-1">Média de Satisfação</span>
                <div className="flex items-center gap-1.5 pt-2.5">
                  <span className="font-display font-black text-3xl text-slate-805 dark:text-white">
                    {surveyMetrics.platformSatisfactionAvg} / 5
                  </span>
                  <div className="flex text-amber-500 ml-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-amber-450 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed pt-4 font-sans">
                Média agregada de estrelas atribuídas pelos colaboradores ao utilizar e resgatar cupons/vouchers no portal.
              </p>
            </div>

            <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex flex-col justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block font-bold leading-none pt-1">Envios Respondidos</span>
                <div className="font-display font-black text-3xl pt-2 text-slate-805 dark:text-white">
                  {responses.length} Participações
                </div>
              </div>
              <div className="pt-3 flex gap-2">
                <span className="text-[9px] bg-slate-150 dark:bg-slate-950 px-2 py-1 rounded font-bold text-emerald-500">
                  Promotores: {responses.filter(r => r.nps >= 9).length}
                </span>
                <span className="text-[9px] bg-slate-150 dark:bg-slate-950 px-2 py-1 rounded font-bold text-indigo-400">
                  Neutros: {responses.filter(r => r.nps >= 7 && r.nps <= 8).length}
                </span>
                <span className="text-[9px] bg-slate-150 dark:bg-slate-950 px-2 py-1 rounded font-bold text-red-500">
                  Detratores: {responses.filter(r => r.nps <= 6).length}
                </span>
              </div>
            </div>
          </div>

          {/* Campaigns Dispatch and Periodic Setup Area */}
          <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-md text-slate-805 dark:text-white font-display">Envio de Pesquisas Periódicas (Clima do Q2)</h4>
                <p className="text-xs text-slate-400 mt-0.5">Dispare ou finalize pesquisas ativas para mensurar a reputação dos convênios corporativos.</p>
              </div>
              <button
                onClick={() => setShowSurveyModal(true)}
                className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer shrink-0 flex items-center gap-1.5 font-sans"
              >
                <Plus className="w-4 h-4" />
                <span>Disparar Nova Pesquisa</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400">
                    <th className="py-3 px-1 font-bold uppercase tracking-wider">Período</th>
                    <th className="py-3 px-1 font-bold uppercase tracking-wider">Título da Campanha de Clima</th>
                    <th className="py-3 px-1 font-bold uppercase tracking-wider">Disparado Por</th>
                    <th className="py-3 px-1 font-bold uppercase tracking-wider text-center">Status</th>
                    <th className="py-3 px-1 font-bold uppercase tracking-wider text-right font-sans">Ações Operacionais</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 font-sans">
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/15">
                      <td className="py-3.5 px-1 font-bold text-indigo-500 dark:text-indigo-400 tracking-tight">{camp.period}</td>
                      <td className="py-3.5 px-1 font-sans">
                        <div className="font-semibold text-slate-850 dark:text-slate-200">{camp.title}</div>
                        <p className="text-[10px] text-slate-405 line-clamp-1">{camp.description}</p>
                      </td>
                      <td className="py-3.5 px-1 text-slate-400 font-sans">{camp.sentBy}</td>
                      <td className="py-3.5 px-1 text-center font-sans">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          camp.status === 'Ativo' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' : 'bg-slate-100 text-slate-650 dark:bg-slate-800/50 dark:text-slate-400'
                        }`}>
                          {camp.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-1 text-right whitespace-nowrap">
                        {camp.status === 'Ativo' ? (
                          <button
                            onClick={() => handleCloseCampaign(camp.id)}
                            className="px-2.5 py-1 text-[10px] font-extrabold text-amber-600 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                          >
                            Encerrar Pesquisa
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic font-medium">Sem pendências</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Employee Feedback and Reputations List */}
          <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-6 shadow-sm">
            <div>
              <h4 className="font-bold text-md text-slate-850 dark:text-white font-display">Resultado Agregado: Notas &amp; Críticas de Benefícios Ofertados</h4>
              <p className="text-xs text-slate-400 mt-0.5">Estude as pontuações e comentários enviados com estrelas pelos colaboradores.</p>
            </div>

            <div className="overflow-x-auto font-sans">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400">
                    <th className="py-3 px-1 font-bold uppercase tracking-wider">Colaborador</th>
                    <th className="py-3 px-1 font-bold uppercase tracking-wider text-center font-sans">NPS</th>
                    <th className="py-3 px-1 font-bold uppercase tracking-wider text-center font-sans">Plataforma</th>
                    <th className="py-3 px-1 font-bold uppercase tracking-wider font-sans">Benefício Avaliado</th>
                    <th className="py-3 px-1 font-bold uppercase tracking-wider text-center font-sans">Estrelas</th>
                    <th className="py-3 px-1 font-bold uppercase tracking-wider font-sans">Comentários / Sugestões do Colaborador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {responses.map((resp) => (
                    <tr key={resp.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/15">
                      <td className="py-3.5 px-1 font-bold text-slate-805 dark:text-white">{resp.employeeName}</td>
                      <td className="py-3.5 px-1 text-center">
                        <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                          resp.nps >= 9 ? 'bg-emerald-500/10 text-emerald-500' :
                          resp.nps >= 7 ? 'bg-indigo-500/10 text-indigo-400' :
                          'bg-red-500/10 text-red-500 font-bold'
                        }`}>
                          Nota {resp.nps}
                        </span>
                      </td>
                      <td className="py-3.5 px-1">
                        <div className="flex text-amber-500 justify-center">
                          {[1, 2, 3, 4, 5].map((st) => (
                            <Star key={st} className={`w-3.5 h-3.5 ${st <= resp.platformSatisfaction ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-800'}`} />
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-1 text-slate-405 truncate max-w-[200px]" title={resp.benefitName || 'Nenhum'}>
                        {resp.benefitName || <span className="italic text-slate-400/50">Não especificado</span>}
                      </td>
                      <td className="py-3.5 px-1">
                        {resp.benefitRating ? (
                          <div className="flex text-amber-500 justify-center">
                            {[1, 2, 3, 4, 5].map((st) => (
                              <Star key={st} className={`w-3.5 h-3.5 ${st <= resp.benefitRating ? 'fill-amber-450 text-amber-400' : 'text-slate-300 dark:text-slate-800'}`} />
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400/55 block text-center">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-1 max-w-[320px] text-justify leading-relaxed whitespace-pre-wrap font-sans">
                        {resp.benefitComment ? (
                          <p className="text-slate-500 dark:text-slate-400 italic font-medium">&ldquo;{resp.benefitComment}&rdquo;</p>
                        ) : (
                          <span className="text-slate-400/50 italic font-sans animate-pulse">Sem observações adicionais</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Registration Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-left animate-in fade-in zoom-in duration-200">
            <h4 className="font-display font-bold text-md text-slate-800 dark:text-slate-100">Vincular Nova Empresa Cliente (Tenant)</h4>
            
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Razão Social</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nome completo da corporação" 
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">CNPJ Comercial</label>
                    <input 
                      type="text" 
                      required
                      placeholder="00.000.000/0001-00" 
                      value={newCompany.cnpj}
                      onChange={(e) => setNewCompany({ ...newCompany, cnpj: e.target.value })}
                      className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Funcionários CLT</label>
                    <input 
                      type="number" 
                      required
                      min={10}
                      value={newCompany.employeesCount}
                      onChange={(e) => setNewCompany({ ...newCompany, employeesCount: Number(e.target.value) })}
                      className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCompanyModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Registrar Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Periodic Survey Dispatcher Dispatch Form Modal */}
      {showSurveyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-left animate-in fade-in zoom-in duration-200">
            <div className="space-y-1">
              <span className="text-[10px] bg-indigo-500/10 text-indigo-500 font-extrabold uppercase px-2 py-0.5 rounded tracking-wide font-mono leading-none">
                Configuração de Disparo
              </span>
              <h4 className="font-display font-black text-md text-slate-800 dark:text-slate-100">Disparar Nova Pesquisa</h4>
              <p className="text-[10px] text-slate-400">Todos os colaboradores visualizarão um convite de engajamento em seus respectivos painéis.</p>
            </div>
            
            <form onSubmit={handleCreateCampaign} className="space-y-4 font-sans">
              <div className="space-y-3 font-sans">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Título da Campanha de Clima</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Pesquisa de Clima Corporativo & Benefícios Q3" 
                    value={newCampaign.title}
                    onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                    className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1 font-sans">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Objetivo para Colaboradores</label>
                  <textarea 
                    required
                    maxLength={300}
                    placeholder="Ex: Queremos ouvir sua opinião sincera sobre a qualidade, operadora e usabilidade dos planos de saúde e alimentação." 
                    value={newCampaign.description}
                    onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                    className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs h-24 focus:border-indigo-500 text-slate-800 dark:text-slate-100 resize-none font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1 font-sans">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Período de Apuração / Referência</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Q2 2026, Junho 2026" 
                    value={newCampaign.period}
                    onChange={(e) => setNewCampaign({ ...newCampaign, period: e.target.value })}
                    className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-sans"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 font-sans">
                <button 
                  type="button" 
                  onClick={() => setShowSurveyModal(false)}
                  className="px-4 py-2 hover:bg-slate-150 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-720 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1 font-sans"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Ativar Envio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
