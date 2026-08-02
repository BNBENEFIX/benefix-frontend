/**
 * Serviço de Empresa — endpoints /companies/* da API BNFix.
 *
 * Endpoints mapeados:
 *   GET  /companies      → empresas ativas vinculadas ao account autenticado
 *   POST /companies      → cria outra empresa para o account autenticado
 *   GET  /companies/me   → dados da empresa do manager logado (MANAGER)
 *   PUT  /companies/me/deactivate → desativa o tenant atual
 */
import bnfixApi from './bnfixApi';
import type {
  BackendCompany,
  CreateCompanyPayload,
  DeactivateCompanyPayload,
} from '../types';

export const companyService = {
  /** Lista as empresas ativas às quais a conta autenticada tem acesso. */
  listMine: async (): Promise<BackendCompany[]> => {
    const { data } = await bnfixApi.get<BackendCompany[] | { companies?: BackendCompany[] }>('/companies');
    return Array.isArray(data) ? data : (data.companies ?? []);
  },

  /** Cria uma empresa nova reutilizando a identidade do gestor autenticado. */
  create: async (payload: CreateCompanyPayload): Promise<BackendCompany> => {
    const { data } = await bnfixApi.post<BackendCompany>('/companies', payload);
    return data;
  },

  /** Retorna os dados da empresa vinculada ao manager autenticado */
  getMyCompany: async (): Promise<BackendCompany> => {
    const { data } = await bnfixApi.get<BackendCompany>('/companies/me');
    return data;
  },

  /** Desativa a empresa selecionada. A senha confirma a ação destrutiva. */
  deactivateMine: async (payload: DeactivateCompanyPayload): Promise<void> => {
    await bnfixApi.put('/companies/me/deactivate', payload);
  },
};
