/**
 * Serviço de autenticação — endpoints /auth/* da API BNFix.
 *
 * A sessão vive no cookie httpOnly `jwt` (gerenciado pelo browser/backend).
 * Nenhum token é lido ou armazenado pelo frontend. O perfil do usuário vem
 * no body do login/switch e via GET /auth/me (valida a sessão no reload).
 */
import bnfixApi, { USER_KEY, LAST_ACTIVITY_KEY } from './bnfixApi';
import type {
  AuthMeResponse,
  LoginRequest,
  SwitchCompanyRequest,
  BackendRole,
  User,
  UserRole,
} from '../types';

// ── Mapeamento de role do backend para role de UI ────────────────────────────

const backendRoleToUIRole = (role: BackendRole): UserRole => {
  switch (role) {
    case 'ADMIN':    return 'ADMIN';
    case 'MANAGER':  return 'COMPANY';  // Manager de empresa → dashboard RH
    case 'USER':     return 'EMPLOYEE';
    default:         return 'EMPLOYEE';
  }
};

// ── Mapeia AuthMeResponse (backend) → User (frontend) ────────────────────────

export const mapAuthMeToUser = (me: AuthMeResponse): User => {
  const uiRole = backendRoleToUIRole(me.role);
  return {
    id:          me.accountId ?? me.email,
    name:        me.name ?? me.email.split('@')[0],
    email:       me.email,
    role:        uiRole,
    backendRole: me.role,
    companyId:   me.companyId != null ? String(me.companyId) : undefined,
    companyName: me.companyName ?? undefined,
    score:       uiRole === 'EMPLOYEE' ? 0 : undefined,
    level:       uiRole === 'EMPLOYEE' ? 'Bronze' : undefined,
  };
};

// ── Login ─────────────────────────────────────────────────────────────────────

export const login = async (email: string, password: string): Promise<{ user: User }> => {
  const payload: LoginRequest = { email, password };
  const { data } = await bnfixApi.post<AuthMeResponse>('/auth/login', payload);

  const user = mapAuthMeToUser(data);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  return { user };
};

// ── Troca do tenant ativo ─────────────────────────────────────────────────────

export const switchCompany = async (companyId: number): Promise<User> => {
  const payload: SwitchCompanyRequest = { companyId };
  const { data } = await bnfixApi.post<AuthMeResponse>('/auth/switch-company', payload);

  const user = mapAuthMeToUser(data);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  return user;
};

// ── Valida a sessão no reload (cookie httpOnly não é legível por JS) ──────────

export const fetchMe = async (): Promise<User | null> => {
  try {
    const { data } = await bnfixApi.get<AuthMeResponse>('/auth/me');
    const user = mapAuthMeToUser(data);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    return user;
  } catch {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    return null;
  }
};

// ── Logout — revoga o token no backend e expira o cookie ──────────────────────

export const logout = async (): Promise<void> => {
  try {
    await bnfixApi.post('/auth/logout');
  } catch {
    // Mesmo falando a chamada (ex.: cookie já expirado), limpamos localmente.
  }
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
};