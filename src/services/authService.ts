/**
 * Serviço de autenticação — endpoint /auth/login da API BNFix.
 *
 * O backend retorna um JWT. Decodificamos o payload para extrair
 * role, nome e id sem precisar de chamadas extras de /me.
 */
import bnfixApi, { setToken, clearToken, USER_KEY } from './bnfixApi';
import type { LoginRequest, LoginResponse, BackendRole, User, UserRole } from '../types';

// ── Mapeamento de role do backend para role de UI ────────────────────────────

const backendRoleToUIRole = (role: BackendRole): UserRole => {
  switch (role) {
    case 'ADMIN':    return 'ADMIN';
    case 'MANAGER':  return 'COMPANY';  // Manager de empresa → dashboard RH
    case 'USER':     return 'EMPLOYEE';
    default:         return 'EMPLOYEE';
  }
};

// ── Decode seguro do payload JWT (sem verificação de assinatura) ─────────────

const decodeJwtPayload = (token: string): Record<string, any> | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(payload);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

// ── Constrói User a partir do token JWT decodificado ─────────────────────────

export const buildUserFromToken = (token: string, emailFallback?: string): User | null => {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && payload.exp <= nowInSeconds) {
    return null;
  }

  // Campos comuns em JWT Quarkus/Spring: sub, upn, groups[], roles[]
  const backendRole: BackendRole =
    payload.role ??
    payload['cognito:groups']?.[0] ??
    (Array.isArray(payload.groups) ? payload.groups[0] : null) ??
    (Array.isArray(payload.roles) ? payload.roles[0] : null) ??
    'USER';

  const uiRole = backendRoleToUIRole(backendRole as BackendRole);
  const stableId =
    payload.id ??
    payload.userId ??
    (uiRole === 'COMPANY' && payload.companyId ? payload.companyId : null) ??
    payload.sub ??
    emailFallback ??
    '';

  return {
    id:          String(stableId),
    name:        payload.name ?? payload.preferred_username ?? emailFallback?.split('@')[0] ?? 'Usuário',
    email:       payload.email ?? payload.upn ?? emailFallback ?? '',
    role:        uiRole,
    backendRole: backendRole as BackendRole,
    companyId:   payload.companyId ? String(payload.companyId) : undefined,
    companyName: payload.companyName ?? undefined,
    score:       uiRole === 'EMPLOYEE' ? 0 : undefined,
    level:       uiRole === 'EMPLOYEE' ? 'Bronze' : undefined,
  };
};

// ── Login real ───────────────────────────────────────────────────────────────

export const login = async (
  email: string,
  password: string,
): Promise<{ user: User; token: string }> => {
  const payload: LoginRequest = { email, password };
  const response = await bnfixApi.post<LoginResponse>('/auth/login', payload);

  const { data } = response;

  let token: string =
    typeof data === 'string'
      ? data
      : data.token ?? data.accessToken ?? data.access_token ?? '';

  // Fallback útil apenas em ambientes server-side; browsers não expõem Set-Cookie.
  if (!token) {
    const setCookieHeader = (response.headers['set-cookie'] as string | string[] | undefined);
    const cookieStr = Array.isArray(setCookieHeader)
      ? setCookieHeader.join('; ')
      : (setCookieHeader ?? '');
    const match = cookieStr.match(/(?:^|;\s*)jwt=([^;]+)/i);
    if (match) {
      token = match[1];
    }
  }

  if (!token) {
    throw new Error('Token não retornado pelo servidor. Verifique as credenciais.');
  }

  setToken(token);

  const user: User = buildUserFromToken(token, email) ?? {
    id:    email,
    name:  email.split('@')[0],
    email,
    role:  'EMPLOYEE',
    score: 0,
    level: 'Bronze',
  };

  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return { user, token };
};

// ── Busca dados do manager logado ─────────────────────────────────────────────

export const fetchManagerProfile = async (): Promise<Partial<User>> => {
  try {
    const { data } = await bnfixApi.get('/managers/me');
    return {
      id:          String(data.id),
      name:        data.name,
      email:       data.email,
      companyId:   data.companyId ? String(data.companyId) : undefined,
      companyName: data.companyName ?? undefined,
    };
  } catch {
    return {};
  }
};

// ── Logout ───────────────────────────────────────────────────────────────────

export const logout = () => {
  clearToken();
};
