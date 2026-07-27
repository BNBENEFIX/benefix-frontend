import bnfixApi from './bnfixApi';
import type {
  RedemptionPreview,
  RedemptionResult,
  RedemptionToken,
  SharedBenefit,
  SharedBenefitRequest,
} from '../types';

export const sharedBenefitService = {
  available: async (): Promise<SharedBenefit[]> => {
    const { data } = await bnfixApi.get<SharedBenefit[]>('/shared-benefits/available');
    return data;
  },

  mine: async (): Promise<SharedBenefit[]> => {
    const { data } = await bnfixApi.get<SharedBenefit[]>('/shared-benefits/me');
    return data;
  },

  myRequests: async (): Promise<SharedBenefitRequest[]> => {
    const { data } = await bnfixApi.get<SharedBenefitRequest[]>('/benefit-requests/me');
    return data;
  },

  request: async (benefitId: number): Promise<SharedBenefitRequest> => {
    const { data } = await bnfixApi.post<SharedBenefitRequest>('/benefit-requests', { benefitId });
    return data;
  },

  providerRequests: async (): Promise<SharedBenefitRequest[]> => {
    const { data } = await bnfixApi.get<SharedBenefitRequest[]>('/benefit-requests/provider');
    return data;
  },

  approve: async (requestId: number): Promise<SharedBenefitRequest> => {
    const { data } = await bnfixApi.put<SharedBenefitRequest>(`/benefit-requests/${requestId}/approve`);
    return data;
  },

  reject: async (requestId: number, reason?: string): Promise<SharedBenefitRequest> => {
    const { data } = await bnfixApi.put<SharedBenefitRequest>(`/benefit-requests/${requestId}/reject`, { reason });
    return data;
  },

  issueToken: async (subscriptionId: number): Promise<RedemptionToken> => {
    const { data } = await bnfixApi.post<RedemptionToken>(`/redemptions/subscriptions/${subscriptionId}/token`);
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
