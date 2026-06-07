/**
 * Serviço de Empresa — endpoints /companies/* da API BNFix.
 *
 * Endpoints mapeados:
 *   GET  /companies/me   → dados da empresa do manager logado (MANAGER)
 */
import bnfixApi from './bnfixApi';
import type { BackendCompany } from '../types';

export const companyService = {
  /** Retorna os dados da empresa vinculada ao manager autenticado */
  getMyCompany: async (): Promise<BackendCompany> => {
    const { data } = await bnfixApi.get<BackendCompany>('/companies/me');
    return data;
  },
};
