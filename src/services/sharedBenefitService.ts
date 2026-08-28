import bnfixApi from './bnfixApi';
import type {
  EmployeeBenefitResponse,
  RedemptionPreview,
  RedemptionResult,
  RedemptionToken,
} from '../types';

export const sharedBenefitService = {
  /** Lista os benefícios disponíveis para o funcionário logado (elegibilidade em tempo real). */
  getMyBenefits: async (): Promise<EmployeeBenefitResponse[]> => {
    const { data } = await bnfixApi.get<EmployeeBenefitResponse[]>('/benefits/me');
    return data;
  },

  /** Emite um token de resgate para o benefício. Apenas 1 token ativo por (funcionário, benefício). */
  issueToken: async (benefitId: number): Promise<RedemptionToken> => {
    const { data } = await bnfixApi.post<RedemptionToken>(`/redemptions/benefits/${benefitId}/token`);
    return data;
  },

  previewToken: async (token: string): Promise<RedemptionPreview> => {
    const { data } = await bnfixApi.post<RedemptionPreview>('/redemptions/provider/preview', { token });
    return data;
  },

  consumeToken: async (token: string): Promise<RedemptionResult> => {
    const { data } = await bnfixApi.post<RedemptionResult>('/redemptions/provider/consume', { token });
    return data;
  },
};
