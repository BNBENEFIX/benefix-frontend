/**
 * Fachada de serviços — redireciona todas as chamadas para a API real BNFix
 * ou para o servidor Express local (chatbot/Gemini e funcionalidades sem
 * endpoint equivalente no backend real, como surveys).
 *
 * REGRAS:
 *  - Qualquer endpoint que EXISTE no Swagger de https://api.bnfix.com.br
 *    → usa bnfixApi (cliente real com JWT)
 *  - Funcionalidades extras sem endpoint no backend real
 *    → usa o proxy Express local (/api/*) temporariamente até o backend evoluir
 */
import axios from 'axios';
import bnfixApi, { USER_KEY, hasSession } from './bnfixApi';
import { benefitService as realBenefitService } from './benefitService';
import type {
  Benefit,
  Coupon,
  Voucher,
  CalendarEvent,
  FeedbackRating,
  SurveyCampaign,
  SurveyResponse,
  User,
} from '../types';

const getStoredUserRole = (): User['role'] | null => {
  try {
    const rawUser = localStorage.getItem(USER_KEY);
    if (!rawUser) return null;
    const parsed = JSON.parse(rawUser) as Partial<User>;
    return parsed.role ?? null;
  } catch {
    return null;
  }
};

// ── Cliente para o servidor Express local (funcionalidades extras) ────────────

const localApi = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── BENEFITS ─────────────────────────────────────────────────────────────────
// Usa a API real; fallback para o servidor local se não autenticado.

export const benefitService = {
  getBenefits: async (): Promise<Benefit[]> => {
    const role = getStoredUserRole();

    const preferred = role === 'COMPANY'
      ? realBenefitService.getTenantBenefits()
      : realBenefitService.getMarketplace();
    const fallback = role === 'COMPANY'
      ? realBenefitService.getMarketplace()
      : realBenefitService.getTenantBenefits();

    try {
      return await preferred;
    } catch (err) {
      console.warn('[benefitService] Consulta principal do catálogo falhou, tentando fallback.', err);
      try {
        return await fallback;
      } catch (fallbackErr) {
        console.warn('[benefitService] Fallback do catálogo também falhou.', fallbackErr);
        return [];
      }
    }
  },

  createBenefit: async (payload: Partial<Benefit>): Promise<Benefit> => {
    // Usa a API real quando autenticado (cookie httpOnly); fallback local caso contrário.
    if (hasSession() && payload.companyId) {
      return realBenefitService.create({
        name: payload.name ?? '',
        description: payload.description ?? '',
        companyId: Number(payload.companyId),
      });
    }
    const res = await localApi.post<Benefit>('/benefits', payload);
    return res.data;
  },

  updateBenefit: async (id: string, payload: Partial<Benefit>): Promise<Benefit> => {
    if (hasSession()) {
      return realBenefitService.update(Number(id), {
        name:        payload.name,
        description: payload.description,
      });
    }
    const res = await localApi.put<Benefit>(`/benefits/${id}`, payload);
    return res.data;
  },

  deleteBenefit: async (id: string): Promise<void> => {
    if (hasSession()) {
      return realBenefitService.delete(Number(id));
    }
    await localApi.delete(`/benefits/${id}`);
  },
};

// ── VOUCHERS ─────────────────────────────────────────────────────────────────

export const voucherService = {
  getVouchers: async (): Promise<Voucher[]> => {
    const res = await localApi.get<Voucher[]>('/vouchers');
    return res.data;
  },

  redeemVoucher: async (code: string): Promise<any> => {
    const res = await localApi.post('/vouchers/redeem', { code });
    return res.data;
  },
};

// ── COUPONS ───────────────────────────────────────────────────────────────────

export const couponService = {
  getCoupons: async (): Promise<Coupon[]> => {
    const res = await localApi.get<Coupon[]>('/coupons');
    return res.data;
  },

  createCoupon: async (coupon: Partial<Coupon>): Promise<Coupon> => {
    const res = await localApi.post<Coupon>('/coupons', coupon);
    return res.data;
  },
};

// ── CALENDAR EVENTS ───────────────────────────────────────────────────────────

export const rankingService = {
  getEvents: async (): Promise<CalendarEvent[]> => {
    const res = await localApi.get<CalendarEvent[]>('/events');
    return res.data;
  },
};

// ── FEEDBACK / RATING ─────────────────────────────────────────────────────────

export const ratingService = {
  getFeedbacks: async (): Promise<FeedbackRating[]> => {
    const res = await localApi.get<FeedbackRating[]>('/feedbacks');
    return res.data;
  },

  submitFeedback: async (feedback: Partial<FeedbackRating>): Promise<FeedbackRating> => {
    const res = await localApi.post<FeedbackRating>('/feedbacks', feedback);
    return res.data;
  },
};

// ── SURVEYS ───────────────────────────────────────────────────────────────────

export const surveyService = {
  getCampaigns: async (): Promise<SurveyCampaign[]> => {
    const res = await localApi.get<SurveyCampaign[]>('/surveys/campaigns');
    return res.data;
  },

  createCampaign: async (campaign: Partial<SurveyCampaign>): Promise<SurveyCampaign> => {
    const res = await localApi.post<SurveyCampaign>('/surveys/campaigns', campaign);
    return res.data;
  },

  closeCampaign: async (id: string): Promise<SurveyCampaign> => {
    const res = await localApi.put<SurveyCampaign>(`/surveys/campaigns/${id}/close`);
    return res.data;
  },

  getResponses: async (): Promise<SurveyResponse[]> => {
    const res = await localApi.get<SurveyResponse[]>('/surveys/responses');
    return res.data;
  },

  submitResponse: async (response: Partial<SurveyResponse>): Promise<SurveyResponse> => {
    const res = await localApi.post<SurveyResponse>('/surveys/responses', response);
    return res.data;
  },
};

// ── CHATBOT ───────────────────────────────────────────────────────────────────

export const chatbotService = {
  sendMessage: async (message: string): Promise<string> => {
    const res = await localApi.post<{ text: string }>('/chatbot/message', { message });
    return res.data.text;
  },
};

// ── METRICS ───────────────────────────────────────────────────────────────────

export const metricsService = {
  getDashboardMetrics: async (): Promise<any> => {
    const res = await localApi.get('/metrics');
    return res.data;
  },
};

// ── CONTACT ───────────────────────────────────────────────────────────────────

export const contactService = {
  submitContact: async (contactData: any): Promise<any> => {
    const res = await localApi.post('/contact', contactData);
    return res.data;
  },
};

// ── RECOMMENDATIONS ───────────────────────────────────────────────────────────

export const recommendationService = {
  getRecommendations: async (): Promise<Benefit[]> => {
    const res = await localApi.get<Benefit[]>('/recommendations');
    return res.data;
  },
};

// ── USERS (lista de usuários locais para retrocompatibilidade) ────────────────

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const res = await localApi.get<User[]>('/users');
    return res.data;
  },
};

// ── EMPLOYEES (da API real) ───────────────────────────────────────────────────

export { employeeService } from './employeeService';
export { companyService }  from './companyService';
export { announcementService } from './announcementService';
export { partnershipService } from './partnershipService';
export { benefitService as realBenefitService } from './benefitService';

export default bnfixApi;
