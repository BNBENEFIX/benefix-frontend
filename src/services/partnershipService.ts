/**
 * Serviço de Parcerias — endpoints /partnerships/* da API BNFix.
 *
 * Endpoints mapeados:
 *   POST /partnerships                          → solicitar parceria com um benefício (MANAGER)
 *   GET  /partnerships/provider/pending         → parcerias pendentes recebidas (MANAGER)
 *   PUT  /partnerships/accept?id=               → aceitar parceria (MANAGER)
 *   PUT  /partnerships/reject?id=               → rejeitar parceria (MANAGER)
 *   PUT  /partnerships/disable?id=              → desativar parceria (MANAGER)
 */
import bnfixApi from './bnfixApi';
import type { BackendPartnership, CreatePartnershipPayload } from '../types';

export const partnershipService = {
  /** Solicita parceria para um benefício do marketplace */
  request: async (payload: CreatePartnershipPayload): Promise<BackendPartnership> => {
    const { data } = await bnfixApi.post<BackendPartnership>('/partnerships', payload);
    return data;
  },

  /** Lista parcerias pendentes recebidas pela empresa (como provedora do benefício) */
  providerPending: async (): Promise<BackendPartnership[]> => {
    const { data } = await bnfixApi.get<BackendPartnership[]>('/partnerships/provider/pending');
    return data;
  },

  /** Aceita uma parceria pendente */
  accept: async (partnershipId: number): Promise<void> => {
    await bnfixApi.put('/partnerships/accept', null, { params: { partnershipId } });
  },

  /** Rejeita uma parceria */
  reject: async (partnershipId: number): Promise<void> => {
    await bnfixApi.put('/partnerships/reject', null, { params: { partnershipId } });
  },

  /** Desativa uma parceria ativa */
  disable: async (partnershipId: number): Promise<void> => {
    await bnfixApi.put('/partnerships/disable', null, { params: { partnershipId } });
  },
};
