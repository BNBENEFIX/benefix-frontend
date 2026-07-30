'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Store,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { benefitService } from '../services/benefitService';
import { partnershipService } from '../services/partnershipService';
import { companyService } from '../services/companyService';
import type { Benefit, BenefitCategory } from '../types';

type CatalogView = 'mine' | 'discover';
type FeedbackKind = 'success' | 'error' | 'info';

interface Feedback {
  kind: FeedbackKind;
  title: string;
  detail: string;
}

interface BenefitForm {
  name: string;
  description: string;
  categoryId: number;
  validUntil: string;
  maxUsesPerUser: number;
  terms: string;
}

interface FormErrors {
  name?: string;
  description?: string;
}

interface FieldProps {
  id: string;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

const BENEFIT_CATEGORIES = [
  { id: 1, label: 'Saúde' },
  { id: 2, label: 'Educação' },
  { id: 3, label: 'Alimentação' },
  { id: 4, label: 'Transporte' },
  { id: 5, label: 'Lazer' },
  { id: 6, label: 'Bem-estar' },
] as const;

const EMPTY_FORM: BenefitForm = {
  name: '',
  description: '',
  categoryId: 1,
  validUntil: '',
  maxUsesPerUser: 1,
  terms: '',
};

const categoriesList: Array<BenefitCategory | 'Todos'> = [
  'Todos',
  'Saúde',
  'Educação',
  'Alimentação',
  'Transporte',
  'Lazer',
  'Bem-estar',
];

const feedbackClasses: Record<FeedbackKind, string> = {
  success: 'border-[#b9d7c6] bg-[#edf8f1] text-[#235c46]',
  error: 'border-[#efc2bc] bg-[#fff1ef] text-[#8f3730]',
  info: 'border-[#ead4a8] bg-[#fff8e9] text-[#815a19]',
};

const inputClass = (error?: string) => [
  'min-h-12 w-full rounded-xl border bg-white px-3.5 text-sm text-[#18211d]',
  'placeholder:text-[#89938d] focus:outline-none focus:ring-2 disabled:opacity-60',
  error
    ? 'border-[#d98278] focus:border-[#b4473d] focus:ring-[#b4473d]/15'
    : 'border-[#cfd8d2] focus:border-[#2f7658] focus:ring-[#2f7658]/15',
].join(' ');

const Field: React.FC<FieldProps> = ({
  id,
  label,
  optional = false,
  hint,
  error,
  children,
}) => (
  <div>
    <div className="flex items-baseline justify-between gap-3">
      <label htmlFor={id} className="text-sm font-semibold text-[#26342d]">
        {label}
      </label>
      <span className="text-xs text-[#77827b]">{optional ? 'Opcional' : 'Obrigatório'}</span>
    </div>
    {hint && <p className="mt-1 text-xs leading-5 text-[#77827b]">{hint}</p>}
    <div className="mt-2">{children}</div>
    {error && (
      <p className="mt-2 flex items-center gap-2 text-sm text-[#a33f35]">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        {error}
      </p>
    )}
  </div>
);

const apiMessage = (error: unknown, fallback: string) => {
  const candidate = error as { response?: { data?: { message?: string } } };
  return candidate.response?.data?.message ?? fallback;
};

export const BenefitsCatalog: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'COMPANY';

  const [ownBenefits, setOwnBenefits] = useState<Benefit[]>([]);
  const [marketplaceBenefits, setMarketplaceBenefits] = useState<Benefit[]>([]);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<CatalogView>(isManager ? 'mine' : 'discover');

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BenefitCategory | 'Todos'>('Todos');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [partnershipBusyId, setPartnershipBusyId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<BenefitForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formLoading, setFormLoading] = useState(false);
  const [formApiError, setFormApiError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Benefit | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    if (isManager) {
      const [tenantResult, marketplaceResult, companyResult] = await Promise.allSettled([
        benefitService.getTenantBenefits(),
        benefitService.getMarketplace(),
        companyService.getMyCompany(),
      ]);

      if (tenantResult.status === 'fulfilled') {
        setOwnBenefits(tenantResult.value);
      }
      if (marketplaceResult.status === 'fulfilled') {
        setMarketplaceBenefits(marketplaceResult.value);
      }
      if (companyResult.status === 'fulfilled') {
        setCompanyId(companyResult.value.id);
      }

      if (tenantResult.status === 'rejected' || marketplaceResult.status === 'rejected') {
        setFeedback({
          kind: 'error',
          title: 'Parte dos benefícios não foi carregada',
          detail: 'Atualize a tela. Se o problema continuar, tente novamente mais tarde.',
        });
      }
    } else {
      try {
        setMarketplaceBenefits(await benefitService.getMarketplace());
      } catch (error) {
        setFeedback({
          kind: 'error',
          title: 'Não foi possível carregar os benefícios',
          detail: apiMessage(error, 'Atualize a tela e tente novamente.'),
        });
      }
    }

    setLoading(false);
  }, [isManager]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const visibleBenefits = activeView === 'mine' ? ownBenefits : marketplaceBenefits;

