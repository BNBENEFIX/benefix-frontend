import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { benefitService as catalogBenefitService, recommendationService } from '../services/api';
import { benefitService as realBenefitService } from '../services/benefitService';
import { partnershipService } from '../services/partnershipService';
import { companyService } from '../services/companyService';
import type { Benefit, BenefitCategory } from '../types';
import {
  Search, Filter, Star, Sparkles, Send, Heart, RefreshCw,
  Plus, Trash2, ToggleLeft, ToggleRight, X, AlertCircle,
  Package, PlusCircle, CheckCircle2,
} from 'lucide-react';
import { Toast } from '../components/Toast';

// ── Sub-componentes definidos fora do render para evitar remontagem ───────────

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}
const Field: React.FC<FieldProps> = ({ label, error, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-[11px] text-red-500">
        <AlertCircle className="w-3 h-3 shrink-0" />{error}
      </p>
    )}
  </div>
);

const inputCls = (err?: string) =>
  `p-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl outline-none text-xs text-slate-800
   dark:text-slate-100 placeholder-slate-400 focus:ring-1 transition-all disabled:opacity-50 ${
     err
       ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
       : 'border-slate-200 dark:border-slate-800 focus:border-emerald-500 focus:ring-emerald-500'
   }`;

// ── Tipos locais ─────────────────────────────────────────────────────────────

const BENEFIT_CATEGORIES = [
  { id: 1, label: 'Saúde' },
  { id: 2, label: 'Educação' },
  { id: 3, label: 'Alimentação' },
  { id: 4, label: 'Transporte' },
  { id: 5, label: 'Lazer' },
  { id: 6, label: 'Bem-estar' },
] as const;

interface BenefitForm {
  name: string;
  description: string;
  categoryId: number;
  validUntil: string;
  maxUsesPerUser: number;
  terms: string;
}
const EMPTY_FORM: BenefitForm = {
  name: '',
  description: '',
  categoryId: 1,
  validUntil: '',
  maxUsesPerUser: 1,
  terms: '',
};
interface FormErrors { name?: string; description?: string; categoryId?: string; }

// ── Componente principal ──────────────────────────────────────────────────────

