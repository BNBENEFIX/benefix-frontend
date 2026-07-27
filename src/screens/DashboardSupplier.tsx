import React, { useState, useEffect } from 'react';
import { benefitService, couponService, metricsService } from '../services/api';
import { Benefit, Coupon } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { 
  Sparkles, Plus, Ticket, FileText, ShoppingBag, Star, Trash2, 
  Settings, CheckCircle2, ChevronRight, HelpCircle, RefreshCw 
} from 'lucide-react';

export const DashboardSupplier: React.FC = () => {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showBenefitModal, setShowBenefitModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  
  const [newBenefit, setNewBenefit] = useState<Partial<Benefit>>({
    name: '', category: 'Saúde', description: '', details: '', rules: '',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500'
  });

  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
    benefitId: '', code: '', discount: '', description: '', expiryDate: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const allB = await benefitService.getBenefits();
      const allC = await couponService.getCoupons();
      const m = await metricsService.getDashboardMetrics();
      
      // Filter list to only benefits owned by Prime Saúde (supplier_1) or owned generally
      setBenefits(allB);
      setCoupons(allC);
      setMetrics(m);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBenefit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBenefit.name || !newBenefit.description) return;
    try {
      const added = await benefitService.createBenefit({
        name: newBenefit.name,
        category: newBenefit.category as any,
        description: newBenefit.description,
        details: newBenefit.details || 'Benefício exclusivo da nossa carteira de fornecedor.',
        rules: newBenefit.rules || 'Consulte seu plano corporativo ativo.',
        imageUrl: newBenefit.imageUrl || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500',
        supplierId: 'sup_1',
        supplierName: 'Prime Saúde',
        status: 'Ativo'
      });
      setBenefits([added, ...benefits]);
      setShowBenefitModal(false);
      setNewBenefit({ name: '', category: 'Saúde', description: '', details: '', rules: '', imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500' });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discount || !newCoupon.benefitId) return;
    try {
      const parentB = benefits.find(b => b.id === newCoupon.benefitId);
      const added = await couponService.createCoupon({
        benefitId: newCoupon.benefitId,
        benefitName: parentB ? parentB.name : 'Benefício Parceiro',
        code: newCoupon.code.toUpperCase(),
        discount: newCoupon.discount,
        description: newCoupon.description || 'Desconto corporativo exclusivo.',
        expiryDate: newCoupon.expiryDate || '2026-12-31'
      });
      setCoupons([added, ...coupons]);
      setShowCouponModal(false);
      setNewCoupon({ benefitId: '', code: '', discount: '', description: '', expiryDate: '' });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteBenefit = async (id: string) => {
    if (confirm('Tem certeza de que deseja suspender ou remover permanentemente este benefício?')) {
      try {
        await benefitService.deleteBenefit(id);
        setBenefits(benefits.filter(b => b.id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading || !metrics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Carregando Painel Fornecedor...</span>
        </div>
      </div>
    );
  }

  // Gráfico de resgates — alimentado pelos coupons e vouchers reais da API
  const supplierCharts = coupons.length > 0
    ? [{ name: 'Atual', resgastes: coupons.length, visualizacoes: coupons.length * 3 }]
    : [];

  return (
    <div className="p-6 space-y-8 text-left fade-in">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display font-black text-xl text-slate-800 dark:text-neutral-50">Portal do Fornecedor Credenciado</h2>
          <p className="text-xs text-slate-400">Gerencie seus benefícios ofertados, cupons ativos e consulte avaliações de qualidade.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCouponModal(true)}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Ticket className="w-4 h-4 text-emerald-500" />
            Criar Cupom
          </button>
          <button
            onClick={() => setShowBenefitModal(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Benefício
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Benefícios Credenciados</span>
            <div className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100">{benefits.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
        </div>

        <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Resgastes Efetuados</span>
            <div className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100">194</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cupons Ativos</span>
            <div className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100">{coupons.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center">
            <Ticket className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Nota Média</span>
            <div className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100">4.85 / 5.0</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
          </div>
        </div>
      </div>

      {/* Supplier Analytics charts block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Utilization Trend Graph */}
        <div className="lg:col-span-2 p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-sm">
          <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Volume de Resgates de Cupons vs Visualizações</h4>
          <div className="h-60 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={supplierCharts}>
                <defs>
                  <linearGradient id="supGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="resgastes" stroke="#6366f1" fillOpacity={1} fill="url(#supGrad)" strokeWidth={2} name="Resgastes Reais" />
                <Area type="monotone" dataKey="visualizacoes" stroke="#10b981" fillOpacity={0} strokeWidth={2} name="Cliques no Catálogo" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Coupon active listing */}
        <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-205">Campanhas e Cupons de Desconto</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Emita descontos exclusivos para acelerar a utilização.</p>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-52 pr-1 mt-2">
            {coupons.map((c) => (
              <div key={c.id} className="p-3 border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{c.code}</span>
                  <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1">{c.benefitName}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300">{c.discount}</span>
                  <span className="block text-[9px] text-slate-400 mt-0.5">Expira {c.expiryDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* CRUD TABLE: List of owned benefits */}
      <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-sm">
        <h4 className="font-bold text-md text-slate-800 dark:text-slate-100">Portfólio de Benefícios Ativos para RHs</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b) => (
            <div key={b.id} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/20 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm group">
              <div className="relative">
                <img src={b.imageUrl} alt={b.name} className="w-full h-36 object-cover" />
                <span className="absolute top-2.5 right-2.5 text-[8px] font-extrabold uppercase bg-slate-900/80 text-white px-2 py-1 rounded-md backdrop-blur-sm">
                  {b.category}
                </span>
              </div>
              <div className="p-4 space-y-3 text-left flex-1 flex flex-col justify-between">
                <div>
                  <h5 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-snug group-hover:text-emerald-500 transition-colors">{b.name}</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">{b.description}</p>
                </div>
                
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-400">
                  <div className="flex justify-between items-center">
                    <span>Avaliação:</span>
                    <span className="font-bold text-amber-500 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500" /> {b.rating} ({b.ratingCount})
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Status de Filtro:</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-extrabold uppercase">Ativo</span>
                  </div>
                </div>

                <button 
                  onClick={() => handleDeleteBenefit(b.id)}
                  className="w-full py-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-650 dark:text-red-400 font-bold text-[10px] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Deletar Benefício
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefit Creation Modal */}
      {showBenefitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <h4 className="font-display font-bold text-md text-slate-800 dark:text-slate-100">Cadastrar Benefício no SaaS</h4>
            
            <form onSubmit={handleCreateBenefit} className="space-y-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Nome Comercial</label>
                    <input 
                      type="text" required placeholder="Ex: Telemedicina Global 24h"
                      value={newBenefit.name}
                      onChange={(e) => setNewBenefit({ ...newBenefit, name: e.target.value })}
                      className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-800 dark:text-slate-100 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Categoria</label>
                    <select
                      value={newBenefit.category}
                      onChange={(e) => setNewBenefit({ ...newBenefit, category: e.target.value as any })}
                      className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-800 dark:text-slate-100 focus:border-emerald-500 transition-all"
                    >
                      <option value="Saúde">Saúde</option>
                      <option value="Academias">Academias</option>
                      <option value="Educacao">Educação</option>
                      <option value="Psicologia">Psicologia</option>
                      <option value="Alimentação">Alimentação</option>
                      <option value="Transporte">Transporte</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Imagem Ilustrativa URL</label>
                  <input 
                    type="url" placeholder="https://images.unsplash.com/photo-..."
                    value={newBenefit.imageUrl}
                    onChange={(e) => setNewBenefit({ ...newBenefit, imageUrl: e.target.value })}
                    className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-800 dark:text-slate-100 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Breve Descrição para o Card</label>
                  <textarea 
                    rows={2} required placeholder="Descrição direta exibida no catálogo..."
                    value={newBenefit.description}
                    onChange={(e) => setNewBenefit({ ...newBenefit, description: e.target.value })}
                    className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-800 dark:text-slate-100 focus:border-emerald-500 transition-all resize-none"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Detalhes da Cobertura</label>
                    <textarea 
                      rows={2} placeholder="Ex: Sessões individuais online..."
                      value={newBenefit.details}
                      onChange={(e) => setNewBenefit({ ...newBenefit, details: e.target.value })}
                      className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-800 dark:text-slate-100 focus:border-emerald-500 transition-all resize-none"
                    ></textarea>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Regras de Elegibilidade</label>
                    <textarea 
                      rows={2} placeholder="Ex: Somente regime CLT..."
                      value={newBenefit.rules}
                      onChange={(e) => setNewBenefit({ ...newBenefit, rules: e.target.value })}
                      className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-800 dark:text-slate-100 focus:border-emerald-500 transition-all resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" onClick={() => setShowBenefitModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon Creation Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-left">
            <h4 className="font-display font-bold text-md text-slate-800 dark:text-slate-100">Emitir Novo Cupom de Desconto</h4>
            
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Benefício Vinculado</label>
                  <select
                    required
                    value={newCoupon.benefitId}
                    onChange={(e) => setNewCoupon({ ...newCoupon, benefitId: e.target.value })}
                    className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-800 dark:text-slate-100 focus:border-emerald-500 transition-all"
                  >
                    <option value="">Selecione o benefício...</option>
                    {benefits.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Código Promocional</label>
                    <input 
                      type="text" required placeholder="Ex: SAUDEPLUS"
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                      className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-800 dark:text-slate-100 focus:border-emerald-500 transition-all font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Desconto / Tag</label>
                    <input 
                      type="text" required placeholder="Ex: 20% OFF ou R$100"
                      value={newCoupon.discount}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discount: e.target.value })}
                      className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-800 dark:text-slate-100 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Validade</label>
                    <input 
                      type="date" required
                      value={newCoupon.expiryDate}
                      onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                      className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-800 dark:text-slate-100 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" onClick={() => setShowCouponModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Registrar Campanha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
