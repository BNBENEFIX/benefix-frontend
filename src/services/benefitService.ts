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
  benefitName: string;
  nameProvider?: string;
  status: boolean;
  createdAt?: string;
}

// ── Mapeamento backend → frontend ────────────────────────────────────────────

const mapBenefit = (b: BackendBenefit): Benefit => ({
  id:           String(b.id),
  backendId:    b.id,
  name:         b.name,
  description:  b.description,
  category:     'Saúde' as BenefitCategory,      // backend não retorna categoria ainda
  supplierId:   String(b.companyId),
  supplierName: b.companyName ?? 'Fornecedor',
  rating:       0,
  ratingCount:  0,
  imageUrl:     'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500',
  details:      b.description,
  status:       b.active === false ? 'Suspenso' : 'Ativo',
  companyId:    b.companyId,
  active:       b.active,
  providerName: b.companyName ?? 'Fornecedor',
});

const mapTenantBenefit = (b: BackendTenantBenefit): Benefit => ({
  id:           String(b.id),
  backendId:    b.id,
  name:         b.benefitName,
  description:  b.nameProvider ?? 'Benefício do tenant',
  category:     'Saúde' as BenefitCategory,
  supplierId:   String(b.id),
  supplierName: b.nameProvider ?? 'Tenant',
  rating:       0,
  ratingCount:  0,
  imageUrl:     'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500',
  details:      b.nameProvider ?? 'Benefício do tenant',
  status:       b.status ? 'Ativo' : 'Suspenso',
  companyId:    undefined,
  active:       b.status,
  providerName: b.nameProvider ?? 'Tenant',
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
    const { data } = await bnfixApi.post<BackendBenefit>('/benefits', payload);
    return mapBenefit(data);
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
  activate: async (id: number): Promise<Benefit> => {
    const { data } = await bnfixApi.put<BackendBenefit>(`/benefits/${id}/activate`);
    return mapBenefit(data);
  },

  /** Desativa um benefício */
  deactivate: async (id: number): Promise<Benefit> => {
    const { data } = await bnfixApi.put<BackendBenefit>(`/benefits/${id}/deactivate`);
    return mapBenefit(data);
  },
};
