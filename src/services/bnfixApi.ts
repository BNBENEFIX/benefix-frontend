/**
 * Cliente HTTP principal para a API BNFix.
 *
 * - Base URL: https://api.bnfix.com.br (direto do browser)
 * - Autenticação: cookie httpOnly `jwt` enviado automaticamente pelo browser
 *   (withCredentials: true). Nenhum token vive no localStorage/JS.
 * - Interceptors: trata erros 401/403 limpando a sessão
 */
import axios, { AxiosError } from 'axios';

export const USER_KEY = 'bnfix_user';
export const LAST_ACTIVITY_KEY = 'bnfix_last_activity';

// ── Instância principal ──────────────────────────────────────────────────────

const bnfixApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'https://api.bnfix.com.br',
  headers: { 'Content-Type': 'application/json' },
  // Cookie httpOnly flui automaticamente entre bnfix.com.br e api.bnfix.com.br
  // (mesmo site). Essencial para enviar o cookie cross-origin.
  withCredentials: true,
  timeout: 15_000,
});

// ── Response interceptor: tratamento centralizado de erros ───────────────────

bnfixApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response;
      const requestPath = error.config?.url?.split('?')[0].replace(/\/+$/, '');
      const isCredentialConfirmation = requestPath === '/companies/me/deactivate';

      // Uma sessão rejeitada não deve continuar presa no navegador. O login
      // e confirmações por senha ficam de fora para preservar o erro no formulário.
      if (status === 401 && requestPath !== '/auth/login' && !isCredentialConfirmation) {
        clearSession();
      }
    }

    return Promise.reject(error);
  },
);

// ── Helpers de sessão (sem token) ────────────────────────────────────────────

export const clearSession = () => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
};

export const hasSession = (): boolean => {
  return localStorage.getItem(USER_KEY) !== null;
};

export default bnfixApi;