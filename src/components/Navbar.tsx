import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getRoleNamePT = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrador';
      case 'SUPPLIER': return 'Fornecedor';
      case 'COMPANY': return 'Gestor';
      default: return 'Colaborador';
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3 transition-colors sm:px-6">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <img
            src="/favicon.png"
            alt="BNFix"
            className="h-10 w-10 rounded-lg object-contain"
          />
          <div>
            <span className="block text-base font-semibold leading-none text-[var(--ink)]">BNFix</span>
            <span className="mt-1 block text-[11px] text-[var(--muted)]">
              Benefícios corporativos
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
            aria-label="Alternar tema"
          >
            {theme === 'light'
              ? <Moon className="h-5 w-5" />
              : <Sun className="h-5 w-5" />}
          </button>

          {user && (
            <div className="flex items-center gap-2 border-l border-[var(--line)] pl-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand-strong)]">
                {user.name?.charAt(0).toUpperCase()}
              </span>
              <div className="hidden text-left md:block">
                <span className="block max-w-40 truncate text-sm font-semibold text-[var(--ink)]">
                  {user.name}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--muted)]">
                  {getRoleNamePT(user.role)}
                </span>
              </div>
              <button
                onClick={logout}
                className="ml-1 flex h-9 items-center gap-2 rounded-lg px-2 text-[var(--muted)] hover:bg-[#fff1ef] hover:text-[#a33f35] dark:hover:bg-red-950/40 dark:hover:text-red-300"
                aria-label="Sair da conta"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden text-sm font-medium sm:inline">Sair</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
