/**
 * Serviço de inscrição no evento — endpoint público POST /companies/event/enroll.
 *
 * O participante é criado como funcionário (role USER) da empresa do evento
 * (definida no backend via `app.event.company-id`). Não há auto-login: após o
 * 201 o usuário deve entrar pela tela de login.
 */
import bnfixApi from './bnfixApi';
import type { EnrollmentRequest, EnrollmentResponse } from '../types';

export const enrollmentService = {
  enroll: async (payload: EnrollmentRequest): Promise<EnrollmentResponse> => {
    const { data } = await bnfixApi.post<EnrollmentResponse>('/companies/event/enroll', payload);
    return data;
  },
};
