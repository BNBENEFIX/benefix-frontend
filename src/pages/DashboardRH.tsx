import React, { useState, useEffect } from 'react';
import { requestService, announcementService, metricsService } from '../services/api';
import { BenefitRequest, Announcement } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { 
  Building2, Users, FileSpreadsheet, Send, Megaphone, CheckCircle2, 
  XSquare, Sparkles, Star, Heart, Activity, Smile, MessageSquare, RefreshCw 
} from 'lucide-react';
import { Toast } from '../components/Toast';

export const DashboardRH: React.FC = () => {
  const [requests, setRequests] = useState<BenefitRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Announcement creation
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  const loadRHData = async () => {
    setLoading(true);
    try {
      const allR = await requestService.getRequests();
      const allA = await announcementService.getAnnouncements();
      const m = await metricsService.getDashboardMetrics();
      
      setRequests(allR);
      setAnnouncements(allA);
      setMetrics(m);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRHData();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    try {
      const added = await announcementService.createAnnouncement({
        title,
        content,
        author: 'Mariana Silva (RH)',
        companyId: 'comp_1'
      });
      setAnnouncements([added, ...announcements]);
      setTitle('');
      setContent('');
      setToast({ visible: true, message: 'Seu comunicado interno foi publicado e sintonizado no feed de todos os funcionários.', type: 'success' });
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateRequest = async (id: string, status: 'Aprovado' | 'Rejeitado') => {
    const justification = status === 'Rejeitado' ? prompt('Se desejar, informe a justificativa da rejeição corporativa:') || undefined : undefined;
    try {
      const updated = await requestService.updateRequestStatus(id, status, justification);
      setRequests(requests.map(r => r.id === id ? updated : r));
      setToast({ visible: true, message: `Solicitação registrada com status "${status}" com sucesso.`, type: 'success' });
    } catch (error) {
      console.error(error);
    }
  };

  // Export report mockup helper
  const handleExportReport = (format: 'PDF' | 'EXCEL') => {
    setToast({ visible: true, message: `O relatório analítico de Indicadores ESG e Utilização de Benefícios foi consolildado e exportado com sucesso em formato ${format}.`, type: 'success' });
  };

  if (loading || !metrics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Carregando Dashboard do RH...</span>
        </div>
      </div>
    );
  }

  // ESG scores Mock statistics for RH
  const esgCharts = [
    { name: 'Bem-estar', score: metrics.esgWellnessScore, ideal: 100 },
    { name: 'Saúde Física', score: 85, ideal: 100 },
    { name: 'Engajamento', score: metrics.esgEngagementScore, ideal: 100 },
    { name: 'Clima Geral', score: 90, ideal: 100 },
  ];

  return (
    <div className="p-6 space-y-8 text-left fade-in">
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, visible: false })} />

      {/* Primary KPI Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display font-black text-xl text-slate-800 dark:text-neutral-50">Portal Corporativo de Gestão de RH</h2>
          <p className="text-xs text-slate-400">Gerenciamento analítico de bem-estar corporal, comunicados internos e relatórios ESG do time Acme Digital.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={() => handleExportReport('EXCEL')}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            Planilha Excel
          </button>
          <button 
            onClick={() => handleExportReport('PDF')}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            Exportar PDF
          </button>
        </div>
      </div>

      {/* KPI Stats Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Colaboradores Monitorados</span>
            <div className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100">350</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Benefícios Contratados</span>
            <div className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100">4 / {metrics.activeBenefitsCount}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center">
            <Building2 className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Aprovações Pendentes</span>
            <div className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100">
              {requests.filter(r => r.status === 'Pendente').length}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Índice ESG Interno</span>
            <div className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100">
              {((metrics.esgWellnessScore + metrics.esgEngagementScore) / 2).toFixed(0)}%
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Visual charts (ESG dashboard focus) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Radar metrics ESG representation using BarChart */}
        <div className="lg:col-span-2 p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Visão Geral dos Indicadores Corporativos ESG</h4>
            <span className="text-[10px] px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">Estratégico</span>
          </div>
          <div className="h-60 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={esgCharts}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} name="Engajamento Geral (%)" />
                <Bar dataKey="ideal" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Meta Ideal (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bulletins / Announcements setups */}
        <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Publicar Notícias e Comunicados</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Informe novidades e campanhas de saúde.</p>
          </div>

          <form onSubmit={handleCreateAnnouncement} className="space-y-3 mt-1.5 flex-1">
            <input 
              type="text" required placeholder="Título do comunicado..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-emerald-500 transition-all font-medium"
            />
            <textarea 
              rows={3} required placeholder="Qual recado deseja fixar no painel dos colaboradores? *"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-emerald-500 transition-all resize-none mt-2"
            ></textarea>
            
            <button 
              type="submit" 
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Fixar Informativo
            </button>
          </form>
        </div>

      </div>

      {/* Solicitation approval lists */}
      <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-sm">
        <div>
          <h4 className="font-bold text-md text-slate-800 dark:text-slate-100">Fila de Solicitações para Aprovação Contratual</h4>
          <p className="text-xs text-slate-400 mt-0.5">Revise solicitações pendentes e aprove em tempo real para permitir a emissão de voucher e resgates.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400">
                <th className="py-3 px-1 font-bold uppercase tracking-wider">Colaborador</th>
                <th className="py-3 px-1 font-bold uppercase tracking-wider">Benefício</th>
                <th className="py-3 px-1 font-bold uppercase tracking-wider">Categoria / Rede</th>
                <th className="py-3 px-1 font-bold uppercase tracking-wider">Data de Solicitação</th>
                <th className="py-3 px-1 font-bold uppercase tracking-wider">Status</th>
                <th className="py-3 px-1 font-bold uppercase tracking-wider text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-350">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/5">
                  <td className="py-3.5 px-1 font-bold text-slate-800 dark:text-slate-100">{r.employeeName}</td>
                  <td className="py-3.5 px-1 font-semibold text-slate-700 dark:text-slate-200">{r.benefitName}</td>
                  <td className="py-3.5 px-1 font-mono text-[10px] text-slate-400">{r.category}</td>
                  <td className="py-3.5 px-1 text-slate-450">{new Date(r.requestedAt).toLocaleString('pt-BR')}</td>
                  <td className="py-3.5 px-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      r.status === 'Rejeitado' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-1 text-right space-x-1">
                    {r.status === 'Pendente' ? (
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => handleUpdateRequest(r.id, 'Rejeitado')}
                          className="p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-red-650 hover:bg-red-50 text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Rejeitar
                        </button>
                        <button 
                          onClick={() => handleUpdateRequest(r.id, 'Aprovado')}
                          className="p-1 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold transition-all shadow-sm cursor-pointer"
                        >
                          Aprovar
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