  const filteredBenefits = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase('pt-BR');
    return visibleBenefits.filter((benefit) => {
      const matchesText = !query || [
        benefit.name,
        benefit.description,
        benefit.supplierName,
      ].some((value) => (value ?? '').toLocaleLowerCase('pt-BR').includes(query));
      const matchesCategory =
        selectedCategory === 'Todos' || benefit.category === selectedCategory;
      return matchesText && matchesCategory;
    });
  }, [activeView, marketplaceBenefits, ownBenefits, searchTerm, selectedCategory, visibleBenefits]);

  const changeView = (view: CatalogView) => {
    setActiveView(view);
    setSearchTerm('');
    setSelectedCategory('Todos');
    setFeedback(null);
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormApiError('');
    setFormStep(1);
    setShowCreate(true);
  };

  const validateRequiredFields = () => {
    const errors: FormErrors = {};
    if (!form.name.trim()) errors.name = 'Digite um nome para o benefício.';
    if (!form.description.trim()) {
      errors.description = 'Explique em uma frase o que a pessoa receberá.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const goToRules = () => {
    if (validateRequiredFields()) setFormStep(2);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateRequiredFields()) {
      setFormStep(1);
      return;
    }
    if (!companyId) {
      setFormApiError('Os dados da empresa não foram carregados. Feche esta janela e atualize a tela.');
      return;
    }

    setFormLoading(true);
    setFormApiError('');
    try {
      const created = await benefitService.create({
        name: form.name.trim(),
        description: form.description.trim(),
        companyId,
        categoryIds: [form.categoryId],
        publiclyVisible: true,
        validUntil: form.validUntil ? `${form.validUntil}T23:59:59` : undefined,
        maxUsesPerUser: form.maxUsesPerUser,
        terms: form.terms.trim() || undefined,
      });
      setOwnBenefits((current) => [created, ...current]);
      setShowCreate(false);
      setFeedback({
        kind: 'success',
        title: 'Benefício cadastrado',
        detail: `${created.name} já aparece em “Benefícios da empresa”.`,
      });
    } catch (error) {
      setFormApiError(apiMessage(error, 'Não foi possível cadastrar. Confira os dados e tente novamente.'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (benefit: Benefit, activate: boolean) => {
    setFeedback(null);
    try {
      const id = benefit.backendId ?? Number(benefit.id);
      if (activate) await benefitService.activate(id);
      else await benefitService.deactivate(id);

      setOwnBenefits((current) => current.map((item) => (
        item.id === benefit.id
          ? { ...item, active: activate, status: activate ? 'Ativo' : 'Suspenso' }
          : item
      )));
      setFeedback({
        kind: 'success',
        title: activate ? 'Benefício ativado' : 'Benefício pausado',
        detail: activate
          ? `${benefit.name} está disponível novamente.`
          : `${benefit.name} não aparece como disponível enquanto estiver pausado.`,
      });
    } catch (error) {
      setFeedback({
        kind: 'error',
        title: 'Não foi possível alterar o benefício',
        detail: apiMessage(error, 'Tente novamente em instantes.'),
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await benefitService.delete(deleteTarget.backendId ?? Number(deleteTarget.id));
      setOwnBenefits((current) => current.filter((item) => item.id !== deleteTarget.id));
      setFeedback({
        kind: 'success',
        title: 'Benefício excluído',
        detail: `${deleteTarget.name} foi removido da empresa.`,
      });
      setDeleteTarget(null);
    } catch (error) {
      setFeedback({
        kind: 'error',
        title: 'Não foi possível excluir',
        detail: apiMessage(error, 'Tente novamente em instantes.'),
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePartnershipRequest = async (benefit: Benefit) => {
    setPartnershipBusyId(benefit.id);
    setFeedback(null);
    try {
      await partnershipService.request({
        benefitId: benefit.backendId ?? Number(benefit.id),
      });
      setRequestedIds((current) => new Set(current).add(benefit.id));
      setFeedback({
        kind: 'success',
        title: 'Pedido de parceria enviado',
        detail: `${benefit.supplierName} recebeu o pedido para oferecer ${benefit.name} à sua empresa.`,
      });
    } catch (error) {
      setFeedback({
        kind: 'error',
        title: 'Não foi possível pedir a parceria',
        detail: apiMessage(error, 'Tente novamente em instantes.'),
      });
    } finally {
      setPartnershipBusyId(null);
    }
  };

  if (loading) {
    return (
      <div
        role="status"
        className="flex min-h-[520px] flex-col items-center justify-center bg-[#f5f6f2] px-6 text-center"
      >
        <Loader2 className="h-9 w-9 animate-spin text-[#2f7658]" />
        <h1 className="mt-5 text-xl font-semibold text-[#18211d]">Carregando benefícios</h1>
        <p className="mt-2 text-sm text-[#68746d]">Organizando as opções da sua empresa.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f2] px-4 py-6 text-[#18211d] sm:px-6 sm:py-9">
      <div className="mx-auto max-w-[1180px]">
        <header className="flex flex-col gap-5 border-b border-[#d8dfda] pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#2f7658]">
              Gestão de benefícios
            </p>
            <h1 className="mt-3 font-display text-3xl tracking-[-.03em] sm:text-4xl">
              {isManager ? 'Benefícios da empresa' : 'Benefícios disponíveis'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68746d]">
              {isManager
                ? 'Cadastre o que sua empresa oferece ou encontre opções de empresas parceiras.'
                : 'Veja os benefícios disponíveis na plataforma.'}
            </p>
          </div>
          {isManager && activeView === 'mine' && (
            <button
              type="button"
              onClick={openCreate}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#173f32] px-5 text-sm font-semibold text-white hover:bg-[#102e25] sm:w-auto"
            >
              <Plus className="h-5 w-5" />
              Cadastrar benefício
            </button>
          )}
        </header>

        {/* UX: separar gestão e descoberta evita que o gestor altere por engano
            um benefício pertencente a outra empresa. */}
        {isManager && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => changeView('mine')}
              className={`flex min-h-20 items-center justify-between rounded-xl border p-4 text-left ${
                activeView === 'mine'
                  ? 'border-[#2f7658] bg-[#edf5f0] text-[#173f32]'
                  : 'border-[#d5ddd8] bg-white text-[#536159] hover:border-[#aebdb4]'
              }`}
            >
              <span className="flex items-center gap-3">
                <Store className="h-5 w-5" />
                <span>
                  <strong className="block text-sm">Benefícios da empresa</strong>
                  <span className="mt-1 block text-xs opacity-75">Cadastrar e organizar</span>
                </span>
              </span>
              <span className="text-sm font-semibold">{ownBenefits.length}</span>
            </button>
            <button
              type="button"
              onClick={() => changeView('discover')}
              className={`flex min-h-20 items-center justify-between rounded-xl border p-4 text-left ${
                activeView === 'discover'
                  ? 'border-[#2f7658] bg-[#edf5f0] text-[#173f32]'
                  : 'border-[#d5ddd8] bg-white text-[#536159] hover:border-[#aebdb4]'
              }`}
            >
              <span className="flex items-center gap-3">
                <Building2 className="h-5 w-5" />
                <span>
                  <strong className="block text-sm">Descobrir benefícios</strong>
                  <span className="mt-1 block text-xs opacity-75">Encontrar parceiros</span>
                </span>
              </span>
              <span className="text-sm font-semibold">{marketplaceBenefits.length}</span>
            </button>
          </div>
        )}

        {feedback && (
          <div
            role={feedback.kind === 'error' ? 'alert' : 'status'}
            className={`mt-6 flex items-start gap-3 rounded-xl border p-4 ${feedbackClasses[feedback.kind]}`}
          >
            {feedback.kind === 'error'
              ? <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />}
            <div>
              <div className="text-sm font-semibold">{feedback.title}</div>
              <div className="mt-1 text-sm leading-5 opacity-85">{feedback.detail}</div>
            </div>
          </div>
        )}

        <section className="mt-7">
          <div className="rounded-2xl border border-[#d5ddd8] bg-white p-4 sm:p-5">
            <label htmlFor="benefit-search" className="sr-only">Buscar benefício</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7d8881]" />
              <input
                id="benefit-search"
                type="search"
                placeholder={
                  activeView === 'mine'
                    ? 'Buscar nos benefícios da empresa'
                    : 'Buscar por benefício ou empresa'
                }
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-12 w-full rounded-xl border border-[#cfd8d2] bg-[#f7f8f5] pl-11 pr-4 text-sm outline-none focus:border-[#2f7658] focus:ring-2 focus:ring-[#2f7658]/15"
              />
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {categoriesList.map((category) => (
                <button
                  type="button"
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`h-9 shrink-0 rounded-full px-4 text-xs font-semibold ${
                    selectedCategory === category
                      ? 'bg-[#173f32] text-white'
                      : 'border border-[#d5ddd8] bg-white text-[#68746d] hover:border-[#9eafa4]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 mt-7 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                {activeView === 'mine' ? 'Cadastrados pela empresa' : 'Oferecidos por parceiros'}
              </h2>
              <p className="mt-1 text-sm text-[#68746d]">
                {filteredBenefits.length}{' '}
                {filteredBenefits.length === 1 ? 'resultado' : 'resultados'}
              </p>
            </div>
            <button
              type="button"
              onClick={loadCatalog}
              className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-[#d5ddd8] bg-white px-3 text-xs font-semibold text-[#536159] hover:bg-[#f3f6f3]"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>

          {filteredBenefits.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#c8d1cb] bg-white/60 p-9">
              <Package className="h-8 w-8 text-[#91a098]" />
              <h3 className="mt-4 text-lg font-semibold">
                {visibleBenefits.length === 0
                  ? activeView === 'mine'
                    ? 'Nenhum benefício cadastrado'
                    : 'Nenhum benefício de parceiro disponível'
                  : 'Nenhum resultado encontrado'}
              </h3>
              <p className="mt-2 max-w-lg text-sm leading-6 text-[#68746d]">
                {visibleBenefits.length === 0 && activeView === 'mine'
                  ? 'Cadastre o primeiro benefício oferecido pela sua empresa.'
                  : visibleBenefits.length === 0
                    ? 'Novas opções aparecerão aqui quando estiverem disponíveis.'
                    : 'Tente outro termo ou selecione “Todos”.'}
              </p>
              {isManager && activeView === 'mine' && visibleBenefits.length === 0 && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-5 flex h-11 items-center gap-2 rounded-xl bg-[#173f32] px-5 text-sm font-semibold text-white"
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar primeiro benefício
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredBenefits.map((benefit) => {
                const requested = requestedIds.has(benefit.id);
                const isOwnCard = activeView === 'mine';
                return (
                  <article
                    key={benefit.id}
                    className="flex flex-col rounded-2xl border border-[#d5ddd8] bg-white p-5 shadow-[0_8px_30px_rgba(23,63,50,.045)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7efe9] text-[#2f7658]">
                        <Tag className="h-5 w-5" />
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isOwnCard
                          ? benefit.active === false
                            ? 'bg-[#f0f1ef] text-[#68746d]'
                            : 'bg-[#edf8f1] text-[#2f7658]'
                          : 'bg-[#eef2ed] text-[#536159]'
                      }`}>
                        {isOwnCard
                          ? benefit.active === false ? 'Pausado' : 'Disponível'
                          : benefit.category}
                      </span>
                    </div>

                    {!isOwnCard && (
                      <p className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.08em] text-[#2f7658]">
                        <Building2 className="h-4 w-4" />
                        {benefit.supplierName}
                      </p>
                    )}
                    <h3 className={`${isOwnCard ? 'mt-5' : 'mt-2'} text-lg font-semibold tracking-[-.015em]`}>
                      {benefit.name}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#68746d]">
                      {benefit.description || 'Sem descrição informada.'}
                    </p>

                    {isManager && isOwnCard ? (
                      <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 border-t border-[#edf0ed] pt-5">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(benefit, benefit.active === false)}
                          className="h-11 rounded-lg border border-[#cbd6cf] px-4 text-sm font-semibold text-[#345445] hover:bg-[#f1f5f2]"
                        >
                          {benefit.active === false ? 'Ativar' : 'Pausar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(benefit)}
                          aria-label={`Excluir ${benefit.name}`}
                          className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#e1c7c3] text-[#a33f35] hover:bg-[#fff1ef]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : isManager ? (
                      <button
                        type="button"
                        onClick={() => handlePartnershipRequest(benefit)}
                        disabled={requested || partnershipBusyId === benefit.id}
                        className="mt-auto flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#173f32] px-4 text-sm font-semibold text-white hover:bg-[#102e25] disabled:bg-[#8d9b93]"
                      >
                        {partnershipBusyId === benefit.id && <Loader2 className="h-4 w-4 animate-spin" />}
                        {requested ? 'Pedido enviado' : 'Solicitar parceria'}
                      </button>
                    ) : (
                      <div className="mt-auto border-t border-[#edf0ed] pt-4 text-sm font-medium text-[#536159]">
                        {benefit.supplierName}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#0d1a14]/75 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-benefit-title"
            className="max-h-[96vh] w-full overflow-y-auto rounded-t-3xl bg-[#f8f9f6] shadow-2xl sm:max-w-xl sm:rounded-3xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#dbe2dd] bg-[#f8f9f6] p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#2f7658]">
                  Etapa {formStep} de 2
                </p>
                <h2 id="create-benefit-title" className="mt-2 text-2xl font-semibold text-[#18211d]">
                  {formStep === 1 ? 'O que sua empresa oferece?' : 'Como esse benefício pode ser usado?'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                aria-label="Fechar cadastro"
                className="rounded-lg p-2 text-[#68746d] hover:bg-[#edf0ed]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="h-1 bg-[#e1e7e2]">
              <div className={`h-full bg-[#2f7658] transition-[width] ${formStep === 1 ? 'w-1/2' : 'w-full'}`} />
            </div>

            {formApiError && (
              <div role="alert" className="mx-5 mt-5 flex gap-3 rounded-xl border border-[#efc2bc] bg-[#fff1ef] p-4 text-[#8f3730] sm:mx-6">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <div className="text-sm font-semibold">Não foi possível cadastrar</div>
                  <div className="mt-1 text-sm leading-5">{formApiError}</div>
                </div>
              </div>
            )}

            {/* UX: dados essenciais vêm antes das regras opcionais para reduzir
                a quantidade de decisões que o gestor precisa tomar de uma vez. */}
            <form onSubmit={handleCreate}>
              <div className="space-y-6 p-5 sm:p-6">
                {formStep === 1 ? (
                  <>
                    <Field
                      id="benefit-name"
                      label="Nome do benefício"
                      hint="Use um nome que a pessoa reconheça rapidamente."
                      error={formErrors.name}
                    >
                      <input
                        id="benefit-name"
                        type="text"
                        placeholder="Ex.: Desconto em consultas"
                        value={form.name}
                        onChange={(event) => {
                          setForm((current) => ({ ...current, name: event.target.value }));
                          setFormErrors((current) => ({ ...current, name: undefined }));
                        }}
                        className={inputClass(formErrors.name)}
                        autoFocus
                        disabled={formLoading}
                      />
                    </Field>
                    <Field
                      id="benefit-description"
                      label="O que a pessoa recebe?"
                      hint="Escreva uma frase direta, sem regras ou detalhes nesta etapa."
                      error={formErrors.description}
                    >
                      <textarea
                        id="benefit-description"
                        rows={4}
                        placeholder="Ex.: 20% de desconto em uma consulta por mês."
                        value={form.description}
                        onChange={(event) => {
                          setForm((current) => ({ ...current, description: event.target.value }));
                          setFormErrors((current) => ({ ...current, description: undefined }));
                        }}
                        className={`${inputClass(formErrors.description)} resize-none py-3`}
                        disabled={formLoading}
                      />
                    </Field>
                    <Field id="benefit-category" label="Categoria">
                      <select
                        id="benefit-category"
                        value={form.categoryId}
                        onChange={(event) => setForm((current) => ({
                          ...current,
                          categoryId: Number(event.target.value),
                        }))}
                        className={inputClass()}
                        disabled={formLoading}
                      >
                        {BENEFIT_CATEGORIES.map((category) => (
                          <option key={category.id} value={category.id}>{category.label}</option>
                        ))}
                      </select>
                    </Field>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl border border-[#d5ddd8] bg-white p-4">
                      <p className="text-xs font-medium text-[#68746d]">Benefício</p>
                      <p className="mt-1 font-semibold text-[#18211d]">{form.name}</p>
                    </div>
                    <Field
                      id="benefit-limit"
                      label="Quantas vezes cada pessoa pode usar?"
                      hint="Informe 1 quando o benefício for de uso único."
                    >
                      <input
                        id="benefit-limit"
                        type="number"
                        min={1}
                        max={100}
                        value={form.maxUsesPerUser}
                        onChange={(event) => setForm((current) => ({
                          ...current,
                          maxUsesPerUser: Math.max(1, Number(event.target.value)),
                        }))}
                        className={inputClass()}
                        disabled={formLoading}
                      />
                    </Field>
                    <Field
                      id="benefit-validity"
                      label="Disponível até"
                      optional
                      hint="Deixe em branco quando não houver data final."
                    >
                      <input
                        id="benefit-validity"
                        type="date"
                        value={form.validUntil}
                        onChange={(event) => setForm((current) => ({
                          ...current,
                          validUntil: event.target.value,
                        }))}
                        className={inputClass()}
                        disabled={formLoading}
                      />
                    </Field>
                    <Field
                      id="benefit-rules"
                      label="Outras regras"
                      optional
                      hint="Inclua somente o que a pessoa precisa saber antes de usar."
                    >
                      <textarea
                        id="benefit-rules"
                        rows={3}
                        placeholder="Ex.: válido de segunda a sexta, com agendamento."
                        value={form.terms}
                        onChange={(event) => setForm((current) => ({
                          ...current,
                          terms: event.target.value,
                        }))}
                        className={`${inputClass()} resize-none py-3`}
                        disabled={formLoading}
                      />
                    </Field>
                  </>
                )}
              </div>

              <div className="sticky bottom-0 grid gap-3 border-t border-[#dbe2dd] bg-white p-5 sm:grid-cols-[auto_1fr] sm:p-6">
                {formStep === 2 ? (
                  <button
                    type="button"
                    onClick={() => setFormStep(1)}
                    disabled={formLoading}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#cfd8d2] px-5 text-sm font-semibold text-[#536159]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="h-12 rounded-xl border border-[#cfd8d2] px-5 text-sm font-semibold text-[#536159]"
                  >
                    Cancelar
                  </button>
                )}

                {formStep === 1 ? (
                  <button
                    type="button"
                    onClick={goToRules}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#173f32] px-5 text-sm font-semibold text-white"
                  >
                    Continuar
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#173f32] px-5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {formLoading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <CheckCircle2 className="h-4 w-4" />}
                    {formLoading ? 'Cadastrando...' : 'Cadastrar benefício'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0d1a14]/75 p-4 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-benefit-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff1ef] text-[#b4473d]">
              <Trash2 className="h-5 w-5" />
            </span>
            <h2 id="delete-benefit-title" className="mt-5 text-xl font-semibold">
              Excluir {deleteTarget.name}?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#68746d]">
              O benefício será removido e não poderá mais ser solicitado. Esta ação não pode
              ser desfeita.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="h-12 rounded-xl border border-[#cfd8d2] text-sm font-semibold text-[#536159]"
              >
                Manter benefício
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#b4473d] text-sm font-semibold text-white disabled:opacity-60"
              >
                {deleteLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
