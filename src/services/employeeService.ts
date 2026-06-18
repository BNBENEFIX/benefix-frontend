/**
 * Serviço de Funcionários — endpoints /employees/* da API BNFix.
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
    try {
      const { data } = await bnfixApi.get<BackendEmployee[]>('/employees');
      const result = Array.isArray(data) ? data : [];
      console.log(`[employeeService] list → ${result.length} funcionário(s)`);
      return result;
    } catch (err: any) {
      console.error('[employeeService] list FALHOU:', err?.response?.status, err?.response?.data);
      throw err;
    }
  },

  /** Cria um novo funcionário.
   *  O backend pode retornar 201 com o objeto criado OU 201 sem body.
   *  Tratamos ambos os casos.
   */
  create: async (payload: CreateEmployeePayload): Promise<BackendEmployee> => {
    console.log('[employeeService] create payload:', payload);
    try {
      const response = await bnfixApi.post('/employees', payload, {
        // Aceita qualquer content-type na resposta para evitar erro de parse
        // quando o backend retorna 201 sem body ou com body vazio
        transformResponse: [(data) => {
          if (!data || data.trim() === '') return {};
          try { return JSON.parse(data); } catch { return {}; }
        }],
      });
      console.log('[employeeService] create → status:', response.status, 'body:', response.data);
      // Se o backend não retornou dados, monta um objeto mínimo com o payload
      const created: BackendEmployee = response.data?.id
        ? response.data
        : { id: 0, ...payload } as any;
      return created;
    } catch (err: any) {
      console.error('[employeeService] create FALHOU:', err?.response?.status, err?.response?.data);
      throw err;
    }
  },

  /** Atualiza dados de um funcionário */
  update: async (id: number, payload: UpdateEmployeePayload): Promise<BackendEmployee> => {
    const { data } = await bnfixApi.put<BackendEmployee>(`/employees/${id}`, payload);
    return data;
  },

  /** Ativa um funcionário */
  activate: async (id: number): Promise<void> => {
    console.log('[employeeService] activate id:', id);
    await bnfixApi.put('/employees/activate', {}, { params: { employeeId: id } });
  },

  /** Desativa um funcionário */
  disable: async (id: number): Promise<void> => {
    console.log('[employeeService] disable id:', id);
    await bnfixApi.put('/employees/disable', {}, { params: { employeeId: id } });
  },
};
