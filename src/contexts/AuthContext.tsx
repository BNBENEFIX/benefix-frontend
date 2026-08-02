import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { BackendCompany, User } from '../types';
import {
  login as apiLogin,
  logout as apiLogout,
  switchCompany as apiSwitchCompany,
  buildUserFromToken,
} from '../services/authService';
import { TOKEN_KEY, USER_KEY, getToken } from '../services/bnfixApi';
import { companyService } from '../services/companyService';

const LAST_ACTIVITY_KEY = 'bnfix_last_activity';
const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

// ── Contexto ──────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  companies: BackendCompany[];
  companiesLoading: boolean;
  switchingCompany: boolean;
  /** Login real com email + senha contra a API BNFix */
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  /** Recarrega as empresas ativas vinculadas à conta autenticada. */
  refreshCompanies: () => Promise<BackendCompany[]>;
  /** Troca o contexto do tenant e substitui o JWT da sessão. */
  switchCompany: (companyId: number) => Promise<{ success: boolean; message?: string }>;
  /** Atualiza dados do usuário a partir do token armazenado */
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]   = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<BackendCompany[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [switchingCompany, setSwitchingCompany] = useState(false);

  const clearSession = useCallback(() => {
    apiLogout();
    setUser(null);
    setToken(null);
    setCompanies([]);
    setCompaniesLoading(false);
    setSwitchingCompany(false);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  }, []);

  const touchActivity = useCallback(() => {
    if (getToken()) {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    }
  }, []);

  const hydrateUserFromStorage = useCallback((storedToken: string, storedUserRaw: string | null): User | null => {
    const tokenUser = buildUserFromToken(storedToken);
    let storedUser: User | null = null;

    if (storedUserRaw) {
      try {
        storedUser = JSON.parse(storedUserRaw) as User;
      } catch {
        localStorage.removeItem(USER_KEY);
      }
    }

    if (tokenUser && storedUser) {
      // Identity, role and tenant are security context: the JWT is always
      // authoritative. The cached object may only restore cosmetic fields.
      const sameStoredAccount = typeof storedUser.email === 'string'
        && storedUser.email.toLowerCase() === tokenUser.email.toLowerCase();
      const mergedUser: User = {
        ...tokenUser,
        name: sameStoredAccount && typeof storedUser.name === 'string'
          ? storedUser.name
          : tokenUser.name,
        avatarUrl: sameStoredAccount && typeof storedUser.avatarUrl === 'string'
          ? storedUser.avatarUrl
          : undefined,
        score: tokenUser.score ?? (sameStoredAccount && typeof storedUser.score === 'number'
          ? storedUser.score
          : undefined),
        level: tokenUser.level ?? (sameStoredAccount ? storedUser.level : undefined),
      };
      localStorage.setItem(USER_KEY, JSON.stringify(mergedUser));
      return mergedUser;
    }

    if (tokenUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(tokenUser));
      return tokenUser;
    }

    return null;
  }, []);

  const refreshCompanies = useCallback(async (): Promise<BackendCompany[]> => {
    setCompaniesLoading(true);
    try {
      const availableCompanies = await companyService.listMine();
      setCompanies(availableCompanies);
      return availableCompanies;
    } finally {
      setCompaniesLoading(false);
    }
  }, []);

  // Inicializa sessão a partir do token salvo no localStorage
  useEffect(() => {
    const init = async () => {
      try {
        const storedToken = getToken();
        const storedUser  = localStorage.getItem(USER_KEY);
        const lastActivityRaw = localStorage.getItem(LAST_ACTIVITY_KEY);
        const lastActivity = lastActivityRaw ? Number(lastActivityRaw) : null;
        const idleTooLong = lastActivity ? Date.now() - lastActivity > SESSION_IDLE_TIMEOUT_MS : false;

        if (storedToken && idleTooLong) {
          clearSession();
          return;
        }

        if (storedToken && !lastActivityRaw) {
          localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
        }

        if (storedToken) {
          const hydratedUser = hydrateUserFromStorage(storedToken, storedUser);
          if (hydratedUser) {
            setToken(storedToken);
            setUser(hydratedUser);
            if (hydratedUser.role === 'COMPANY') {
              try {
                const availableCompanies = await refreshCompanies();
                const currentCompany = availableCompanies.find(
                  (item) => String(item.id) === hydratedUser.companyId,
                );
                if (currentCompany) {
                  const enrichedUser = { ...hydratedUser, companyName: currentCompany.name };
                  setUser(enrichedUser);
                  localStorage.setItem(USER_KEY, JSON.stringify(enrichedUser));
                }
              } catch (err) {
                console.warn('[AuthContext] Não foi possível carregar as empresas da conta:', err);
              }
            }
          } else {
            clearSession();
          }
        } else if (storedUser) {
          // Sem token mas com user salvo — sessão inválida, limpa
          localStorage.removeItem(USER_KEY);
        }
      } catch (err) {
        console.error('[AuthContext] Erro ao inicializar sessão:', err);
      } finally {
        setLoading(false);
      }
    };

    init();

    const activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'] as const;
    const handleActivity = () => touchActivity();

    activityEvents.forEach((eventName) => window.addEventListener(eventName, handleActivity, { passive: true }));

    const intervalId = window.setInterval(() => {
      const storedToken = getToken();
      const lastActivityRaw = localStorage.getItem(LAST_ACTIVITY_KEY);
      const lastActivity = lastActivityRaw ? Number(lastActivityRaw) : null;

      if (!storedToken || !lastActivity) {
        return;
      }

      if (Date.now() - lastActivity > SESSION_IDLE_TIMEOUT_MS) {
        clearSession();
      }
    }, 60_000);

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
      window.clearInterval(intervalId);
    };
  }, [clearSession, hydrateUserFromStorage, refreshCompanies, touchActivity]);

  // ── Login ──────────────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    try {
      const { user: loggedUser, token: jwt } = await apiLogin(email, password);
      let nextUser = loggedUser;

      if (loggedUser.role === 'COMPANY') {
        try {
          const availableCompanies = await refreshCompanies();
          const currentCompany = availableCompanies.find(
            (item) => String(item.id) === loggedUser.companyId,
          );
          if (currentCompany) {
            nextUser = { ...loggedUser, companyName: currentCompany.name };
          }
        } catch (err) {
          console.warn('[AuthContext] Login concluído, mas a lista de empresas não carregou:', err);
        }
      } else {
        setCompanies([]);
      }

      setUser(nextUser);
      setToken(jwt);
      touchActivity();

      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));

      return { success: true };
    } catch (err: any) {
      console.error('[AuthContext] Falha no login:', err);
      const status  = err?.response?.status;
      const backendMsg: string = err?.response?.data?.message ?? '';

      if (backendMsg.toLowerCase().includes('disabled')) {
        return {
          success: false,
          message: 'Esta conta está desativada. Peça ao administrador para ativá-la.',
        };
      }

      if (status === 401 || status === 404) {
        return {
          success: false,
          message: 'E-mail ou senha incorretos.',
        };
      }

      if (backendMsg) {
        return { success: false, message: backendMsg };
      }

      return {
        success: false,
        message: 'Não foi possível entrar agora. Tente novamente em instantes.',
      };
    } finally {
      setLoading(false);
    }
  }, [refreshCompanies, touchActivity]);

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  // ── Troca de empresa ───────────────────────────────────────────────────────

  const switchCompany = useCallback(async (
    companyId: number,
  ): Promise<{ success: boolean; message?: string }> => {
    if (!Number.isFinite(companyId) || companyId <= 0) {
      return { success: false, message: 'Empresa inválida.' };
    }

    if (String(companyId) === user?.companyId) {
      return { success: true };
    }

    setSwitchingCompany(true);
    try {
      const jwt = await apiSwitchCompany(companyId);
      const tokenUser = buildUserFromToken(jwt, user?.email);

      if (!tokenUser) {
        throw new Error('A nova sessão não pôde ser validada.');
      }

      if (tokenUser.companyId !== String(companyId)) {
        throw new Error('A empresa retornada pela nova sessão não corresponde à empresa selecionada.');
      }

      const selectedCompany = companies.find((item) => String(item.id) === tokenUser.companyId);
      const sameAccount = user?.email.toLowerCase() === tokenUser.email.toLowerCase();
      const nextUser: User = {
        ...tokenUser,
        name: sameAccount ? (user?.name ?? tokenUser.name) : tokenUser.name,
        avatarUrl: user?.avatarUrl,
        score: tokenUser.score ?? user?.score,
        level: tokenUser.level ?? user?.level,
        companyName: selectedCompany?.name ?? tokenUser.companyName,
      };

      localStorage.setItem(TOKEN_KEY, jwt);
      setToken(jwt);
      setUser(nextUser);
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      touchActivity();

      return { success: true };
    } catch (err: any) {
      console.error('[AuthContext] Falha ao trocar de empresa:', err);
      const backendMsg: string = err?.response?.data?.message ?? '';
      return {
        success: false,
        message: backendMsg || 'Não foi possível trocar de empresa. Tente novamente.',
      };
    } finally {
      setSwitchingCompany(false);
    }
  }, [companies, touchActivity, user]);

  // ── Refresh ────────────────────────────────────────────────────────────────

  const refreshUserData = useCallback(async () => {
    const storedToken = getToken();
    if (!storedToken) return;

    try {
      const refreshed = hydrateUserFromStorage(storedToken, localStorage.getItem(USER_KEY));
      if (refreshed) {
        setUser(refreshed);
      }
    } catch (err) {
      console.error('[AuthContext] Falha ao atualizar usuário:', err);
    }
  }, [hydrateUserFromStorage]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      companies,
      companiesLoading,
      switchingCompany,
      login,
      logout,
      refreshCompanies,
      switchCompany,
      refreshUserData,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};
