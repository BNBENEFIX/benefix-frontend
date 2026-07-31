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
  // Não usamos withCredentials pois o cookie jwt é injetado manualmente
  // no interceptor de request (o backend está em outro domínio via proxy)
  withCredentials: false,
  timeout: 15_000,
});

// ── Request interceptor ───────────────────────────────────────────────────────
// Remove o header Cookie — browsers bloqueiam esse header manualmente
// (erro "Foi negada a tentativa de definir um cabeçalho proibido: Cookie").
// O backend Quarkus aceita autenticação via Authorization: Bearer <token>.

bnfixApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const requestPath = config.url?.split('?')[0].replace(/\/+$/, '');
  const isLoginRequest = requestPath === '/auth/login';

  if (token && !isLoginRequest && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
    // NÃO setar config.headers['Cookie'] — header proibido em browsers
  }
  return config;
});

// ── Response interceptor: tratamento centralizado de erros ───────────────────

bnfixApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response;
      const requestPath = error.config?.url?.split('?')[0].replace(/\/+$/, '');

      // Uma sessão rejeitada não deve continuar presa no navegador. O login
      // fica de fora para preservar a mensagem de credenciais incorretas.
      if (status === 401 && requestPath !== '/auth/login') {
        clearToken();
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