export const BenefitsCatalog: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'COMPANY';

  // dados
  const [benefits, setBenefits]             = useState<Benefit[]>([]);
  const [recommendations, setRecommendations] = useState<Benefit[]>([]);
  const [favorites, setFavorites]           = useState<string[]>([]);
  const [companyId, setCompanyId]           = useState<number | null>(null);

  // UI
  const [loading, setLoading]               = useState(true);
  const [searchTerm, setSearchTerm]         = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BenefitCategory | 'Todos'>('Todos');
  const [sortBy, setSortBy]                 = useState<'rating' | 'popular'>('popular');

  // modal criação
  const [showCreate, setShowCreate]         = useState(false);
  const [form, setForm]                     = useState<BenefitForm>(EMPTY_FORM);
  const [formErrors, setFormErrors]         = useState<FormErrors>({});
  const [formLoading, setFormLoading]       = useState(false);
  const [formApiError, setFormApiError]     = useState('');

  // modal exclusão
  const [deleteTarget, setDeleteTarget]     = useState<Benefit | null>(null);
  const [deleteLoading, setDeleteLoading]   = useState(false);

  // modal parceria (employee)
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);

  const [toast, setToast] = useState({
    visible: false, message: '', type: 'success' as 'success' | 'error' | 'info',
  });
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') =>
    setToast({ visible: true, message, type });

  // ── Carga de dados ──────────────────────────────────────────────────────────

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const [catalogBenefits, company, recommended] = await Promise.allSettled([
        catalogBenefitService.getBenefits(),
        isManager ? companyService.getMyCompany() : Promise.resolve(null),
        isManager ? Promise.resolve([] as Benefit[]) : recommendationService.getRecommendations(),
      ]);

      if (catalogBenefits.status === 'fulfilled') {
        setBenefits(catalogBenefits.value);
      } else {
        console.warn('[BenefitsCatalog] Falha ao carregar catálogo:', (catalogBenefits.reason as any)?.response?.data ?? catalogBenefits.reason);
      }

      if (company.status === 'fulfilled' && company.value?.id)
        setCompanyId(company.value.id);

      if (!isManager && recommended.status === 'fulfilled') {
        setRecommendations(recommended.value);
      }
    } catch (err) {
      console.error('[BenefitsCatalog] loadCatalog:', err);
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => {
    const saved = localStorage.getItem('employee_favorites');
    if (saved) {
      try { setFavorites(JSON.parse(saved)); } catch { setFavorites([]); }
    }
    loadCatalog();
  }, [loadCatalog]);

  // ── Ações do gestor ─────────────────────────────────────────────────────────

  const validateForm = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim())        e.name = 'Informe o nome do benefício.';
    if (!form.description.trim()) e.description = 'Informe uma descrição.';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!companyId) { setFormApiError('Empresa não carregada. Recarregue a página.'); return; }
    setFormLoading(true);
    setFormApiError('');
    try {
      const created = await realBenefitService.create({
        name:        form.name.trim(),
        description: form.description.trim(),
        companyId,
        categoryIds: [form.categoryId],
        publiclyVisible: true,
        validUntil: form.validUntil ? `${form.validUntil}T23:59:59` : undefined,
        maxUsesPerUser: form.maxUsesPerUser,
        terms: form.terms.trim() || undefined,
      });
      setBenefits(prev => [created, ...prev]);
      setForm(EMPTY_FORM);
      setFormErrors({});
      setShowCreate(false);
      showToast(`Benefício "${created.name}" cadastrado com sucesso.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? '';
      setFormApiError(msg || 'Falha ao cadastrar benefício. Tente novamente.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleActivate = async (b: Benefit) => {
    try {
      await realBenefitService.activate(b.backendId ?? Number(b.id));
      setBenefits(prev => prev.map(x => x.id === b.id ? { ...x, active: true, status: 'Ativo' } : x));
      showToast(`"${b.name}" ativado com sucesso.`);
    } catch {
      showToast('Falha ao ativar benefício.', 'error');
    }
  };

  const handleDeactivate = async (b: Benefit) => {
    try {
      await realBenefitService.deactivate(b.backendId ?? Number(b.id));
      setBenefits(prev => prev.map(x => x.id === b.id ? { ...x, active: false, status: 'Suspenso' } : x));
      showToast(`"${b.name}" desativado.`, 'info');
    } catch {
      showToast('Falha ao desativar benefício.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await realBenefitService.delete(deleteTarget.backendId ?? Number(deleteTarget.id));
      setBenefits(prev => prev.filter(x => x.id !== deleteTarget.id));
      showToast(`"${deleteTarget.name}" removido com sucesso.`);
      setDeleteTarget(null);
    } catch {
      showToast('Falha ao remover benefício.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Ações do employee ───────────────────────────────────────────────────────

  const toggleFavorite = (id: string) => {
    const updated = favorites.includes(id)
      ? favorites.filter(f => f !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem('employee_favorites', JSON.stringify(updated));
    showToast(
      favorites.includes(id) ? 'Removido dos favoritos.' : 'Adicionado aos favoritos.',
      favorites.includes(id) ? 'info' : 'success',
    );
  };

  const handleRequestBenefit = async () => {
    if (!selectedBenefit) return;
    try {
      const partnership = await partnershipService.request({
        benefitId: selectedBenefit.backendId ?? Number(selectedBenefit.id),
      });
      showToast(`Solicitação de parceria enviada. ID: ${partnership.id}.`);
      setSelectedBenefit(null);
    } catch {
      showToast('Falha ao registrar solicitação de parceria.', 'error');
    }
  };

  // ── Filtros ─────────────────────────────────────────────────────────────────

  const filtered = benefits.filter(b => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (b.name ?? '').toLowerCase().includes(q) ||
      (b.description ?? '').toLowerCase().includes(q) ||
      (b.supplierName ?? '').toLowerCase().includes(q);
    const matchCat = selectedCategory === 'Todos' || b.category === selectedCategory;
    return matchSearch && matchCat;
  }).sort((a, b) =>
    sortBy === 'rating' ? b.rating - a.rating : b.ratingCount - a.ratingCount,
  );

  const categoriesList: (BenefitCategory | 'Todos')[] = [
    'Todos', 'Saúde', 'Educação', 'Alimentação', 'Transporte', 'Lazer', 'Bem-estar',
  ];

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Carregando catálogo...
          </span>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-8 text-left fade-in">
      <Toast visible={toast.visible} message={toast.message} type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })} />

      {/* ── Recomendações AI (employee only) ──────────────────────────────── */}
      {user?.role === 'EMPLOYEE' && recommendations.length > 0 && (
        <div className="p-5 border border-emerald-500/15 bg-emerald-500/5 dark:bg-emerald-950/10 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Recomendações Inteligentes
              </h4>
              <span className="text-[10px] text-slate-400">
                Baseadas no seu perfil de engajamento.
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {recommendations.slice(0, 2).map(rec => (
              <div key={rec.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h5 className="font-bold text-xs text-slate-800 dark:text-gray-100">{rec.name}</h5>
                  <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">
                    98% Compatível
                  </span>
                </div>
                <button onClick={() => setSelectedBenefit(rec)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg shrink-0 cursor-pointer">
                  Solicitar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Cabeçalho de gestão (manager) ─────────────────────────────────── */}
      {isManager && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-black text-xl text-slate-800 dark:text-slate-100">
              Meus Benefícios
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Gerencie os benefícios oferecidos pela sua empresa aos colaboradores.
            </p>
          </div>
          <button
            onClick={() => { setForm(EMPTY_FORM); setFormErrors({}); setFormApiError(''); setShowCreate(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Novo Benefício
          </button>
        </div>
      )}

      {/* ── Filtros ───────────────────────────────────────────────────────── */}
      <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar benefícios..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs py-2.5 pl-10 pr-4 rounded-xl outline-none border border-slate-200 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Ordenar:</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 outline-none cursor-pointer">
              <option value="popular">Mais Requisitados</option>
              <option value="rating">Maior Avaliação</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {categoriesList.map((cat, i) => (
            <button key={i} onClick={() => setSelectedCategory(cat)}
              className={`p-1.5 px-3.5 rounded-lg text-[11px] font-bold tracking-wide uppercase transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid de benefícios ────────────────────────────────────────────── */}
      <div>
        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">
          {filtered.length} benefício(s) encontrado(s)
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center min-h-[200px]">
            <Package className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-3" />
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              {benefits.length === 0
                ? (isManager ? 'Nenhum benefício cadastrado. Clique em "Novo Benefício" para começar.' : 'Nenhum benefício disponível no momento.')
                : 'Nenhum resultado para esse filtro.'}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(b => (
              <div key={b.id}
                className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm group hover:border-emerald-500 dark:hover:border-emerald-500/40 hover:shadow-lg transition-all">

                {/* Imagem */}
                <div className="relative">
                  <img src={b.imageUrl} alt={b.name} className="w-full h-40 object-cover" />
                  <span className="absolute top-3.5 right-3.5 text-[8.5px] font-extrabold uppercase bg-slate-900/80 text-white py-1 px-2.5 rounded-md backdrop-blur-sm">
                    {b.category}
                  </span>
                  <span className={`absolute top-3.5 left-3.5 text-[8.5px] font-extrabold uppercase py-1 px-2.5 rounded-md backdrop-blur-sm ${
                    b.active !== false ? 'bg-emerald-500/90 text-white' : 'bg-slate-700/90 text-slate-100'
                  }`}>
                    {b.active !== false ? 'Ativo' : 'Inativo'}
                  </span>
                  {user?.role === 'EMPLOYEE' && b.active !== false && (
                    <button onClick={() => toggleFavorite(b.id)}
                      className="absolute bottom-3 right-3 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white text-rose-500 shadow-md cursor-pointer"
                      aria-label="Favoritar">
                      <Heart className={`w-4 h-4 ${favorites.includes(b.id) ? 'fill-rose-500' : ''}`} />
                    </button>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3.5">
                  <div className="space-y-1">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                      {b.supplierName}
                    </span>
                    <h4 className="font-bold text-md text-slate-800 dark:text-slate-100 leading-snug group-hover:text-emerald-500 transition-colors">
                      {b.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mt-1">
                      {b.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Avaliação:</span>
                      <span className="font-bold text-amber-500 flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> {b.rating} ({b.ratingCount})
                      </span>
                    </div>
                  </div>

                  {/* Botões de ação */}
                  {isManager ? (
                    <div className="flex items-center gap-2 pt-1">
                      {b.active !== false ? (
                        <button onClick={() => handleDeactivate(b)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-bold bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white border border-amber-200 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-400 rounded-lg transition-all cursor-pointer">
                          <ToggleLeft className="w-3.5 h-3.5" /> Desativar
                        </button>
                      ) : (
                        <button onClick={() => handleActivate(b)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-200 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-400 rounded-lg transition-all cursor-pointer">
                          <ToggleRight className="w-3.5 h-3.5" /> Ativar
                        </button>
                      )}
                      <button onClick={() => setDeleteTarget(b)}
                        title="Excluir benefício"
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : user?.role === 'EMPLOYEE' ? (
                    <button onClick={() => setSelectedBenefit(b)}
                      disabled={b.active === false}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-transform group-hover:scale-[1.01]">
                      {b.active === false ? 'Indisponível' : 'Solicitar Parceria'}
                    </button>
                  ) : (
                    <div className="text-[10px] text-center font-bold text-slate-400 uppercase py-2 bg-slate-100/50 dark:bg-slate-950/40 rounded-xl">
                      Visualização ({user?.role})
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal: Novo Benefício ─────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            <button onClick={() => setShowCreate(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md">
                Cadastrar Benefício
              </span>
              <h4 className="font-black text-lg text-slate-800 dark:text-slate-100 mt-2">
                Novo benefício para a empresa
              </h4>
              <p className="text-xs text-slate-400">
                Os colaboradores poderão solicitar parceria com este benefício.
              </p>
            </div>

            {formApiError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{formApiError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <Field label="Nome do benefício" error={formErrors.name}>
                <input type="text" placeholder="Ex: Gym Pass, Vale Alimentação..."
                  value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormErrors(p => ({ ...p, name: undefined })); }}
                  className={inputCls(formErrors.name)} disabled={formLoading} autoFocus />
              </Field>

              <Field label="Descrição" error={formErrors.description}>
                <textarea rows={3} placeholder="Descreva o benefício..."
                  value={form.description}
                  onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setFormErrors(p => ({ ...p, description: undefined })); }}
                  className={`${inputCls(formErrors.description)} resize-none`} disabled={formLoading} />
              </Field>

              <Field label="Categoria" error={formErrors.categoryId}>
                <select
                  value={form.categoryId}
                  onChange={e => { setForm(f => ({ ...f, categoryId: Number(e.target.value) })); setFormErrors(p => ({ ...p, categoryId: undefined })); }}
                  className={inputCls(formErrors.categoryId)}
                  disabled={formLoading}
                >
                  {BENEFIT_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Válido até">
                  <input type="date" value={form.validUntil}
                    onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                    className={inputCls()} disabled={formLoading} />
                </Field>
                <Field label="Utilizações por usuário">
                  <input type="number" min={1} max={100} value={form.maxUsesPerUser}
                    onChange={e => setForm(f => ({ ...f, maxUsesPerUser: Math.max(1, Number(e.target.value)) }))}
                    className={inputCls()} disabled={formLoading} />
                </Field>
              </div>

              <Field label="Regras de utilização">
                <textarea rows={2} placeholder="Ex: válido apenas de segunda a sexta."
                  value={form.terms}
                  onChange={e => setForm(f => ({ ...f, terms: e.target.value }))}
                  className={`${inputCls()} resize-none`} disabled={formLoading} />
              </Field>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={formLoading}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5">
                  {formLoading
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Criando...</>
                    : <><Plus className="w-3.5 h-3.5" /> Criar Benefício</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmar Exclusão ─────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h4 className="font-black text-base text-slate-800 dark:text-slate-100">
                  Excluir benefício?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {deleteTarget.name}
                  </span>{' '}
                  será removido permanentemente. Colaboradores não poderão mais solicitá-lo.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)} disabled={deleteLoading}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={handleDeleteConfirm} disabled={deleteLoading}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5">
                {deleteLoading
                  ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Removendo...</>
                  : <><Trash2 className="w-3.5 h-3.5" /> Confirmar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Solicitar Parceria (employee) ──────────────────────────── */}
      {selectedBenefit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md">
                Confirmar Solicitação
              </span>
              <h4 className="font-black text-md text-slate-800 dark:text-slate-100 pt-1">
                Solicitar parceria com este benefício?
              </h4>
              <p className="text-xs text-slate-400 uppercase tracking-wide">
                {selectedBenefit.name}
              </p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              O pedido será encaminhado ao administrador para aprovação.
            </p>
            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button onClick={() => setSelectedBenefit(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer">
                Cancelar
              </button>
              <button onClick={handleRequestBenefit}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md cursor-pointer">
                Enviar Solicitação
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
