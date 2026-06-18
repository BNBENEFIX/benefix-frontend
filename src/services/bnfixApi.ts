/**
 * Cliente HTTP principal para a API BNFix.
 *
 * - Base URL: proxy local do frontend (/api/bnfix)
 * - Autenticação: Bearer JWT armazenado no localStorage
 * - Interceptors: injeta token em todas as requests e trata erros 401/403
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = '/api/bnfix';

export const TOKEN_KEY = 'bnfix_jwt_token';
export const USER_KEY  = 'bnfix_user';

// ── Instância principal ──────────────────────────────────────────────────────

const bnfixApi = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 15_000,
});

// ── Request interceptor: injeta Bearer token ─────────────────────────────────

bnfixApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: tratamento centralizado de erros ───────────────────

bnfixApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        // A sessão é controlada pelo AuthContext. Não logamos 401 aqui para
        // evitar ruído quando a aplicação faz chamadas opcionais.
      }

      if (status === 403) {
        console.warn('[BNFix API] Acesso negado — role insuficiente para este recurso.');
      }
    }

    return Promise.reject(error);
  },
);

// ── Helpers de token ─────────────────────────────────────────────────────────

export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export default bnfixApi;
