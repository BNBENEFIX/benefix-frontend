/**
 * Serviço de Funcionários — endpoints /employees/* da API BNFix.
 *
 * Endpoints mapeados:
 *   GET  /employees                  → listar funcionários do tenant (MANAGER)
 *   POST /employees                  → criar funcionário (MANAGER)
 *   PUT  /employees/{id}             → atualizar (MANAGER)
 *   PUT  /employees/activate?id=     → ativar (MANAGER)
 *   PUT  /employees/disable?id=      → desativar (MANAGER)
 */
import bnfixApi from './bnfixApi';
import type {
  BackendEmployee,
  CreateEmployeePayload,
  UpdateEmployeePayload,
} from '../types';

export const employeeService = {
  /** Lista todos os funcionários do tenant */
  list: async (): Promise<BackendEmployee[]> => {
    const { data } = await bnfixApi.get<BackendEmployee[]>('/employees');
    return Array.isArray(data) ? data : [];
  },

  /** Cria um novo funcionário */
  create: async (payload: CreateEmployeePayload): Promise<BackendEmployee> => {
    const { data } = await bnfixApi.post<BackendEmployee>('/employees', payload);
    return data;
  },

  /** Atualiza dados de um funcionário */
  update: async (id: number, payload: UpdateEmployeePayload): Promise<BackendEmployee> => {
    const { data } = await bnfixApi.put<BackendEmployee>(`/employees/${id}`, payload);
    return data;
  },

  /** Ativa um funcionário */
  activate: async (id: number): Promise<void> => {
    await bnfixApi.put('/employees/activate', null, { params: { employeeId: id } });
  },

  /** Desativa um funcionário */
  disable: async (id: number): Promise<void> => {
    await bnfixApi.put('/employees/disable', null, { params: { employeeId: id } });
  },
};
