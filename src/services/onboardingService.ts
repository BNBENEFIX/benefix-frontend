/**
 * Serviço de onboarding — endpoint POST /onboarding
 *
 * Cria em uma única chamada o tenant (empresa) e o primeiro manager (RH).
 */
import bnfixApi from './bnfixApi';
import type { OnboardingPayload } from '../types';

export interface OnboardingResponse {
  /** ID da empresa criada */
  companyId?: number;
  /** ID do manager criado */
  managerId?: number;
  /** Mensagem livre retornada pelo backend */
  message?: string;
  [key: string]: any;
}

export const onboardingService = {
  /**
   * Cadastra empresa + manager de uma só vez.
   * Retorna a resposta bruta do backend.
   */
  register: async (payload: OnboardingPayload): Promise<OnboardingResponse> => {
    const { data } = await bnfixApi.post<OnboardingResponse>('/onboarding', payload);
    return data;
  },
};
