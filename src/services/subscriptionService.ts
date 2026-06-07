/**
 * Serviço de Assinaturas — endpoints /subscriptions/* da API BNFix.
 *
 * Endpoints mapeados:
 *   POST /subscriptions   → funcionário assina um benefício (USER)
 */
import bnfixApi from './bnfixApi';
import type { BackendSubscription, CreateSubscriptionPayload } from '../types';

export const subscriptionService = {
  /** Cria uma assinatura de benefício para o usuário autenticado */
  subscribe: async (payload: CreateSubscriptionPayload): Promise<BackendSubscription> => {
    const { data } = await bnfixApi.post<BackendSubscription>('/subscriptions', payload);
    return data;
  },
};
