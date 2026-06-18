import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '../types';
import {
  login as apiLogin,
  logout as apiLogout,
  buildUserFromToken,
} from '../services/authService';
import { TOKEN_KEY, USER_KEY, getToken } from '../services/bnfixApi';

const LAST_ACTIVITY_KEY = 'bnfix_last_activity';
const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

// ── Contexto ──────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  /** Login real com email + senha contra a API BNFix */
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  /** Atualiza dados do usuário a partir do token armazenado */
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]   = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    apiLogout();
    setUser(null);
    setToken(null);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  }, []);

  const touchActivity = useCallback(() => {
    if (getToken()) {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    }
  }, []);

  const hydrateUserFromStorage = useCallback((storedToken: string, storedUserRaw: string | null): User | null => {
    const tokenUser = buildUserFromToken(storedToken);
    const storedUser = storedUserRaw ? (JSON.parse(storedUserRaw) as User) : null;

    if (tokenUser && storedUser) {
      const mergedUser: User = {
        ...tokenUser,
        ...storedUser,
        backendRole: tokenUser.backendRole ?? storedUser.backendRole,
        role: tokenUser.role ?? storedUser.role,
      };
      localStorage.setItem(USER_KEY, JSON.stringify(mergedUser));
      return mergedUser;
    }

    if (tokenUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(tokenUser));
      return tokenUser;
    }

    return storedUser;
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
          setToken(storedToken);
          const hydratedUser = hydrateUserFromStorage(storedToken, storedUser);
          if (hydratedUser) {
            setUser(hydratedUser);
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
  }, [clearSession, hydrateUserFromStorage, touchActivity]);

  // ── Login ──────────────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    try {
      const { user: loggedUser, token: jwt } = await apiLogin(email, password);
      setUser(loggedUser);
      setToken(jwt);
      touchActivity();

      localStorage.setItem(USER_KEY, JSON.stringify(loggedUser));

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
  }, [touchActivity]);

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

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
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUserData }}>
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
