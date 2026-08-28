/**
 * Serviço de Benefícios — endpoints /benefits/* da API BNFix.
 *
 * Endpoints mapeados:
 *   POST   /benefits                    → criar benefício (MANAGER)
 *   GET    /benefits/marketplace        → catálogo global (MANAGER)
 *   GET    /benefits/tenant             → benefícios do tenant atual (MANAGER)
 *   PUT    /benefits/{id}               → atualizar (MANAGER)
 *   DELETE /benefits/{id}               → deletar (MANAGER)
 *   PUT    /benefits/{id}/activate      → ativar (MANAGER)
 *   PUT    /benefits/{id}/deactivate    → desativar (MANAGER)
 */
import bnfixApi from './bnfixApi';
import type {
  BackendBenefit,
  Benefit,
  BenefitCategory,
  CreateBenefitPayload,
  UpdateBenefitPayload,
} from '../types';

interface BackendTenantBenefit {
  id: number;
  benefitId?: number;
  benefitName: string;
  description?: string;
  nameProvider?: string;
  categoryId?: number;
  categories?: Array<{ id: number; name: string }>;
  status: boolean;
  validUntil?: string;
  maxUsesPerUser?: number;
  terms?: string;
  availableToProviderEmployees?: boolean;
  createdAt?: string;
}

// ── Mapeamento categoryId → nome da categoria ───────────────────────────────

const CATEGORY_MAP: Record<number, BenefitCategory> = {
  0: 'Saúde',
  1: 'Saúde',
  2: 'Educação',
  3: 'Alimentação',
  4: 'Transporte',
  5: 'Lazer',
  6: 'Bem-estar',
};

const resolveCategoryName = (categoryId?: number, categoryName?: string): BenefitCategory => {
  if (categoryName) return categoryName as BenefitCategory;
  if (categoryId == null) return 'Saúde';
  return CATEGORY_MAP[categoryId] ?? 'Saúde';
};

// ── Mapeamento backend → frontend ────────────────────────────────────────────

const mapBenefit = (b: BackendBenefit): Benefit => ({
  id:           String(b.id),
  backendId:    b.id,
  name:         b.name ?? b.benefitName ?? 'Sem nome',
  description:  b.description ?? (b as any).nameProvider ?? '',
  category:     resolveCategoryName(b.categories?.[0]?.id, b.categories?.[0]?.name),
  supplierId:   String(b.companyId ?? ''),
  supplierName: b.companyName ?? b.nameProvider ?? 'Fornecedor',
  rating:       0,
  ratingCount:  0,
  imageUrl:     'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500',
  details:      b.description ?? '',
  status:       (b.active ?? b.status) === false ? 'Suspenso' : 'Ativo',
  companyId:    b.companyId,
  active:       b.active ?? b.status,
  providerName: b.companyName ?? b.nameProvider ?? 'Fornecedor',
  rules:        b.terms,
  availableToProviderEmployees: b.availableToProviderEmployees,
});

const mapTenantBenefit = (b: BackendTenantBenefit): Benefit => ({
  id:           String(b.benefitId ?? b.id),
  backendId:    b.benefitId ?? b.id,
  name:         b.benefitName,
  description:  b.description ?? '',
  category:     resolveCategoryName(
    b.categories?.[0]?.id ?? b.categoryId,
    b.categories?.[0]?.name,
  ),
  supplierId:   String(b.id),
  supplierName: b.nameProvider ?? 'Tenant',
  rating:       0,
  ratingCount:  0,
  imageUrl:     'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500',
  details:      b.description ?? '',
  status:       b.status ? 'Ativo' : 'Suspenso',
  companyId:    undefined,
  active:       b.status,
  providerName: b.nameProvider ?? 'Tenant',
  rules:        b.terms,
  availableToProviderEmployees: b.availableToProviderEmployees,
});

// ── Service ──────────────────────────────────────────────────────────────────

export const benefitService = {
  /** Catálogo global — todos os benefícios disponíveis no marketplace */
  getMarketplace: async (): Promise<Benefit[]> => {
    const { data } = await bnfixApi.get<BackendBenefit[]>('/benefits/marketplace');
    return Array.isArray(data) ? data.map(mapBenefit) : [];
  },

  /** Benefícios do tenant do manager logado */
  getTenantBenefits: async (): Promise<Benefit[]> => {
    const { data } = await bnfixApi.get<BackendTenantBenefit[]>('/benefits/tenant');
    return Array.isArray(data) ? data.map(mapTenantBenefit) : [];
  },

  /** Cria um novo benefício */
  create: async (payload: CreateBenefitPayload): Promise<Benefit> => {
    const { data } = await bnfixApi.post('/benefits', payload);
    // O backend pode retornar BackendBenefit ou BackendTenantBenefit — normaliza
    if (data && data.benefitName) {
      return mapTenantBenefit(data as BackendTenantBenefit);
    }
    return mapBenefit(data as BackendBenefit);
  },

  /** Atualiza nome/descrição de um benefício */
  update: async (id: number, payload: UpdateBenefitPayload): Promise<Benefit> => {
    const { data } = await bnfixApi.put<BackendBenefit>(`/benefits/${id}`, payload);
    return mapBenefit(data);
  },

  /** Remove um benefício */
  delete: async (id: number): Promise<void> => {
    await bnfixApi.delete(`/benefits/${id}`);
  },

  /** Ativa um benefício desativado */
  activate: async (id: number): Promise<void> => {
    await bnfixApi.put(`/benefits/${id}/activate`);
  },

  /** Desativa um benefício */
  deactivate: async (id: number): Promise<void> => {
    await bnfixApi.put(`/benefits/${id}/deactivate`);
  },
};
