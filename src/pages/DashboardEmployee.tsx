import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { voucherService, couponService, requestService, rankingService, ratingService, surveyService, benefitService } from '../services/api';
import { Voucher, Coupon, BenefitRequest, CalendarEvent, FeedbackRating, SurveyCampaign, SurveyResponse, Benefit } from '../types';
import { 
  Trophy, Gift, Calendar, Bookmark, QrCode, FileText, ArrowRight, 
  Sparkles, CheckCircle2, Star, ThumbsUp, Send, RefreshCw, X
} from 'lucide-react';
import { Toast } from '../components/Toast';

export const DashboardEmployee: React.FC = () => {
  const { user, refreshUserData } = useAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [requests, setRequests] = useState<BenefitRequest[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // QR Modal
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  // Rating and comments feedback form
  const [selectedBenefitId, setSelectedBenefitId] = useState('');
  const [note, setNote] = useState(5);
  const [comment, setComment] = useState('');

  // Survey system states
  const [activeCampaign, setActiveCampaign] = useState<SurveyCampaign | null>(null);
  const [benefitsList, setBenefitsList] = useState<Benefit[]>([]);
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  
  // Survey Form states
  const [npsValue, setNpsValue] = useState<number | null>(null);
  const [platformSat, setPlatformSat] = useState<number>(5);
  const [surveyBenefitId, setSurveyBenefitId] = useState('');
  const [surveyBenefitRating, setSurveyBenefitRating] = useState(5);
  const [surveyBenefitComment, setSurveyBenefitComment] = useState('');

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  const loadEmployeeData = async () => {
    setLoading(true);
    try {
      const allV = await voucherService.getVouchers();
      const allC = await couponService.getCoupons();
      const allR = await requestService.getRequests();
      const allE = await rankingService.getEvents();
      const allB = await benefitService.getBenefits();
      const campaigns = await surveyService.getCampaigns();
      const responses = await surveyService.getResponses();

      // Show user's related ones
      setVouchers(allV.filter(v => v.employeeId === user?.id));
      setCoupons(allC);
      setRequests(allR.filter(r => r.employeeId === user?.id));
      setEvents(allE);
      setBenefitsList(allB);

      // Check if there's any active campaign that has not been answered by this employee
      const active = campaigns.find(c => c.status === 'Ativo');
      if (active) {
        const alreadyAnswered = responses.some(r => r.campaignId === active.id && r.employeeId === user?.id);
        if (!alreadyAnswered) {
          setActiveCampaign(active);
        } else {
          setActiveCampaign(null);
        }
      } else {
        setActiveCampaign(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployeeData();
  }, [user]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBenefitId || !comment) return;
    try {
      await ratingService.submitFeedback({
        benefitId: selectedBenefitId,
        rating: note,
        comment,
        employeeName: user?.name || 'Rodrigo Antunes'
      });
      setToast({ visible: true, message: 'Obrigado por avaliar! Suas sugestões foram enviadas à equipe e você ganhou +50 pontos de gamificação.', type: 'success' });
      setSelectedBenefitId('');
      setComment('');
      
      // Update score in Context API
      await refreshUserData();
      await loadEmployeeData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampaign) return;
    if (npsValue === null) {
      setToast({ visible: true, message: 'Por favor, selecione uma nota de 0 a 10 para o NPS.', type: 'error' });
      return;
    }
    try {
      await surveyService.submitResponse({
        campaignId: activeCampaign.id,
        employeeId: user?.id,
        employeeName: user?.name,
        nps: npsValue,
        platformSatisfaction: platformSat,
        benefitId: surveyBenefitId || undefined,
        benefitRating: surveyBenefitId ? surveyBenefitRating : undefined,
        benefitComment: surveyBenefitId ? surveyBenefitComment : undefined
      });

      setToast({ 
        visible: true, 
        message: 'Pesquisa periódica enviada com sucesso! Obrigado pela participação, você recebeu +150 pontos de gamificação.', 
        type: 'success' 
      });

      setSurveyModalOpen(false);
      setNpsValue(null);
      setPlatformSat(5);
      setSurveyBenefitId('');
      setSurveyBenefitComment('');

      await refreshUserData();
      await loadEmployeeData();
    } catch (err) {
      console.error(err);
      setToast({ visible: true, message: 'Erro ao enviar a pesquisa periódica. Tente novamente.', type: 'error' });
    }
  };

  const handleRedeemCoupon = (code: string) => {
    setToast({ visible: true, message: `Excelente! Cupom [${code}] resgatado com sucesso e ativo na sua carteira de benefícios.`, type: 'success' });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Carregando Seus Benefícios...</span>
        </div>
      </div>
    );
  }

  // Ranking dinâmico — apenas o usuário atual é exibido até que o backend implemente o endpoint
  const leaderBoard = user
    ? [{ rank: '1°', name: `${user.name} (Você)`, score: user.score ?? 0, level: user.level ?? 'Bronze', active: true }]
    : [];

  return (
    <div className="p-6 space-y-8 text-left fade-in">
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, visible: false })} />

      {/* Gamification Welcome card */}
      <div className="p-6 border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute inset-0 bg-emerald-700/10 blur-xl opacity-50"></div>
        <div className="space-y-2 relative">
          <span className="px-2.5 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-wider block self-start">Elegível - Acme Digital</span>
          <h2 className="font-display font-black text-2xl tracking-tight leading-tight">Olá, {user?.name}!</h2>
          <p className="text-xs text-emerald-100 max-w-lg leading-relaxed">
            Consulte seus tokens de recarga de academia, baixe vouchers com QR Code, acompanhe andamento ambiental de solicitações exclusivas e participe ativamente acumulando conquistas corporativas.
          </p>
        </div>

        {/* Level indicator badges */}
        <div className="flex gap-4 relative shrink-0">
          <div className="p-4 bg-white/10 rounded-2xl border border-white/10 text-center min-w-28 shadow-inner">
            <span className="text-[10px] text-emerald-100 uppercase tracking-widest block font-bold">Nível Geral</span>
            <span className="font-display font-black text-lg block mt-1 tracking-tight">{user?.level}</span>
          </div>
          <div className="p-4 bg-white/10 rounded-2xl border border-white/10 text-center min-w-28 shadow-inner">
            <span className="text-[10px] text-emerald-100 uppercase tracking-widest block font-bold">Pontuação</span>
            <span className="font-display font-black text-lg block mt-1 tracking-tight text-amber-300 animate-pulse">{user?.score} PTS</span>
          </div>
        </div>
      </div>

      {/* Dynamic Survey Periodic Campaign Alert Banner */}
      {activeCampaign && (
        <div className="p-5 border border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-950/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                Pesquisa Periódica Coletiva Ativa
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-extrabold text-[8px] uppercase tracking-wide">
                +150 Pontos
              </span>
            </div>
            <h3 className="font-display font-bold text-base text-slate-800 dark:text-slate-100">
              {activeCampaign.title}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              {activeCampaign.description} Deixe sua avaliação sincera e ajude o RH a moldar os melhores benefícios.
            </p>
          </div>
          <button
            onClick={() => setSurveyModalOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/20 hover:scale-103 transition-all cursor-pointer shrink-0 self-start sm:self-center"
          >
            Iniciar Pesquisa
          </button>
        </div>
      )}

      {/* Main grids layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: active vouchers and downloads */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Vouchers list with QR Code buttons */}
          <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-sm">
            <div>
              <h4 className="font-bold text-md text-slate-800 dark:text-slate-100">Seus Vouchers Digitais Resgatados</h4>
              <p className="text-xs text-slate-400 mt-0.5">Clique em &quot;Ver QR Code&quot; para apresentar e validar na recepção das redes parceiras.</p>
            </div>

            {vouchers.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Nenhum voucher gerado ainda. Explore o catálogo acima e solicite seus benefícios.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vouchers.map((v) => (
                  <div key={v.id} className="p-4 border border-slate-150 dark:border-slate-800/80 rounded-2xl bg-slate-50/40 dark:bg-slate-950/20 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        v.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-slate-250 text-slate-500'
                      }`}>
                        {v.status}
                      </span>
                      <h5 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight block pt-1">{v.benefitName}</h5>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="font-mono text-[10px] text-slate-400">Cod: {v.code}</span>
                      <button 
                        onClick={() => setSelectedVoucher(v)}
                        className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-450 hover:underline cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        Ver QR Code
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sinks requests and history statuses */}
          <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-sm">
            <h4 className="font-bold text-md text-slate-800 dark:text-slate-100">Histórico de Solicitações no RH</h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400">
                    <th className="py-2.5 px-0.5 font-bold uppercase tracking-wider">Benefício</th>
                    <th className="py-2.5 px-0.5 font-bold uppercase tracking-wider">Categoria</th>
                    <th className="py-2.5 px-0.5 font-bold uppercase tracking-wider">Data do Pedido</th>
                    <th className="py-2.5 px-0.5 font-bold uppercase tracking-wider text-right">Status do RH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850/60 text-slate-700 dark:text-slate-350">
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td className="py-3 px-0.5 font-semibold text-slate-800 dark:text-slate-100">{r.benefitName}</td>
                      <td className="py-3 px-0.5 font-mono text-[10px] text-slate-400">{r.category}</td>
                      <td className="py-3 px-0.5">{new Date(r.requestedAt).toLocaleDateString('pt-BR')}</td>
                      <td className="py-3 px-0.5 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' :
                          r.status === 'Rejeitado' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Columns: Gamification leaderboards and calendar reviews */}
        <div className="space-y-6">
          
          {/* Calendar of events */}
          <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-sm">
            <h4 className="font-bold text-md text-slate-800 dark:text-slate-100">Calendário de Saúde & Palestras</h4>
            <div className="space-y-3">
              {events.map((ev) => (
                <div key={ev.id} className="p-3 border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl flex gap-3 text-left">
                  <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0" style={{ backgroundColor: `${ev.color}15`, border: `1px solid ${ev.color}40` }}>
                    <Calendar className="w-5 h-5" style={{ color: ev.color }} />
                  </div>
                  <div className="space-y-0.5 font-medium">
                    <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-100 leading-tight">{ev.title}</h5>
                    <p className="text-[9px] text-slate-400">{ev.date} - {ev.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gamification Ranking leaderboard */}
          <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-sm">
            <h4 className="font-bold text-md text-slate-800 dark:text-slate-100">Ranking de Engajamento Interno</h4>
            <div className="space-y-2.5">
              {leaderBoard.map((l, i) => (
                <div 
                  key={i} 
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-colors ${
                    l.active 
                      ? 'border-emerald-500 bg-emerald-500/10' 
                      : 'border-slate-150 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-display font-black text-xs text-slate-400">{l.rank}</span>
                    <div>
                      <h6 className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{l.name}</h6>
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest">{l.level}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-350">{l.score} PTS</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ratings Evaluation feedback panel form */}
          <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-sm">
            <div>
              <h4 className="font-bold text-md text-slate-800 dark:text-slate-100">Avaliar Benefício Ofertado</h4>
              <p className="text-[10px] text-slate-400">Ganhe +50 pontos de gamificação ao enviar sugestões.</p>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-3.5 mt-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Benefício utilizado</label>
                <select
                  required
                  value={selectedBenefitId}
                  onChange={(e) => setSelectedBenefitId(e.target.value)}
                  className="p-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs rounded-xl outline-none"
                >
                  <option value="">Selecione o benefício...</option>
                  {benefitsList.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Nota (Estrelas)</label>
                <select
                  value={note}
                  onChange={(e) => setNote(Number(e.target.value))}
                  className="p-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs rounded-xl outline-none"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (Excelente)</option>
                  <option value={4}>⭐⭐⭐⭐ (Muito bom)</option>
                  <option value={3}>⭐⭐⭐ (Regular)</option>
                  <option value={2}>⭐⭐ (Ruim)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Comentário / Sugestão</label>
                <textarea 
                  rows={2} required placeholder="Como foi sua experiência com este benefício? *"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="p-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs rounded-xl outline-none resize-none"
                ></textarea>
              </div>

              <button 
                type="submit"
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] tracking-wide uppercase rounded-xl shadow transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Send className="w-3.5 h-3.5" /> Enviar Avaliação
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* QR Vouchers visual Download modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center shadow-2xl space-y-6 relative">
            <button 
              onClick={() => setSelectedVoucher(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="inline-block px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[9px] font-extrabold uppercase tracking-wide">
                Voucher Digital Ativo
              </span>
              <h4 className="font-display font-black text-sm text-slate-800 dark:text-slate-100 pt-1">Apresentar na Recepção</h4>
              <p className="text-xs text-slate-400 capitalize">{selectedVoucher.benefitName}</p>
            </div>

            {/* QR Code Graphic Mockup */}
            <div className="mx-auto w-44 h-44 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl flex flex-col items-center justify-center p-4 relative shadow-inner">
              <QrCode className="w-36 h-36 text-slate-800 dark:text-white" />
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent rounded-2xl"></div>
            </div>

            <div className="space-y-2">
              <div className="font-mono font-bold text-xs text-slate-600 dark:text-slate-350 tracking-widest bg-slate-50 dark:bg-slate-950 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
                {selectedVoucher.code}
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Válido até o dia {selectedVoucher.expiryDate}. Uso único e de sigilo corporal.</p>
            </div>

            <button 
              onClick={() => {
                setToast({ visible: true, message: 'Seu voucher contendo o QR Code de validação foi baixado com sucesso em sua galeria local no formato PNG.', type: 'success' });
                setSelectedVoucher(null);
              }}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Fazer Download PNG
            </button>
          </div>
        </div>
      )}

      {/* Interactive Periodic Survey Modal */}
      {surveyModalOpen && activeCampaign && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-6 animate-in fade-in zoom-in duration-200 my-8">
            <button 
              onClick={() => setSurveyModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-1.5 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> PESQUISA DE SATISFAÇÃO DE CLIMA
              </span>
              <h4 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100">{activeCampaign.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">{activeCampaign.description}</p>
            </div>

            <form onSubmit={handleSubmitSurvey} className="space-y-6 pt-2">
              {/* Question 1: NPS (Net Promoter Score) */}
              <div className="space-y-3 font-medium">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
                  1. Em uma escala de 0 a 10, o quanto você recomendaria os benefícios da nossa empresa a um conhecido? (NPS)
                </label>
                <div className="flex flex-wrap justify-between gap-1 pb-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                    <button
                      type="button"
                      key={score}
                      onClick={() => setNpsValue(score)}
                      className={`w-8.5 h-8.5 rounded-full text-xs font-black transition-all border flex items-center justify-center cursor-pointer ${
                        npsValue === score
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-110'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-400'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[9px] text-slate-450 font-bold px-1">
                  <span>0 - Muito Improvável</span>
                  <span>10 - Extremamente Provável</span>
                </div>
              </div>

              {/* Question 2: Overall Platform Satisfaction */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
                  2. Como você avalia a facilidade de uso e satisfação com a nossa plataforma?
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setPlatformSat(star)}
                      className="p-1 cursor-pointer hover:scale-110 transition-transform"
                    >
                      <Star 
                        className={`w-7 h-7 transition-colors ${
                          star <= platformSat ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-700'
                        }`} 
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 ml-2">
                    {platformSat === 5 ? 'Excelente' : platformSat === 4 ? 'Muito Bom' : platformSat === 3 ? 'Bom' : platformSat === 2 ? 'Regular' : 'Ruim'}
                  </span>
                </div>
              </div>

              {/* Question 3: Optional Benefit Critiques */}
              <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded text-[9px] font-black uppercase tracking-wider">
                    Avaliação Individual
                  </span>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350">
                    3. Deseja avaliar individualmente algum benefício que você utiliza? (Opcional)
                  </label>
                </div>
                
                <select
                  value={surveyBenefitId}
                  onChange={(e) => {
                    setSurveyBenefitId(e.target.value);
                    setSurveyBenefitRating(5);
                    setSurveyBenefitComment('');
                  }}
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">-- Selecione um benefício se quiser avaliar --</option>
                  {benefitsList.map((benefit) => (
                    <option key={benefit.id} value={benefit.id}>
                      [{benefit.providerName}] - {benefit.name}
                    </option>
                  ))}
                </select>

                {surveyBenefitId && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Classificação do Benefício:</span>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setSurveyBenefitRating(star)}
                            className="p-1 cursor-pointer hover:scale-110 transition-transform"
                          >
                            <Star 
                              className={`w-6.5 h-6.5 transition-colors ${
                                star <= surveyBenefitRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-750'
                              }`} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Deixe seu comentário ou sugestão de melhoria:</span>
                      <textarea
                        value={surveyBenefitComment}
                        onChange={(e) => setSurveyBenefitComment(e.target.value)}
                        placeholder="Escreva sobre prazos, agilidade, atendimento ou experiência geral com este benefício..."
                        className="w-full h-20 text-xs p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                        required={!!surveyBenefitId}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSurveyModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-250 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/20 active:scale-97 transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Pesquisa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
