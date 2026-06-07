import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, LogOut, Sparkles, UserCheck, ShieldCheck, ShoppingBag, Trophy } from 'lucide-react';
import { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const { user, switchProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const roles: { role: UserRole; label: string; desc: string; color: string }[] = [
    { role: 'EMPLOYEE', label: 'Funcionário', desc: 'Solicitar, favoritar, visualizar cupons e pontuação', color: 'bg-emerald-500' },
    { role: 'COMPANY', label: 'Gestor RH (Empresa)', desc: 'Contratar benefícios, aprovar/rejeitar solicitações, comunicados', color: 'bg-blue-500' },
    { role: 'SUPPLIER', label: 'Fornecedor', desc: 'Cadastrar benefícios, gerenciar cupons e vouchers', color: 'bg-indigo-500' },
    { role: 'ADMIN', label: 'Admin Global', desc: 'Aprovar empresas, gerenciar categorias e métricas', color: 'bg-amber-500' },
  ];

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
      case 'COMPANY': return 'GESTOR RH (Acme)';
      default: return 'COLABORADOR (Acme)';
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md px-6 py-4 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <a href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/10 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-lg text-slate-800 dark:text-neutral-50 tracking-tight leading-none">BeneficiSaaS</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Inteligência Analítica</span>
          </div>
        </a>

        {/* Desktop Controls */}
        <div className="flex items-center gap-4">
          
          {/* Quick Sandbox Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-500/50 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40 transition-colors shadow-sm animate-pulse cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Simular Perfil SaaS: <strong className="underline">{user?.role}</strong></span>
            </button>
            
            {showRoleSwitcher && (
              <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-2.5 z-50">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                  Visualizar as 4 perspectivas da plataforma
                </div>
                <div className="space-y-1.5 mt-2">
                  {roles.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        switchProfile(r.role);
                        setShowRoleSwitcher(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 flex gap-2.5 items-start cursor-pointer ${
                        user?.role === r.role ? 'bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50' : 'border border-transparent'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${r.color}`} />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                          <span>{r.label}</span>
                          {user?.role === r.role && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">Simulando</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">{r.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

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
