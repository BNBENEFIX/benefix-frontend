import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '../types';
import {
  login as apiLogin,
  logout as apiLogout,
  fetchManagerProfile,
  buildUserFromToken,
} from '../services/authService';
import { TOKEN_KEY, USER_KEY, getToken } from '../services/bnfixApi';

// ── Contexto ──────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  /** Login real com email + senha contra a API BNFix */
  login: (email: string, password: string) => Promise<boolean>;
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

  // Inicializa sessão a partir do token salvo no localStorage
  useEffect(() => {
    const init = async () => {
      try {
        const storedToken = getToken();
        const storedUser  = localStorage.getItem(USER_KEY);

        if (storedToken) {
          setToken(storedToken);

          // Tenta hidratar o usuário a partir do token JWT
          const userFromToken = buildUserFromToken(storedToken);

          if (userFromToken) {
            // Se for MANAGER, busca dados mais ricos do backend
            if (userFromToken.backendRole === 'MANAGER') {
              try {
                const profile = await fetchManagerProfile();
                const enriched: User = { ...userFromToken, ...profile };
                setUser(enriched);
                localStorage.setItem(USER_KEY, JSON.stringify(enriched));
                return;
              } catch {
                // Usa dados do token mesmo sem o perfil completo
              }
            }
            setUser(userFromToken);
          } else if (storedUser) {
            setUser(JSON.parse(storedUser));
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

    // Escuta evento de sessão expirada emitido pelo interceptor do Axios
    const handleExpired = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('bnfix:session-expired', handleExpired);
    return () => window.removeEventListener('bnfix:session-expired', handleExpired);
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { user: loggedUser, token: jwt } = await apiLogin(email, password);
      setUser(loggedUser);
      setToken(jwt);

      // Se for MANAGER, enriquece com dados do backend
      if (loggedUser.backendRole === 'MANAGER') {
        const profile = await fetchManagerProfile();
        const enriched: User = { ...loggedUser, ...profile };
        setUser(enriched);
        localStorage.setItem(USER_KEY, JSON.stringify(enriched));
      }

      return true;
    } catch (err: any) {
      console.error('[AuthContext] Falha no login:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    setToken(null);
  }, []);

  // ── Refresh ────────────────────────────────────────────────────────────────

  const refreshUserData = useCallback(async () => {
    const storedToken = getToken();
    if (!storedToken) return;

    try {
      const refreshed = buildUserFromToken(storedToken);
      if (refreshed) {
        if (refreshed.backendRole === 'MANAGER') {
          const profile = await fetchManagerProfile();
          const enriched: User = { ...refreshed, ...profile };
          setUser(enriched);
          localStorage.setItem(USER_KEY, JSON.stringify(enriched));
          return;
        }
        setUser(refreshed);
      }
    } catch (err) {
      console.error('[AuthContext] Falha ao atualizar usuário:', err);
    }
  }, []);

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
