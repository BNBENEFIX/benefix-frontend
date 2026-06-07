import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ChatbotWidget } from './components/ChatbotWidget';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardAdmin } from './pages/DashboardAdmin';
import { DashboardSupplier } from './pages/DashboardSupplier';
import { DashboardRH } from './pages/DashboardRH';
import { DashboardEmployee } from './pages/DashboardEmployee';
import { BenefitsCatalog } from './pages/BenefitsCatalog';
import { LayoutDashboard, ShoppingBag, Globe, Loader2 } from 'lucide-react';

// ── Conteúdo principal (autenticado) ─────────────────────────────────────────

const AuthenticatedApp: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'landing' | 'catalog' | 'dashboard'>('landing');

  const renderDashboard = () => {
    if (!user) return null;
    switch (user.role) {
      case 'ADMIN':    return <DashboardAdmin />;
      case 'SUPPLIER': return <DashboardSupplier />;
      case 'COMPANY':  return <DashboardRH />;
      case 'EMPLOYEE': return <DashboardEmployee />;
      default:         return null;
    }
  };

  const tabClass = (tab: typeof activeTab) =>
    activeTab === tab
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/15'
      : 'hover:bg-slate-800/50 hover:text-white dark:hover:bg-slate-800/50 text-slate-400';

  return (
    <div className="flex flex-col min-h-screen bg-app transition-colors">
      <Navbar />

      {/* Barra de navegação entre áreas */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3 px-6 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-end gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('landing')}
            className={`p-2 px-4 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${tabClass('landing')}`}
          >
            <Globe className="w-4 h-4" />
            <span>Início</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`p-2 px-4 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${tabClass('catalog')}`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Catálogo</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`p-2 px-4 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${tabClass('dashboard')}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Meu Painel</span>
          </button>
        </div>
      </div>

      <main className="flex-1 bg-slate-50/50 dark:bg-slate-950/20 transition-colors">
        {activeTab === 'landing'    && <LandingPage onNavigateToDashboardByRole={() => setActiveTab('catalog')} />}
        {activeTab === 'catalog'    && <BenefitsCatalog />}
        {activeTab === 'dashboard'  && renderDashboard()}
      </main>

      <ChatbotWidget />
      <Footer />
    </div>
  );
};

// ── Roteamento de autenticação ────────────────────────────────────────────────

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [loggedIn, setLoggedIn] = useState(false);

  // Spinner global enquanto carrega sessão
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Carregando sessão...
          </span>
        </div>
      </div>
    );
  }

  // Se há usuário autenticado (via token JWT salvo) ou acabou de logar
  if (user || loggedIn) {
    return <AuthenticatedApp />;
  }

  // Tela de login
  return <LoginPage onLoginSuccess={() => setLoggedIn(true)} />;
};

// ── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
