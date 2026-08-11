import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { BackendCompany, User } from '../types';
import {
  login as apiLogin,
  logout as apiLogout,
  switchCompany as apiSwitchCompany,
  fetchMe,
} from '../services/authService';
import { USER_KEY, LAST_ACTIVITY_KEY, hasSession } from '../services/bnfixApi';
import { companyService } from '../services/companyService';

const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

// ── Contexto ──────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  loading: boolean;
  companies: BackendCompany[];
  companiesLoading: boolean;
  switchingCompany: boolean;
  /** Login real com email + senha contra a API BNFix */
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  /** Recarrega as empresas ativas vinculadas à conta autenticada. */
  refreshCompanies: () => Promise<BackendCompany[]>;
  /** Troca o contexto do tenant; o novo JWT segue no cookie atualizado. */
  switchCompany: (companyId: number) => Promise<{ success: boolean; message?: string }>;
  /** Revalida a sessão (cookie httpOnly) e atualiza o usuário. */
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<BackendCompany[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [switchingCompany, setSwitchingCompany] = useState(false);

  const clearSession = useCallback(() => {
    apiLogout();
    setUser(null);
    setCompanies([]);
    setCompaniesLoading(false);
    setSwitchingCompany(false);
  }, []);

  const touchActivity = useCallback(() => {
    if (hasSession()) {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    }
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

  // Inicializa sessão validando o cookie httpOnly via /auth/me
  useEffect(() => {
    const init = async () => {
      try {
        const lastActivityRaw = localStorage.getItem(LAST_ACTIVITY_KEY);
        const lastActivity = lastActivityRaw ? Number(lastActivityRaw) : null;
        const idleTooLong = lastActivity ? Date.now() - lastActivity > SESSION_IDLE_TIMEOUT_MS : false;

        if (idleTooLong) {
          clearSession();
          return;
        }

        const me = await fetchMe();
        if (me) {
          setUser(me);
          if (me.role === 'COMPANY') {
            try {
              const availableCompanies = await refreshCompanies();
              const currentCompany = availableCompanies.find(
                (item) => String(item.id) === me.companyId,
              );
              if (currentCompany) {
                const enrichedUser = { ...me, companyName: currentCompany.name };
                setUser(enrichedUser);
                localStorage.setItem(USER_KEY, JSON.stringify(enrichedUser));
              }
            } catch (err) {
              console.warn('[AuthContext] Não foi possível carregar as empresas da conta:', err);
            }
          }
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
      const lastActivityRaw = localStorage.getItem(LAST_ACTIVITY_KEY);
      const lastActivity = lastActivityRaw ? Number(lastActivityRaw) : null;

      if (!lastActivity) {
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
  }, [clearSession, refreshCompanies, touchActivity]);

  // ── Login ──────────────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    try {
      const { user: loggedUser } = await apiLogin(email, password);
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
      const nextUser = await apiSwitchCompany(companyId);

      if (nextUser.companyId !== String(companyId)) {
        throw new Error('A empresa retornada pela nova sessão não corresponde à empresa selecionada.');
      }

      const selectedCompany = companies.find((item) => String(item.id) === nextUser.companyId);
      const mergedUser: User = {
        ...nextUser,
        name: user?.name ?? nextUser.name,
        avatarUrl: user?.avatarUrl,
        score: nextUser.score ?? user?.score,
        level: nextUser.level ?? user?.level,
        companyName: selectedCompany?.name ?? nextUser.companyName,
      };

      setUser(mergedUser);
      localStorage.setItem(USER_KEY, JSON.stringify(mergedUser));
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
    const me = await fetchMe();
    if (me) {
      const storedRaw = localStorage.getItem(USER_KEY);
      let stored: User | null = null;
      if (storedRaw) {
        try {
          stored = JSON.parse(storedRaw) as User;
        } catch {
          localStorage.removeItem(USER_KEY);
        }
      }
      const merged: User = {
        ...me,
        avatarUrl: stored?.avatarUrl,
        score: me.score ?? stored?.score,
        level: me.level ?? stored?.level,
      };
      setUser(merged);
      localStorage.setItem(USER_KEY, JSON.stringify(merged));
    } else {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
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