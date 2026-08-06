/**
 * Comunicados internos — endpoints /announcements da API BNFix.
 *
 * O backend deriva empresa, gestor e colaborador do JWT. Por isso, nenhuma
 * identidade de tenant ou autor é enviada pelo navegador.
 */
import bnfixApi from './bnfixApi';
import type {
  AnnouncementPage,
  CreateAnnouncementPayload,
  EmployeeAnnouncement,
  ManagerAnnouncement,
  UnreadAnnouncementCount,
} from '../types';

const normalizePagination = (page: number, size: number) => ({
  page: Math.max(0, Math.trunc(page)),
  size: Math.min(50, Math.max(1, Math.trunc(size))),
});

export const announcementService = {
  /** Publica um comunicado para os colaboradores ativos do tenant atual. */
  create: async (payload: CreateAnnouncementPayload): Promise<ManagerAnnouncement> => {
    const { data } = await bnfixApi.post<ManagerAnnouncement>('/announcements', payload);
    return data;
  },

  /** Lista o histórico de comunicados da empresa do gestor autenticado. */
  listCompany: async (
    page = 0,
    size = 20,
  ): Promise<AnnouncementPage<ManagerAnnouncement>> => {
    const params = normalizePagination(page, size);
    const { data } = await bnfixApi.get<AnnouncementPage<ManagerAnnouncement>>(
      '/announcements/company',
      { params },
    );
    return data;
  },

  /** Lista somente os comunicados destinados ao colaborador autenticado. */
  listMine: async (
    page = 0,
    size = 20,
  ): Promise<AnnouncementPage<EmployeeAnnouncement>> => {
    const params = normalizePagination(page, size);
    const { data } = await bnfixApi.get<AnnouncementPage<EmployeeAnnouncement>>(
      '/announcements/me',
      { params },
    );
    return data;
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await bnfixApi.get<UnreadAnnouncementCount>(
      '/announcements/me/unread-count',
    );
    return data.unreadCount;
  },

  /** Idempotente: chamadas repetidas mantêm a primeira leitura registrada. */
  markAsRead: async (announcementId: number): Promise<EmployeeAnnouncement> => {
    const { data } = await bnfixApi.put<EmployeeAnnouncement>(
      `/announcements/${announcementId}/read`,
    );
    return data;
  },

  markAllAsRead: async (): Promise<number> => {
    const { data } = await bnfixApi.put<UnreadAnnouncementCount>(
      '/announcements/me/read-all',
    );
    return data.unreadCount;
  },
};
