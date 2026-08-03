import bnfixApi from './bnfixApi';
import type {
  BackendManager,
  ChangeManagerPasswordPayload,
  UpdateManagerEmailPayload,
} from '../types';

export const managerService = {
  getMe: async (): Promise<BackendManager> => {
    const { data } = await bnfixApi.get<BackendManager>('/managers/me');
    return data;
  },

  updateEmail: async (payload: UpdateManagerEmailPayload): Promise<BackendManager> => {
    const { data } = await bnfixApi.put<BackendManager>('/managers/me/email', payload);
    return data;
  },

  changePassword: async (payload: ChangeManagerPasswordPayload): Promise<void> => {
    await bnfixApi.put('/managers/me/password', payload);
  },
};
