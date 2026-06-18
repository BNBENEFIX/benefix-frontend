import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, LogOut, Trophy } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-amber-500 text-white';
      case 'SUPPLIER': return 'bg-indigo-500 text-white';
      case 'COMPANY': return 'bg-blue-500 text-white';
      default: return 'bg-emerald-500 text-white';
    }
  };

  const getRoleNamePT = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'ADMIN PLATAFORMA';
      case 'SUPPLIER': return 'FORNECEDOR';
      case 'COMPANY': return 'GESTOR RH';
      default: return 'COLABORADOR';
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md px-6 py-4 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <a href="/" className="flex items-center gap-2 group">
          <img
            src="/favicon.png"
            alt="BNFix"
            className="w-11 h-11 rounded-xl object-contain group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <span className="font-display font-bold text-lg text-slate-800 dark:text-neutral-50 tracking-tight leading-none">BNFix</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Benefícios Corporativos</span>
          </div>
        </a>

        {/* Desktop Controls */}
        <div className="flex items-center gap-4">

          {/* Theme Toggler */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            aria-label="Alternar Tema"
          >
            {theme === 'light' ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
          </button>

          {/* Score tracker for Employee role */}
          {user?.role === 'EMPLOYEE' && user.score !== undefined && (
            <div className="hidden sm:flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 rounded-xl border border-amber-100 dark:border-amber-900/30">
              <Trophy className="w-4 h-4 text-amber-500 animate-bounce" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Nível {user.level}</span>
                <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 leading-none mt-0.5">{user.score} pts</span>
              </div>
            </div>
          )}

          {/* User badge */}
          {user && (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/20"
              />
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{user.name}</span>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md mt-0.5 tracking-wider self-start ${getRoleColor(user.role)}`}>
                  {getRoleNamePT(user.role)}
                </span>
              </div>
              
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all ml-1 shrink-0 cursor-pointer"
                title="Desconectar"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          )}

        </div>
      </div>
    </nav>
  );
};
