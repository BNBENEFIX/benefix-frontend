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
    console.group('[Onboarding] Iniciando cadastro');
    console.log('[Onboarding] Payload enviado:', JSON.stringify(payload, null, 2));
    try {
      const response = await bnfixApi.post<OnboardingResponse>('/onboarding', payload);
      console.log('[Onboarding] Status HTTP:', response.status);
      console.log('[Onboarding] Resposta do backend:', JSON.stringify(response.data, null, 2));
      console.groupEnd();
      return response.data;
    } catch (err: any) {
      console.error('[Onboarding] FALHOU');
      console.error('[Onboarding] Status HTTP:', err?.response?.status);
      console.error('[Onboarding] Body do erro:', JSON.stringify(err?.response?.data, null, 2));
      console.groupEnd();
      throw err;
    }
  },
};
