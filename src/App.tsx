import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './screens/LoginPage';
import { RegisterPage } from './screens/RegisterPage';
import { DashboardAdmin } from './screens/DashboardAdmin';
import { DashboardSupplier } from './screens/DashboardSupplier';
import { DashboardRH } from './screens/DashboardRH';
import { SharedBenefitsHub } from './screens/SharedBenefitsHub';
import { BenefitsCatalog } from './screens/BenefitsCatalog';
import { ProviderBenefitsConsole } from './components/ProviderBenefitsConsole';
import { LayoutDashboard, ShoppingBag, Loader2 } from 'lucide-react';

// ── Conteúdo principal (autenticado) ─────────────────────────────────────────

const AuthenticatedApp: React.FC = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'EMPLOYEE';
  const [activeTab, setActiveTab] = useState<'catalog' | 'dashboard'>(
    isEmployee ? 'catalog' : 'dashboard',
  );

  const renderDashboard = () => {
    if (!user) return null;
    switch (user.role) {
      case 'ADMIN':    return <DashboardAdmin />;
      case 'SUPPLIER': return <DashboardSupplier />;
      case 'COMPANY':  return <><ProviderBenefitsConsole /><DashboardRH /></>;
      case 'EMPLOYEE': return <SharedBenefitsHub />;
      default:         return null;
    }
  };

  const tabClass = (tab: typeof activeTab) =>
    activeTab === tab
      ? 'bg-[#173f32] text-white'
      : 'text-[#68746d] hover:bg-[#edf2ee] hover:text-[#173f32] dark:text-slate-300 dark:hover:bg-slate-800';

  return (
    <div className="flex flex-col min-h-screen bg-app transition-colors">
      <Navbar />

      {/* O colaborador tem uma única jornada; esconder abas duplicadas reduz
          decisões antes da ação principal "Mostrar QR Code". */}
      {!isEmployee && (
        <div className="border-b border-[#d8dfda] bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <div className="mx-auto flex max-w-[1180px] items-center gap-2 text-sm font-semibold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex h-10 items-center gap-2 rounded-lg px-4 transition-colors ${tabClass('dashboard')}`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Painel</span>
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex h-10 items-center gap-2 rounded-lg px-4 transition-colors ${tabClass('catalog')}`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{user?.role === 'COMPANY' ? 'Benefícios' : 'Catálogo'}</span>
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 bg-[#f5f6f2] dark:bg-slate-950/20 transition-colors">
        {isEmployee
          ? <SharedBenefitsHub />
          : activeTab === 'catalog'
            ? <BenefitsCatalog />
            : renderDashboard()}
      </main>
    </div>
  );
};

// ── Roteamento de autenticação ────────────────────────────────────────────────

type AuthScreen = 'login' | 'register';

const AppContent: React.FC<{ initialAuthScreen?: AuthScreen }> = ({ initialAuthScreen = 'login' }) => {
  const { user, loading } = useAuth();
  const [loggedIn, setLoggedIn]     = useState(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>(initialAuthScreen);

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

  // Tela de cadastro
  if (authScreen === 'register') {
    return (
      <RegisterPage
        onBackToLogin={() => setAuthScreen('login')}
        onRegisterSuccess={() => setAuthScreen('login')}
      />
    );
  }

  // Tela de login (com link para cadastro)
  return (
    <LoginPage
      onLoginSuccess={() => setLoggedIn(true)}
      onNavigateToRegister={() => setAuthScreen('register')}
    />
  );
};

// ── Root ─────────────────────────────────────────────────────────────────────

export default function App({ initialAuthScreen = 'login' }: { initialAuthScreen?: AuthScreen }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent initialAuthScreen={initialAuthScreen} />
      </AuthProvider>
    </ThemeProvider>
  );
}
